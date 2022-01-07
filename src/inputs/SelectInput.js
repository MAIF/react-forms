import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { option } from '../Option';
import { deepEqual } from '../utils'

const valueToSelectOption = (value, possibleValues = [], isMulti = false, maybeTransformer) => {
  if (value === null) {
    return null;
  }
  if (isMulti) {
    return option(value).map(v => v.map(x => valueToSelectOption(x, possibleValues, false, maybeTransformer))).getOrElse([]);
  }
  const maybeValue = option(possibleValues.find(v => deepEqual(v.value, value)))
  return maybeValue
    .getOrElse({
      label: maybeValue.map(v => v.label).getOrElse(value),
      value: maybeValue.map(v => v.value).getOrElse(value),
    });
};

export const SelectInput = (props) => {
  const possibleValues = (props.possibleValues || [])
    .map(v => props.transformer ? props.transformer(v) : v)
    .map(v => ({
      label: v?.label || v,
      value: v?.value || v
    }))

  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(possibleValues);
  const [value, setValue] = useState(valueToSelectOption(props.value || props.defaultValue, possibleValues, props.isMulti, props.transformer))

  useEffect(() => {
    setValue(valueToSelectOption(props.value, values, props.isMulti, props.transformer))
  }, [props.value, values])

  useEffect(() => {
    if (props.optionsFrom) {
      const cond = option(props.fetchCondition)
        .map(cond => cond())
        .getOrElse(true);

      if (cond) {
        setLoading(true);
        return props.httpClient(props.optionsFrom, 'GET')
          .then((r) => r.json())
          .then((values) => values.map(x => props.transformer ? props.transformer(x) : valueToSelectOption(x, values, props.isMulti, props.transformer)))
          .then((values) => {
            setValues(values);
            setValue(values.find((item) => item.value === (value ? value.value : value)) || null);
            setLoading(false);
          });
      }
    }
  }, [values, props.isMulti])


  const onChange = (changes) => {
    setValue(changes)
    if (props.isMulti) {
      props.onChange(changes.map(x => x.value))
    } else {
      props.onChange(changes.value);
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

  if (props.createOption) {
    return (
      <CreatableSelect
        {...props}
        name={`${props.label}-search`}
        isLoading={loading}
        value={value}
        isDisabled={props.disabled}
        placeholder={props.placeholder}
        isClearable
        onChange={onChange}
        options={values}
        onCreateOption={option => handleCreate(option, props.onCreateOption)}
        classNamePrefix="react-form-select"
        className={props.className}
      />
    )
  } else {
    return (
      <Select
        {...props}
        name={`${props.label}-search`}
        isLoading={loading}
        value={value}
        isDisabled={props.disabled}
        placeholder={props.placeholder}
        options={values}
        onChange={onChange}
        classNamePrefix="react-form-select"
        className={props.className}
      />
    )
  }
}
