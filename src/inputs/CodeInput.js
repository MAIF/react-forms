import React, { useEffect, useRef } from 'react';
import Editor from './__generated/editor'

export function CodeInput({
  onChange,
  value,
  mode = 'javascript',
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
    Editor(ref.current, mode, onChange, value, readOnly, showLinesNumber, highlightLine, themeStyle)
  }, [])

  return <div ref={ref} />
}
