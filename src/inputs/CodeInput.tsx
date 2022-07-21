import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { LanguageMode } from './constants';
// @ts-ignore
import Editor from '../form/codemirror-editor'

export function CodeInput({
  onChange,
  value,
  mode = 'javascript',
  tabSize = 2,
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
  },
  className,
  setRef
}:{
  onChange?: (v: string) => void,
  value?: string,
  mode?: LanguageMode,
  tabSize?: number,
  readOnly?: boolean,
  showLinesNumber?: boolean,
  highlightLine?: boolean,
  themeStyle?: {
    height: string,
    minHeight: string,
    maxHeight: string,
    width: string,
    minWidth: string,
    maxWidth: string,
  },
  className?: string,
  setRef?: (editor: any) => void
}) {
  const ref = useRef<any>()
  const [editor, setEditor] = useState<any>()

  useEffect(() => {
    const e = Editor(ref.current, mode, tabSize, readOnly, showLinesNumber, highlightLine, themeStyle, onChange, value)

    ref.current.addEventListener("keydown", (e: Event) => {
      e.stopImmediatePropagation()
    })

    if (setRef)
      setRef(e)

    e.dispatch({
      changes: {
        from: 0,
        to: e.state.doc.length,
        insert: (value === null || value === undefined) ? '' : (typeof value === 'object' ? JSON.stringify(value, null, 2) : value)
      }
    })
    setEditor(e)
  }, [])

  useEffect(() => {
    if (editor && (typeof value === 'object' ? JSON.stringify(value, null, 2) : value) !== editor.state.doc.toString()) {
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: (value === null || value === undefined) ? '' : (typeof value === 'object' ? JSON.stringify(value, null, 2) : value)
        }
      })
    }
  }, [value])

  return <div className={className} ref={ref} />
}
