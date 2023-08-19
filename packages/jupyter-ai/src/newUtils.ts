import { JupyterFrontEnd } from '@jupyterlab/application';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { Notebook } from '@jupyterlab/notebook';
import { FileEditor } from '@jupyterlab/fileeditor';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Widget } from '@lumino/widgets';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { CodeCell } from '@jupyterlab/cells';
import { EditorView } from '@codemirror/view';
import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet } from '@codemirror/view';

// 获取 widget 实例
const getContent = (widget: DocumentWidget): Widget => {
  const { content } = widget;
  return content
}


// 通过 widget 实例获取当前 cell 的 editor，CodeEditor.IEditor 是指接口，具体实现类为 CodeMirrorEditor
const getEditorByWidget = (content: Widget): CodeEditor.IEditor | null | undefined => {
  let editor: CodeEditor.IEditor | null | undefined;

  // content 存在多种类型
  if (content instanceof FileEditor) {
    editor = content.editor;
  } else if (content instanceof Notebook) {
    editor = content.activeCell?.editor;
  }

  return editor
}


// 获取 editor 单元格的代码文本
const getTextByEditor = (editor: CodeEditor.IEditor): string => {
  return editor.model.sharedModel.getSource()
}


export const getCellCode = (app: JupyterFrontEnd) => {
  const currentWidget = app.shell.currentWidget;

  if (!currentWidget || !(currentWidget instanceof DocumentWidget)) {
    return
  }

  const content = getContent(currentWidget)
  const editor = getEditorByWidget(content)

  if (editor) {
    console.log("code", getTextByEditor(editor));
  }
};


// 通过行拆分string
const splitString = (input: string): string[] => {
  return input.split(/(?<!\\)\n/).map(part => part.replace('\\\\n', '\\n'));
};

// 获取指定 editor（一个cell）中，指针之前的所有代码
const getCellTextByPosition = (editor: CodeEditor.IEditor) => {
  // 获取鼠标定位，例如 {column: 2, line: 1}
  const position = editor.getCursorPosition()
  const text = getTextByEditor(editor)

  // 通过\n进行拆分
  const codeLines = splitString(text)

  const codeLinesPositionBefore = []
  // 从第一个单元格遍历到活动单元格的位置
  for (let index = 0; index <= position.line; index++) {
    // 如果遍历到当前单元格
    if (index == position.line) {
      codeLinesPositionBefore.push(codeLines[index].slice(0, position.column))
      continue
    }

    codeLinesPositionBefore.push(codeLines[index])
  }

  return codeLinesPositionBefore
}

export const getCellTextByPositionAfter = (app: JupyterFrontEnd) => {

  const currentWidget = app.shell.currentWidget;

  if (!currentWidget || !(currentWidget instanceof DocumentWidget)) {
    return
  }

  const content = getContent(currentWidget)
  const editor = getEditorByWidget(content)

  if (editor) {
    console.log(getCellTextByPosition(editor));
  }

};

export const getAllCellCode = (app: JupyterFrontEnd) => {
  const currentWidget = app.shell.currentWidget;

  if (!currentWidget || !(currentWidget instanceof DocumentWidget)) {
    return
  }

  const content = getContent(currentWidget)

  if (content instanceof Notebook) {
    const allCellText = []
    // 获取所有的实例化 Cell，和 DocumentWidget.content.activeCell 类型相同，类型依旧为 Widget
    for (const cell of content.widgets) {
      const editor = cell.editor
      if (editor) {
        const text = getTextByEditor(editor)
        allCellText.push(text)
      }
    }
    console.log("allCellText", allCellText);

  }

};


export const getAllCellTextByPosition = (app: JupyterFrontEnd) => {
  const currentWidget = app.shell.currentWidget;
  if (!currentWidget || !(currentWidget instanceof DocumentWidget)) {
    return
  }

  const content = getContent(currentWidget)
  if (content instanceof Notebook) {
    const allCellText = []
    const widgets = content.widgets
    const activeCellIndex = content.activeCellIndex

    // 遍历到当前单元格
    for (let index = 0; index <= activeCellIndex; index++) {
      const widget = widgets[index]
      const editor = widget.editor
      if (editor) {
        // 如果是当前的单元格
        if (index == activeCellIndex) {
          const cellLines = getCellTextByPosition(editor)
          allCellText.push(cellLines.join("\n"))
          break
        }

        const text = getTextByEditor(editor)
        allCellText.push(text)
      }

    }

    console.log("allCellText", allCellText);

  }
};

export const replaceAllChatByCellPlan1 = (app: JupyterFrontEnd) => {

  const currentWidget = app.shell.currentWidget;

  if (!currentWidget || !(currentWidget instanceof DocumentWidget)) {
    return
  }

  const content = getContent(currentWidget)
  const editor = getEditorByWidget(content)

  if (editor && "replaceSelection" in editor) {
    if (editor) {
      // 我们先计算行数于最后一行的长度
      const lineLenght = editor.lineCount
      const lastLineLenght = editor.getLine(lineLenght - 1)?.length

      // 理论上不可能出现越界
      if (lineLenght && lastLineLenght) {
        // 选择cell中的代码，这里是选择了全部的
        editor.setSelection({ start: { line: 0, column: 0 }, end: { line: lineLenght - 1, column: lastLineLenght } });

        // 只有 CodeMirrorEditor 实现了 replaceSelection函数，其余 editor 类型并没有实现 replaceSelection
        (editor as CodeMirrorEditor).replaceSelection("This replace string\nthis second line");
      }
    }
  }
};


