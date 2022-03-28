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
  }
}) {
  const ref = useRef()

  useEffect(() => {
    Editor(ref.current, mode, onChange, value, tabSize, readOnly, showLinesNumber, highlightLine, themeStyle)

    ref.current.addEventListener("keydown", e => {
      e.stopImmediatePropagation()
    })
  }, [])

  return <div ref={ref} />
}
