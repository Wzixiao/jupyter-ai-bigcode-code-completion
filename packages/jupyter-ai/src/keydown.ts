import { JupyterFrontEnd, LabShell } from '@jupyterlab/application';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { keymap } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import { Prec, StateEffect } from '@codemirror/state';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';
import { Notebook } from '@jupyterlab/notebook';
import { NotebookPanel } from '@jupyterlab/notebook';
import { Extension } from '@codemirror/state';
import { getAllCellCode } from './newUtils';

// 获取 widget 实例
const getContent = (widget: DocumentWidget): Widget => {
  const { content } = widget;
  return content;
};

const handleCellAdded = async (notebookPanel: NotebookPanel) => {
  const notebook = notebookPanel.content;
  if (!notebook || !notebook.model) {
    return;
  }

  notebook.model.cells.changed.connect(async (sender, args) => {
    if (args.type === 'add') {
      const addedCells = args.newValues;
      addedCells.forEach(async (cell: { id: string }) => {
        const widgetIndex = notebookPanel.content.widgets.findIndex(
          widget => widget.model.id === cell.id
        );

        if (widgetIndex !== -1) {
          const cellWidget = notebookPanel.content.widgets[widgetIndex];
          // 等待 notebook 完成新增单元格的初始化
          await notebookPanel.context.ready;
          const editor = cellWidget.editor as CodeMirrorEditor;
          const view = editor.editor as EditorView;
          const tr = view.state.update({
            effects: StateEffect.appendConfig.of(extension)
          });

          view.dispatch(tr);
        }
      });
    }
  });
};

const init = (app: JupyterFrontEnd) => {
  if (!(app.shell instanceof LabShell)) {
    throw 'Shell is not an instance of LabShell. Jupyter AI does not currently support custom shells.';
  }

  app.shell.currentChanged.connect((sender, args) => {
    const currentWidget = args.newValue;
    if (!currentWidget || !(currentWidget instanceof NotebookPanel)) {
      return;
    }
    console.log('aaaa');
    handleCellAdded(currentWidget);
    const content = getContent(currentWidget);

    if (content instanceof Notebook) {
      for (const cell of content.widgets) {
        const editor = cell.editor as CodeMirrorEditor;
        const view = editor.editor as EditorView;
        const tr = view.state.update({
          effects: StateEffect.appendConfig.of(extension)
        });

        view.dispatch(tr);
      }
    }
  });
};

let extension: Extension;

export const handleKeyDown = async (app: JupyterFrontEnd) => {
  await app.start();
  extension = Prec.highest(
    keymap.of([
      {
        key: 'Enter',
        run: () => {
          // addCodeAndReplaceColor,
          // console.log(getOutPut(app));
          // undo,
          // replaceAllChatByCellPlan2,
          // replaceAllChatByCellPlan1,
          // getAllCellTextByPosition,
          getAllCellCode(app);
          // getCellTextByPositionAfter,
          // console.log(getCellCode(app));
          return true;
        }
      }
    ])
  );
  console.log('handleKeyDown is start');
  init(app);
};
