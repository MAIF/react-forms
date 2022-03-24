/*global event*/
/*eslint no-restricted-globals: ["error", "event"]*/

import { EditorState } from '@codemirror/state'

import { javascript } from "@codemirror/lang-javascript"
import { html } from "@codemirror/lang-html"
import { json } from "@codemirror/lang-json"
import { css } from "@codemirror/lang-css"
import { markdown } from "@codemirror/lang-markdown"

import {
    EditorView, highlightSpecialChars, drawSelection,
    dropCursor, highlightActiveLine, keymap
} from '@codemirror/view'
import { history, historyKeymap } from '@codemirror/history'
import { foldGutter, foldKeymap } from '@codemirror/fold'
import { indentWithTab } from '@codemirror/commands'
import { indentOnInput } from '@codemirror/language'
import { lineNumbers, highlightActiveLineGutter } from '@codemirror/gutter'
import { defaultKeymap } from '@codemirror/commands'
import { bracketMatching } from '@codemirror/matchbrackets'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { commentKeymap } from '@codemirror/comment'
import { rectangularSelection } from '@codemirror/rectangular-selection'
import { defaultHighlightStyle } from '@codemirror/highlight'
import { lintKeymap } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'

const languages = {
    javascript: javascript,
    css: css,
    json: json,
    html: html,
    markdown: markdown
}

export default function Editor(
    parent,
    mode,
    onChange,
    value,
    readOnly = false,
    showLinesNumber = true,
    highlightLine = false,
    themeStyle = {
        height: '-1',
        minHeight: '300px',
        maxHeight: '-1',
        width: '-1',
        minWidth: '-1',
        maxWidth: '-1',
    }
) {
    const theme = EditorView.theme({
        '&': {
            ...themeStyle
        },
    })

    const setup = [
        showLinesNumber ? lineNumbers() : lineNumbers({ formatNumber: "" }),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        languages[mode](),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        defaultHighlightStyle.fallback,
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        highlightLine ? highlightActiveLine() : undefined,
        highlightSelectionMatches(),
        keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...commentKeymap,
            ...completionKeymap,
            ...lintKeymap,
            indentWithTab
        ]),
        oneDark,
        theme,
    ].filter(f => f)

    return new EditorView({
        state: EditorState.create({
            extensions: [
                ...setup,
                EditorView.updateListener.of(vu => {
                    if (vu.docChanged) {
                        const doc = vu.state.doc.toString();
                        onChange(doc)
                    }
                }),
                EditorView.editable.of(!readOnly)
            ],
            doc: value,
        }),
        parent
    })
}