export const replaceAllChatByCellPlan2 = (app: JupyterFrontEnd) => {
  const currentWidget = app.shell.currentWidget;

  if (!currentWidget || !(currentWidget instanceof DocumentWidget)) {
    return
  }

  const content = getContent(currentWidget)
  const editor = getEditorByWidget(content)
  if (editor) {
    // 直接替换codemirror中的值
    editor.model.sharedModel.setSource("This replace string\nthis second line")
  }

};


export const undo = (app: JupyterFrontEnd) => {
  const currentWidget = app.shell.currentWidget;

  if (!currentWidget || !(currentWidget instanceof DocumentWidget)) {
    return
  }

  const content = getContent(currentWidget)
  const editor = getEditorByWidget(content)

  if (editor && "replaceSelection" in editor) {
    if (editor) {
      const lineLenght = editor.lineCount
      const lastLineLenght = editor.getLine(lineLenght - 1)?.length

      if (lineLenght && lastLineLenght) {
        // 我们在这里获取展示代码前的鼠标位置
        const prePosition = editor.getCursorPosition()
        editor.setSelection({ start: { line: 0, column: 0 }, end: { line: lineLenght - 1, column: lastLineLenght } });

        (editor as CodeMirrorEditor).replaceSelection("This replace string\nthis second line");

        // 撤销上次的更改 
        editor.undo()
        // 使鼠标指针恢复到之前的位置，否则会指向0位
        editor.setCursorPosition(prePosition)
      }
    }
  }
};


const getCellOutput = (currentWidget: DocumentWidget) => {
  const notebook = currentWidget.content as Notebook;
  // 获取当前单元格
  const activeCell = notebook.activeCell;

  // 不同的实例有不同的获取方式
  if (activeCell instanceof CodeCell) {
    // 获取输出
    return activeCell.model.sharedModel.outputs
  }

}

export const getOutPut = (app: JupyterFrontEnd) => {
  document.addEventListener('keydown', event => {
    if (event.ctrlKey) {
      // 获取当前的Widget
      const currentWidget = app.shell.currentWidget;

      // Widget必须是DocumentWidget，我们才可以操作
      if (!currentWidget || !(currentWidget instanceof DocumentWidget)) {
        return
      }

      console.log(getCellOutput(currentWidget));

    }
  })
};



// 以下例子是将新增的代码变成红色
// 首先定义一个Effect用来保存转换颜色之前的字符以及对应的主题
const clearRedTextEffect = StateEffect.define({});

// 通过clearRedTextEffect还原之前代码的颜色
export function removeRedTextStatus(view: EditorView) {
  view.dispatch({
    effects: clearRedTextEffect.of(null)
  });
}

// 制作标记的状态（就是说们标记了一个字符串，那么这个字符串 dom 的 class 是"red-color"）
const redTexteMark = Decoration.mark({ class: "red-color" })

// 标记的 css 主题
const redTextTheme = EditorView.baseTheme(
  {
    ".red-color > span": { color: "red !important" },
    ".red-color ": { color: "red !important" }
  }
)

// 保存我们需要更改的字符和主题对应的容器（我们需要先计算那些是字符是我们需要的）
const changeRangeTextStatus = StateEffect.define<{ from: number, to: number }>({ map: ({ from, to }, change) => ({ from: change.mapPos(from), to: change.mapPos(to) }) })

// codemirror 中 editorView 的 extension
const redTextField = StateField.define<DecorationSet>({
  create() { return Decoration.none },
  update(redTexts, tr) {
    redTexts = redTexts.map(tr.changes)
    for (let e of tr.effects) {
      if (e.is(changeRangeTextStatus)) {
        redTexts = redTexts.update({
          add: [redTexteMark.range(e.value.from, e.value.to)]
        })
      }
    }
    if (tr.effects.some(e => e.is(clearRedTextEffect))) {
      return Decoration.none;
    }

    return redTexts
  },
  provide: f => EditorView.decorations.from(f)
})

// 将 EditorView 的指定范围的字符更改成红色
export function redTexSelection(view: EditorView, start: number, end: number) {
  if (start == end) return false
  let effects: StateEffect<unknown>[] = [changeRangeTextStatus.of({ from: start, to: end })]

  if (!view.state.field(redTextField, false)) effects.push(StateEffect.appendConfig.of([redTextField, redTextTheme]))

  view.dispatch({ effects })
  return true
}

export const addCodeAndReplaceColor = (app: JupyterFrontEnd) => {
  // 获取当前活动的文档窗口
  const currentWidget = app.shell.currentWidget;
  if (!(currentWidget instanceof DocumentWidget)) {
    return null;
  }
  // content的类型也是widget，只不过是被widget容器包裹起来的
  const { content } = currentWidget;
  // 当前操作的单元格
  const activeCell = content.activeCell;
  // 当前操作的单元格的 codemirror 实例对象
  const editor = activeCell.editor as CodeMirrorEditor;
  if (editor) {
    const view = editor.editor

    // 获取原先cell中的代码
    const oldCodeText = editor.model.sharedModel.getSource()
    // 我们需要添加的代码（非必要）
    const newCodeText = "\n    print('hello world!')\nhello()"
    // 更新当前的代码
    editor.model.sharedModel.setSource(oldCodeText + newCodeText)

    // 将新增加的代码颜色变成红色
    redTexSelection(view, oldCodeText.length, (oldCodeText + newCodeText).length)
    // 还原成之前的样子
    removeRedTextStatus(view)
  }
};

