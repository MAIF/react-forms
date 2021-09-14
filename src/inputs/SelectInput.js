import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { option } from '../Option';

const valueToSelectoption = (value) => {
  if (value === null) {
    return null;
  }
  return {
    label: value?.label || value,
    value: value?.value || value,
  };
};

export const SelectInput = (props) => {
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(props.isMulti ? [] : undefined)
  const [values, setValues] = useState((props.possibleValues || [])
    .map(v => props.transformer ? props.transformer(v) : v)
    .map(valueToSelectoption))


  useEffect(() => {
    //todo: better code
    if (props.isMulti) {
      const v = option(values)
        .map(maybeValues => (props.value || [])
          .map(v => maybeValues.find(item => JSON.stringify(item.value) === JSON.stringify(v))))
        .getOrElse(([])
          .map(valueToSelectoption))
      setValue(v)
    } else {
      const v = option(values).map(maybeValues => maybeValues.find(item => item.value === props.value)).getOrElse(valueToSelectoption(props.value))
      setValue(v)
    }
  }, [props.value, values, props.isMulti])

  useEffect(() => {
    if (props.optionsFrom) {
      const cond = option(props.fetchCondition).map(cond => cond()).getOrElse(true);

      if (cond) {
        setLoading(true);
        return props.httpClient(props.optionsFrom, 'GET')
          .then((r) => r.json())
          .then((values) => values.map(props.transformer || valueToSelectoption))
          .then((values) => {
            setValues(values);
            setValue(values.find((item) => item.value === (value ? value.value : value)) || null);
            setLoading(false);
          });
      }
    }
  }, [])


  const onChange = (changes) => {
    setValue(changes)
    if (props.isMulti) {
      props.onChange(changes.map(x => x.value))
    } else {
      props.onChange(changes.value);
    }
  };

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
        onCreateOption={option => props.onCreateOption ? props.onCreateOption(option) : undefined} //todo: default onCreateOption
        formatCreateLabel={(value) => props.formatCreateLabel ? props.formatCreateLabel(value) : `create ${value} ?`} //todo: default formatCreateLabel
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
