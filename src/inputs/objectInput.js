import React from 'react';
import { PlusCircle, MinusCircle } from 'react-feather';

export const ObjectInput = (props) => {
  const changeValue = (e, name) => {
    const newValues = { ...props.value, [name]: e.target.value };
    props.onChange(newValues);
  };

  const changeKey = (e, oldName) => {
    const newValues = { ...props.value };
    const oldValue = newValues[oldName];
    delete newValues[oldName];
    newValues[e.target.value] = oldValue;
    props.onChange(newValues);
  };

  const addFirst = (e) => {
    if (!props.value || Object.keys(props.value).length === 0) {
      props.onChange(props.defaultKeyValue || { '': '' });
    }
  };

  const addNext = (e) => {
    const newItem = props.defaultKeyValue || { '': '' };
    const newValues = { ...props.value, ...newItem };
    props.onChange(newValues);
  };

  const remove = (e, name) => {
    const newValues = { ...props.value };
    delete newValues[name];
    props.onChange(newValues);
  };

  const values = Object.keys(props.value || {}).map((k) => [k, props.value[k]]);

  return (
    <div className={props.className}>
      {values.length === 0 && (
        <button
          disabled={props.disabled}
          type="button"
          className="btn btn-primary"
          onClick={addFirst}>
          <PlusCircle />
        </button>
      )}
      {values.map((value, idx) => (
        <div className="d-flex flex-row" key={idx}>
          <input
            disabled={props.disabled}
            type="text"
            className="form-control"
            style={{ width: '50%' }}
            placeholder={props.placeholderKey}
            value={value[0]}
            onChange={(e) => changeKey(e, value[0])}
          />
          <input
            disabled={props.disabled}
            type="text"
            className="form-control"
            style={{ width: '50%' }}
            placeholder={props.placeholderValue}
            value={value[1]}
            onChange={(e) => changeValue(e, value[0])}
          />
          <button
            disabled={props.disabled}
            type="button"
            className="btn btn-danger"
            onClick={(e) => remove(e, value[0])}>
            <MinusCircle />
          </button>
          {idx === values.length - 1 && (
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