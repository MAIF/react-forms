import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { option } from '../Option';

const valueToSelectOption = (value, isMulti = false) => {
  if (value === null) {
    return null;
  }
  if (isMulti) {
    return value.map(x => valueToSelectOption(x));
  }
  return {
    label: value?.label || value,
    value: value?.value || value,
  };
};

export const SelectInput = (props) => {
  const possibleValues = (props.possibleValues || [])
    .map(v => props.transformer ? props.transformer(v) : v)
    .map(v => valueToSelectOption(v))

  const [loading, setLoading] = useState(false);

  const [values, setValues] = useState(possibleValues);

  const [value, setValue] = useState(valueToSelectOption(
    option(possibleValues
      .find(v => v.value === props.value))
      .orElse(option(possibleValues.find(v => v.value === props.defaultValue)))
      .getOrElse(props.value || props.defaultValue), props.isMulti))

  useEffect(() => {
    setValue(valueToSelectOption(
      option(possibleValues
        .find(v => v.value === props.value))
        .getOrElse(props.value || props.defaultValue), props.isMulti))
  }, [props.value])

  useEffect(() => {
    if (props.optionsFrom) {
      const cond = option(props.fetchCondition)
        .map(cond => cond())
        .getOrElse(true);

      if (cond) {
        setLoading(true);
        return props.httpClient(props.optionsFrom, 'GET')
          .then((r) => r.json())
          .then((values) => values.map(x => props.transformer ? props.transformer(x) : valueToSelectOption(x)))
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

  const createOption = (option, fn = () => { }) => {
    fn(option)
    setValues([...values, valueToSelectOption(option)])
    onChange(valueToSelectOption(option))
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
        onCreateOption={option => props.onCreateOption ? createOption(option, props.onCreateOption) : createOption(option)}
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
