import React, { useEffect, useState } from 'react';
import { PlusCircle, MinusCircle } from 'react-feather';

export const ObjectInput = (props) => {
  const [internalState, setInternalState] = useState(Object.keys(props.value || {}).map((k) => [k, props.value[k]]))

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

  const addFirst = (e) => {
    if (!internalState || Object.keys(internalState).length === 0) {
      setInternalState({
        ...internalState,
        [Date.now()]: props.defaultKeyValue || { key: '', value: '' }
      })
    }
  };

  const addNext = (e) => {
    const newItem = props.defaultKeyValue || { '': '' };
    setInternalState({
      ...internalState,
      [Date.now()]: newItem
    });
  };

  const remove = removedId => {
    setInternalState(Object.fromEntries(Object.entries(internalState).filter(([id, _]) => id !== removedId)))
  };

  return (
    <div className={props.className}>
      {Object.keys(internalState || {}).length === 0 && (
        <button
          disabled={props.disabled}
          type="button"
          className="btn btn-primary"
          onClick={addFirst}>
          <PlusCircle />
        </button>
      )}
      {Object.entries(internalState).map(([id, { key, value }], idx) => (
        <div className="d-flex flex-row" key={id}>
          <input
            disabled={props.disabled}
            type="text"
            className="form-control"
            style={{ width: '50%' }}
            placeholder={props.placeholderKey}
            value={key}
            onChange={e => changeKey(id, e.target.value)}
          />
          <input
            disabled={props.disabled}
            type="text"
            className="form-control"
            style={{ width: '50%' }}
            placeholder={props.placeholderValue}
            value={value}
            onChange={e => changeValue(id, e.target.value)}
          />
          <button
            disabled={props.disabled}
            type="button"
            className="btn btn-danger"
            onClick={() => remove(id)}>
            <MinusCircle />
          </button>
          {idx === Object.keys(internalState).length - 1 && (
            <button
              disabled={props.disabled}
              type="button"
              className="btn btn-primary"
              onClick={addNext}>
              <PlusCircle />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}