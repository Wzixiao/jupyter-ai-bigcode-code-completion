import { JupyterFrontEnd, LabShell } from '@jupyterlab/application';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { keymap } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { StateEffect } from '@codemirror/state';
import { Notebook } from '@jupyterlab/notebook';
import { NotebookPanel } from '@jupyterlab/notebook';
import { Extension } from '@codemirror/state';
import { getAllCellTextByPosition, getContent } from './newUtils';
import { getCellContentTextRequiredForBigCode, sendToBigCode } from './bigcode';

// 创建一个软引用集合存放 editor
const mountedEditors = new WeakSet<CodeMirrorEditor>();

const mountExtension = (
  editor: CodeMirrorEditor,
  extension: Extension
): void => {
  // 如果 editor 已经被处理过
  if (mountedEditors.has(editor)) {
    return;
  }

  const view = editor.editor as EditorView;
  const tr = view.state.update({
    effects: StateEffect.appendConfig.of(extension)
  });

  view.dispatch(tr);
  mountedEditors.add(editor);
};

const generateKeyDownExtension = (app: JupyterFrontEnd): Extension => {
  return Prec.highest(
    keymap.of([
      {
        key: 'Enter',
        run: () => {
          console.log(
            sendToBigCode(
              getCellContentTextRequiredForBigCode(
                getAllCellTextByPosition(app)
              )
            )
          );
          return false;
        }
      }
    ])
  );
};

const init = (app: JupyterFrontEnd) => {
  if (!(app.shell instanceof LabShell)) {
    throw 'Shell is not an instance of LabShell. Jupyter AI does not currently support custom shells.';
  }

  const extension = generateKeyDownExtension(app);

  app.shell.currentChanged.connect(async (sender, args) => {
    const currentWidget = args.newValue;
    if (!currentWidget || !(currentWidget instanceof NotebookPanel)) {
      return;
    }

    await currentWidget.context.ready;
    const content = getContent(currentWidget);

    if (content instanceof Notebook) {
      // 优先挂载加载时选中的Cell
      const firstCell = content.activeCell;
      if (firstCell) {
        const firstCellEditor = firstCell.editor as CodeMirrorEditor;
        mountExtension(firstCellEditor, extension);
      }

      content.activeCellChanged.connect(async (sender, cell) => {
        if (!cell) {
          return;
        }

        const waitCellInitTimer = setTimeout(() => {
          const editor = cell.editor as CodeMirrorEditor;
          mountExtension(editor, extension);
          clearTimeout(waitCellInitTimer);
        }, 0);
      });
    }
  });
};

export const handleKeyDown = async (app: JupyterFrontEnd): Promise<void> => {
  await app.start();
  init(app);
  console.log('handleKeyDown is start');
};
