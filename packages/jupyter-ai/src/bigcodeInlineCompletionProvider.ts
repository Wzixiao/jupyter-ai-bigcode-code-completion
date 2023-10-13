import {
  CompletionHandler,
  HistoryInlineCompletionProvider,
  // ICompletionContext,
  IInlineCompletionContext,
  IInlineCompletionItem,
  IInlineCompletionList,
  IInlineCompletionProvider
} from '@jupyterlab/completer';
import { NotebookPanel } from '@jupyterlab/notebook';
import { nullTranslator, TranslationBundle } from '@jupyterlab/translation';
import { getNotebookContentCursor } from './utils/cell-context';
import { constructContinuationPrompt } from './utils/bigcode-request';
import CodeCompletionContextStore from './contexts/code-completion-context-store';

type BigCodeStream = {
  token: {
    id: number;
    text: string;
    logprob: number;
    special: boolean;
  };
  generated_text: string | null;
  details: null;
};

export class BigcodeInlineCompletionProvider
  implements IInlineCompletionProvider
{
  readonly identifier = '@jupyterlab/inline-completer:bigcode';
  private _trans: TranslationBundle;
  private _lastRequestInfo: { prompt: string; insertText: string } = {
    prompt: '',
    insertText: ''
  };
  private _requesting = false;
  private _stop = false;

  constructor(protected options: HistoryInlineCompletionProvider.IOptions) {
    const translator = options.translator || nullTranslator;
    this._trans = translator.load('jupyterlab');
  }

  get name(): string {
    return this._trans.__('Bigcode');
  }

  async fetch(
    request: CompletionHandler.IRequest,
    context: IInlineCompletionContext
  ): Promise<IInlineCompletionList<IInlineCompletionItem>> {
    if (!CodeCompletionContextStore.enableCodeCompletion) {
      return { items: [] };
    }

    if (!CodeCompletionContextStore.accessToken) {
      alert('Huggingface Access Token not set.');
      return { items: [] };
    }

    const items: IInlineCompletionItem[] = [];
    if (context.widget instanceof NotebookPanel) {
      const widget = context.widget as NotebookPanel;
      const notebookCellContent = getNotebookContentCursor(widget);
      const prompt = constructContinuationPrompt(notebookCellContent, 20);

      if (!prompt) {
        return {
          items: []
        };
      }

      const lastPrompt = this._lastRequestInfo.prompt;
      const lastInsertText = this._lastRequestInfo.insertText;

      if (lastPrompt !== '' && prompt.indexOf(lastPrompt) !== -1) {
        const userInsertText = prompt.replace(lastPrompt, '');

        if (lastInsertText.startsWith(userInsertText)) {
          this._stop = true;
          return {
            items: [
              {
                isIncomplete: false,
                insertText: lastInsertText.replace(userInsertText, '')
              }
            ]
          };
        }
      }

      this._lastRequestInfo = { prompt, insertText: '' };
      items.push({
        token: prompt,
        isIncomplete: true,
        insertText: ''
      });
    }
    return { items };
  }

  // private async _debounceFetch(
  //   prompt: string
  // ): Promise<IInlineCompletionList<IInlineCompletionItem>> {
  //   this._lastRequestInfo = { prompt, insertText: '' };
  //   this._requesting = false;
  //   this._stop = false;

  //   return {
  //     items: [
  //       {
  //         token: prompt,
  //         isIncomplete: true,
  //         insertText: ''
  //       }
  //     ]
  //   };
  // }

  // async *stream(
  //   token: string
  // ): AsyncGenerator<{ response: IInlineCompletionItem }, undefined, unknown> {
  //   const delay = (ms: number) =>
  //     new Promise(resolve => setTimeout(resolve, ms));
  //   console.log(this._requesting);
  //   const testResultText =
  //     'print("Hello World")\nhello_world()\n    print("Hello World")\nhello_world()\n    print("Hello World")\nhello_world()\n    print("Hello World")\nhello_world()';

  //   for (let i = 1; i < testResultText.length - 1; i++) {
  //     await delay(25);

  //     if (this._stop) {
  //       this._requesting = false;
  //       this._stop = false;
  //       yield {
  //         response: {
  //           isIncomplete: false,
  //           insertText: this._lastRequestInfo.insertText
  //         }
  //       };
  //       return;
  //     }

  //     const insertChar = testResultText.slice(i - 1, i);
  //     this._lastRequestInfo.insertText += insertChar;
  //     yield {
  //       response: {
  //         isIncomplete: i !== testResultText.length - 1,
  //         insertText: this._lastRequestInfo.insertText
  //       }
  //     };
  //   }

  //   this._requesting = false;
  // }

  async *stream(
    token: string
  ): AsyncGenerator<{ response: IInlineCompletionItem }, undefined, unknown> {
    if (token === '' || this._requesting) {
      return;
    }

    this._requesting = true;

    const bodyData = {
      inputs: token,
      stream: true,
      parameters: {
        temperature: 0.01,
        return_full_text: false,
        max_tokens: 20,
        stop: ['<jupyter_output>']
      }
    };

    const response = await fetch(CodeCompletionContextStore.bigcodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + CodeCompletionContextStore.accessToken
      },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok || !response.body) {
      this._requesting = false;
      this._stop = false;
      yield {
        response: {
          token: token,
          isIncomplete: false,
          insertText: ''
        }
      };
      return;
    }

    const data: ReadableStream<Uint8Array> | null = response.body;

    if (!data) {
      this._requesting = false;
      this._stop = false;
      yield {
        response: {
          token: token,
          isIncomplete: false,
          insertText: ''
        }
      };
      return;
    }

    const decoder = new TextDecoder();
    const reader = data.getReader();

    while (true) {
      const { value, done } = await reader.read();

      if (done || this._stop) {
        this._requesting = false;
        this._stop = false;
        break;
      }

      const strValue = decoder.decode(value, { stream: true });

      const jsonStrList = strValue.split('data:');

      for (const chunk of jsonStrList) {
        if (chunk !== '') {
          const chunkData = JSON.parse(chunk) as BigCodeStream;
          const done = chunkData.token.special;

          if (done) {
            this._stop = false;
            this._requesting = false;
          } else {
            this._lastRequestInfo.insertText += chunkData.token.text;
          }

          yield {
            response: {
              isIncomplete: !chunkData.token.special,
              insertText: this._lastRequestInfo.insertText
            }
          };
        }
      }
    }
  }
}
