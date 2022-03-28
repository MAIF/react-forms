import React, { useEffect, useState } from 'react';
import { PlusCircle, MinusCircle } from 'react-feather';
import classNames from 'classnames';
import { useCustomStyle } from '../styleContext';
import { deepEqual } from '../utils';

export const ObjectInput = (props) => {
  const [internalState, setInternalState] = useState()

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

  const onChange = state => {
    props.onChange(Object.values(state).reduce((acc, c) => ({
      ...acc,
      [c.key]: c.value
    }), {}))
  }

  const changeValue = (id, newValue) => {
    const newState = {
      ...internalState,
      [id]: { key: internalState[id].key, value: newValue }
    }
    setInternalState(newState)
    onChange(newState)
  };

  const changeKey = (id, newValue) => {
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

  const remove = removedId => {
    const newState = Object.fromEntries(Object.entries(internalState).filter(([id, _]) => id !== removedId))
    setInternalState(newState)
    onChange(newState)
  };

  const classes = useCustomStyle();

  return (
    <div className={props.className}>
      {Object.keys(internalState || {}).length === 0 && (
        <button
          disabled={props.disabled}
          type="button"
          className={classNames(classes.btn, classes.btn_blue, classes.btn_sm)}
          onClick={addFirst}>
          <PlusCircle />
        </button>
      )}
      {Object.entries(internalState || {}).map(([id, { key, value }], idx) => (
        <div className={classNames(classes.flex, classes.mt_5)} key={idx}>
          <input
            disabled={props.disabled}
            type="text"
            className={classNames(classes.w_50)}
            placeholder={props.placeholderKey}
            value={key}
            onChange={e => changeKey(id, e.target.value)}
          />
          <input
            disabled={props.disabled}
            type="text"
            className={classNames(classes.w_50)}
            placeholder={props.placeholderValue}
            value={value}
            onChange={e => changeValue(id, e.target.value)}
          />
          <button
            disabled={props.disabled}
            type="button"
            className={classNames(classes.flex, classes.btn, classes.btn_red, classes.btn_sm, classes.ml_10)}
            onClick={() => remove(id)}>
            <MinusCircle />
          </button>
          {idx === Object.keys(internalState).length - 1 && (
            <button
              disabled={props.disabled}
              type="button"
              className={classNames(classes.flex, classes.btn, classes.btn_blue, classes.btn_sm, classes.ml_5)}
              onClick={addNext}>
              <PlusCircle />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}