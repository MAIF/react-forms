import React, { useEffect, useRef, useState } from 'react';
import Editor from './__generated/editor'

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
  setRef
}) {
  const ref = useRef()
  const [editor, setEditor] = useState()

  useEffect(() => {
    const e = Editor(ref.current, mode, onChange, value, tabSize, readOnly, showLinesNumber, highlightLine, themeStyle)

    ref.current.addEventListener("keydown", e => {
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

  return <div ref={ref} />
}
