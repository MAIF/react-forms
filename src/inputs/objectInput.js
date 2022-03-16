import React, { useEffect, useState } from 'react';
import { PlusCircle, MinusCircle } from 'react-feather';
import classNames from 'classnames';
import { useCustomStyle } from '../styleContext';

export const ObjectInput = (props) => {
  const [internalState, setInternalState] = useState(Object.fromEntries(
    Object.entries(props.value || {})
      .map(([key, value]) => [Date.now(), { key, value }])
  ))

  useEffect(() => {
    props.onChange(Object.values(internalState).reduce((acc, c) => ({
      ...acc,
      [c.key]: c.value
    }), {}))
  }, [internalState])

  const changeValue = (id, newValue) => {
    setInternalState({
      ...internalState,
      [id]: { key: internalState[id].key, value: newValue }
    })
  };

  const changeKey = (id, newValue) => {
    setInternalState({
      ...internalState,
      [id]: { key: newValue, value: internalState[id].value }
    })
  };

  const addFirst = () => {
    if (!internalState || Object.keys(internalState).length === 0) {
      setInternalState({
        ...internalState,
        [Date.now()]: props.defaultKeyValue || { key: '', value: '' }
      })
    }
  };

  const addNext = () => {
    const newItem = props.defaultKeyValue || { key: '', value: '' };
    setInternalState({
      ...internalState,
      [Date.now()]: newItem
    });
  };

  const remove = removedId => {
    setInternalState(Object.fromEntries(Object.entries(internalState).filter(([id, _]) => id !== removedId)))
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
      {Object.entries(internalState).map(([id, { key, value }], idx) => (
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