import React, { useEffect, useRef } from 'react';
import Editor from './__generated/editor'

export function SingleLineCode({
    onChange,
    value,
    mode = 'javascript',
    readOnly = false,
    showLinesNumber = true,
    highlightLine = false,
    themeStyle = {
        height: '-1',
        minHeight: '-1',
        maxHeight: '-1',
        width: '-1',
        minWidth: '-1',
        maxWidth: '-1',
    }
}) {
    const ref = useRef()

    useEffect(() => {
        Editor(ref.current, mode, v => {
            onChange(v.replace(/\n/g, ""))
        }, value, readOnly, showLinesNumber, highlightLine, themeStyle)
    }, [])

    return <div ref={ref} style={{
        flex: 1, overflow: 'hidden'
    }} />
}
