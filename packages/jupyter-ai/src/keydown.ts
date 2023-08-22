import { JupyterFrontEnd, LabShell } from '@jupyterlab/application';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { keymap } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { StateEffect } from '@codemirror/state';
import { Notebook } from '@jupyterlab/notebook';
import { NotebookPanel } from '@jupyterlab/notebook';
import { Extension } from '@codemirror/state';
import { addCodeAndReplaceColor } from './newUtils';
import { getContent } from './newUtils';

const mountExtension = (editor: CodeMirrorEditor): void => {
  const view = editor.editor as EditorView;
  const tr = view.state.update({
    effects: StateEffect.appendConfig.of(extension)
  });

  view.dispatch(tr);
};

const init = (app: JupyterFrontEnd) => {
  if (!(app.shell instanceof LabShell)) {
    throw 'Shell is not an instance of LabShell. Jupyter AI does not currently support custom shells.';
  }

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
        mountExtension(firstCellEditor);
      }

      content.activeCellChanged.connect((sender, cell) => {
        if (!cell) {
          return;
        }

        const editor = cell.editor as CodeMirrorEditor;
        mountExtension(editor);
      });
    }
  });
};

let extension: Extension;

export const handleKeyDown = async (app: JupyterFrontEnd): Promise<void> => {
  await app.start();
  extension = Prec.highest(
    keymap.of([
      {
        key: 'Enter',
        run: () => {
          console.log(addCodeAndReplaceColor(app, 'this new code text'));
          return false;
        }
      }
    ])
  );
  init(app);
  console.log('handleKeyDown is start');
};
