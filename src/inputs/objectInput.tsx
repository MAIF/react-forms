import * as React from "react";
import { useEffect, useState } from 'react';
// @ts-ignore
import PlusCircle from 'react-feather/dist/icons/plus-circle.js';
// @ts-ignore
import MinusCircle from 'react-feather/dist/icons/minus-circle.js';
import deepEqual from 'fast-deep-equal';

type InternalState = {[x: string] : {key: string, value: any}};

export const ObjectInput = (props: {value?: object, onChange?: (value: InternalState) => void, defaultKeyValue?: {key: string, value: string}, className: string, disabled?:boolean, placeholderKey?: string, placeholderValue?: string}) => {
  const [internalState, setInternalState] = useState<InternalState>({})

  useEffect(() => {
    setInternalState(Object.fromEntries(
      Object.entries(props.value || {})
        .map(([key, value], idx) => [Date.now() + idx, { key, value }])
    ))
  }, [])

  useEffect(() => {
    if (props.value) {
      const newState = props.value || {}

      const previousState = Object.entries(internalState || {})
        .reduce((acc, [_, item]) => {
          if (item.key)
            return ({ ...acc, [item.key]: item.value })
          return acc
        }, {})

      if (!deepEqual(newState, previousState))
        setInternalState(Object.fromEntries(
          Object.entries(props.value || {})
            .map(([key, value], idx) => [Date.now() + idx, { key, value }])
        ))
    }
  }, [props.value])

  const onChange = (state: InternalState) => {
    props?.onChange?.(Object.values(state).reduce((acc, c) => ({
      ...acc,
      [c.key]: c.value
    }), {}))
  }

  const changeValue = (id: string, newValue: string) => {
    const newState = {
      ...internalState,
      [id]: { key: internalState[id].key, value: newValue }
    }
    setInternalState(newState)
    onChange(newState)
  };

  const changeKey = (id: string, newValue: string) => {
    const newState = {
      ...internalState,
      [id]: { key: newValue, value: internalState[id].value }
    }
    setInternalState(newState)
    onChange(newState)
  };

  const addFirst = () => {
    if (!internalState || Object.keys(internalState).length === 0) {
      const newState = {
        ...internalState,
        [Date.now()]: props.defaultKeyValue || { key: '', value: '' }
      }
      setInternalState(newState)
      onChange(newState)
    }
  };

  const addNext = () => {
    const newItem = props.defaultKeyValue || { key: '', value: '' };
    const newState = {
      ...internalState,
      [Date.now()]: newItem
    }
    setInternalState(newState);
    onChange(newState)
  };

  const remove = (removedId: string) => {
    const newState = Object.fromEntries(Object.entries(internalState).filter(([id, _]) => id !== removedId))
    setInternalState(newState)
    onChange(newState)
  };

  return (
    <div className={props.className}>
      {Object.keys(internalState || {}).length === 0 && (
        <button
          disabled={props.disabled}
          type="button"
          className='mrf-flex mrf-btn mrf-btn_blue mrf-btn_sm'
          onClick={addFirst}>
          <PlusCircle />
        </button>
      )}
      {Object.entries(internalState || {}).map(([id, { key, value }], idx) => (
        <div className='mrf-flex mrf-mt_5' key={idx}>
          <input
            disabled={props.disabled}
            type="text"
            className='mrf-w_50 mrf-input'
            placeholder={props.placeholderKey}
            value={key}
            onChange={e => changeKey(id, e.target.value)}
          />
          <input
            disabled={props.disabled}
            type="text"
            className='mrf-w_50 mrf-input'
            placeholder={props.placeholderValue}
            value={value}
            onChange={e => changeValue(id, e.target.value)}
          />
          <button
            disabled={props.disabled}
            type="button"
            className='mrf-flex mrf-ai_center mrf-btn mrf-btn_red mrf-btn_sm mrf-ml_10'
            onClick={() => remove(id)}>
            <MinusCircle />
          </button>
          {idx === Object.keys(internalState).length - 1 && (
            <button
              disabled={props.disabled}
              type="button"
              className='mrf-flex mrf-ai_center mrf-btn mrf-btn_blue mrf-btn_sm mrf-ml_5'
              onClick={addNext}>
              <PlusCircle />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}