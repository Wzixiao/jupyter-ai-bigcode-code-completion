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
// import CodeCompletionContextStore from './contexts/code-completion-context-store';

// const { bigcodeUrl } = CodeCompletionContextStore;

// type fetchResponse = { generated_text: string }[];

// type BigCodeStream = {
//   token: {
//     id: number;
//     text: string;
//     logprob: number;
//     special: boolean;
//   };
//   generated_text: string | null;
//   details: null;
// };

export class BigcodeInlineCompletionProvider
  implements IInlineCompletionProvider
{
  readonly identifier = '@jupyterlab/inline-completer:bigcode';
  private _trans: TranslationBundle;
  private _history: { prompt: string; insertText: string }[] = [];
  private _requesting = false;

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

      const lastHistory =
        this._history.length === 0
          ? null
          : this._history[this._history.length - 1];

      console.log('_requesting', this._requesting);
      console.log('prompt', prompt);
      console.log('lastHistory', lastHistory);

      if (lastHistory) {
        if (prompt.indexOf(lastHistory.prompt) !== -1) {
          const userInsertText = prompt.replace(lastHistory.prompt, '');
          if (lastHistory.insertText.startsWith(userInsertText)) {
            return {
              items: [
                {
                  isIncomplete: false,
                  insertText: lastHistory.insertText.replace(userInsertText, '')
                }
              ]
            };
          }
        }
      }

      this._history.push({
        prompt: prompt,
        insertText: ''
      });
      items.push({
        token: prompt,
        isIncomplete: true,
        insertText: ''
      });
    }
    return { items };
  }

  async *stream(
    token: string
  ): AsyncGenerator<{ response: IInlineCompletionItem }, undefined, unknown> {
    let fullTotal = 0;
    this._requesting = true;

    const testResultText =
      'print("Hello World")\nhello_world()\n    print("Hello World")\nhello_world()\n    print("Hello World")\nhello_world()\n    print("Hello World")\nhello_world()';

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 25));
      fullTotal += 1;
      const newHistory = this._history;
      newHistory[newHistory.length - 1].insertText = testResultText.slice(
        0,
        fullTotal
      );
      this._history = newHistory;

      if (fullTotal > 150) {
        this._requesting = false;
        yield {
          response: {
            isIncomplete: true,
            insertText: testResultText.slice(0, fullTotal)
          }
        };
        return;
      }

      yield {
        response: {
          isIncomplete: false,
          insertText: testResultText.slice(0, fullTotal)
        }
      };
    }
  }

  // async *stream(
  //   token: string
  // ): AsyncGenerator<{ response: IInlineCompletionItem }, undefined, unknown> {
  //   if (token === '') {
  //     return;
  //   }

  //   this._requesting = true;

  //   const bodyData = {
  //     inputs: token,
  //     stream: true,
  //     parameters: {
  //       temperature: 0.01,
  //       return_full_text: false,
  //       max_tokens: 20,
  //       stop: ['<jupyter_output>']
  //     }
  //   };

  //   const response = await fetch(bigcodeUrl, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(bodyData)
  //   });

  //   if (!response.ok || !response.body) {
  //     this._requesting = false;
  //     yield {
  //       response: {
  //         token: token,
  //         isIncomplete: false,
  //         insertText: ''
  //       }
  //     };
  //     return;
  //   }

  //   const data: ReadableStream<Uint8Array> | null = response.body;

  //   if (!data) {
  //     this._requesting = false;
  //     yield {
  //       response: {
  //         token: token,
  //         isIncomplete: false,
  //         insertText: ''
  //       }
  //     };
  //     return;
  //   }

  //   const decoder = new TextDecoder();
  //   const reader = data.getReader();
  //   let reponseTokenText = '';

  //   while (true) {
  //     const { value, done } = await reader.read();

  //     if (done) {
  //       this._requesting = false;
  //       break;
  //     }

  //     const strValue = decoder.decode(value, { stream: true });

  //     const jsonStrList = strValue.split('data:');

  //     for (const chunk of jsonStrList) {
  //       if (chunk !== '') {
  //         const chunkData = JSON.parse(chunk) as BigCodeStream;
  //         const done = chunkData.token.special;

  //         if (done) {
  //           this._requesting = false;
  //           this._history.push({
  //             token,
  //             reponseTokenText
  //           });
  //         } else {
  //           reponseTokenText += chunkData.token.text;
  //         }

  //         yield {
  //           response: {
  //             isIncomplete: !chunkData.token.special,
  //             insertText: reponseTokenText
  //           }
  //         };
  //       }
  //     }
  //   }
  // }
}
