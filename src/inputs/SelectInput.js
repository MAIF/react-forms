import React, { useState, useEffect, useContext } from 'react';
import classNames from 'classnames';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { option } from '../Option';
import { isPromise } from '../utils'
import deepEqual from 'fast-deep-equal';
import { useFormContext } from 'react-hook-form';

const valueToSelectOption = (value, possibleValues = [], isMulti = false) => {
  if (value === null || !value) {
    return null;
  }

  if (isMulti) {
    return option(value)
      .map(v => {
        return (() => {
          if (Array.isArray(v))
            return (v || [])
          else if (typeof v === 'object')
            return Object.values(v)
          return v
        })().map(x => valueToSelectOption(x, possibleValues, false))
      })
      .getOrElse([]);
  }
  const maybeValue = option(possibleValues.find(v => deepEqual(v.value, value)))
  return maybeValue
    .getOrElse({
      label: maybeValue.map(v => v.label).getOrElse(value?.label || (typeof value === 'object' ? JSON.stringify(value) : value)),
      value: maybeValue.map(v => v.value).getOrElse(value?.value || value),
    });
};

export const SelectInput = React.forwardRef((props, _) => {
  const { getValues } = useFormContext()

  const possibleValues = (props.possibleValues || [])
    .map(v => props.transformer ?
      (typeof props.transformer === 'function' ?
        props.transformer(v) :
        ({ label: v[props.transformer.label], value: v[props.transformer.value] }))
      : v)
    .map(v => ({
      label: v?.label || (typeof v === 'object' ? JSON.stringify(v) : v),
      value: v?.value || v
    }))

  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(possibleValues);
  const [value, setValue] = useState(valueToSelectOption(props.value || props.defaultValue, possibleValues, props.isMulti))

  useEffect(() => {
    setValue(valueToSelectOption(props.value, values, props.isMulti))
  }, [props.value, values])

  useEffect(() => {
    if (props.optionsFrom) {
      const cond = option(props.fetchCondition)
        .map(cond => cond())
        .getOrElse(true);

      if (cond) {
        setLoading(true);

        let promise;
        if (isPromise(props.optionsFrom)) {
          promise = props.optionsFrom
        } else if (typeof props.optionsFrom === 'function') {
          const result = props.optionsFrom({ rawValues: getValues(), value: getValues(props.id) })
          promise = isPromise(result) ? result : props.httpClient(result, 'GET').then(r => r.json())
        } else {
          promise = props.httpClient(props.optionsFrom, 'GET').then(r => r.json())
        }

        promise
          .then((values) => {
            return values.map(x => props.transformer ? props.transformer(x) : valueToSelectOption(x, values, props.isMulti, props.transformer))
          })
          .then((values) => {
            setValues(values);
            setValue(values.find((item) => item.value === (value ? value.value : value)) || null);
            setLoading(false);
          });
      }
    }
  }, [props.optionsFrom])


  const onChange = (changes) => {
    setValue(changes)
    if (props.isMulti) {
      props.onChange(changes.map(x => x.value))
    } else {
      props.onChange(changes?.value);
    }
  };

  const handleCreate = (label, fn) => {
    const createdValue = option(fn)
      .map(func => func(label))
      .map(createdOpt => option(props.transformer).map(t => t(createdOpt)).getOrElse(createdOpt))
      .getOrElse(valueToSelectOption(label, values))

    setValues([...values, createdValue])

    if (props.isMulti) {
      onChange([...value, createdValue])
    } else {
      onChange(createdValue)
    }
  }

  const handleSelectButtonClick = (v) => {
    if (props.isMulti) {
      if (value.includes(v)) {
        return onChange(value.filter(val => val.value !== v.value))
      } else {
        return onChange([...value, v])
      }
    }
    return onChange(v)
  }

  if (props.buttons) {
    return (
      <div style={{ display: 'flex' }}>
        {values.map((v, idx) => {
          const active = !!value && (props.isMulti ? value.includes(v) : v.value === value.value)
          return (
            <button
              key={idx}
              type="button"
              disabled={props.disabled}
              className={classNames(props.className, 'mrf-btn mrf-btn_grey mrf-ml_5', { active })}
              onClick={() => handleSelectButtonClick(v)}>
              {v.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (props.createOption) {
    return (
      <CreatableSelect
        {...props}
        name={`${props.label}-search`}
        isLoading={loading}
        value={value}
        isDisabled={props.disabled}
        placeholder={props.placeholder}
        onChange={onChange}
        options={values}
        onCreateOption={option => handleCreate(option, props.onCreateOption)}
        classNamePrefix="react-form-select"
        className={props.className}
        readOnly={props.disabled ? 'readOnly' : null}
      />
    )
  } else {
    return (
      <Select
        {...props}
        name={`${props.label}-search`}
        isLoading={loading}
        value={value}
        defaultValue={value}
        isDisabled={props.disabled}
        placeholder={props.placeholder}
        options={values}
        onChange={onChange}
        classNamePrefix="react-form-select"
        className={props.className}
        readOnly={props.disabled ? 'readOnly' : null}
      />
    )
  }
})
