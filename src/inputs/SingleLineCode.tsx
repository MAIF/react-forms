import React, { useEffect, useRef } from 'react';
import { LanguageMode } from './constants';
// @ts-ignore
import Editor from '../form/codemirror-editor'

export function SingleLineCode({
    onChange,
    value,
    mode = 'javascript',
    tabSize = 2,
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
}:
{
    onChange?: (newValue: string) => void,
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
    }
}) {
    const ref = useRef<any>()

    useEffect(() => {
        Editor(ref.current, mode, tabSize, readOnly, showLinesNumber, highlightLine, themeStyle, (v: string) => {
            onChange?.(v.replace(/\n/g, ""))
        }, value)

        ref.current.addEventListener("keydown", (e: Event) => {
            e.stopImmediatePropagation()
        })
    }, [])

    return <div ref={ref} style={{
        flex: 1, overflow: 'hidden'
    }} />
}
