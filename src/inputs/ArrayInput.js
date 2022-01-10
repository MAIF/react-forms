import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {option} from '../Option'

const valueToSelectOption = (value) => {
  if (value === null) {
    return null;
  }
  return {
    label: value.label || value,
    value: value.value || value,
  };
};

export const ArrayInput = (props) => {
  const [loading, setLoading] = useState(false);
  const [value] = useState(undefined)
  const [values, setValues] = useState((props.possibleValues || []).map(valueToSelectOption))


  

  useEffect(() => {
    if (props.optionsFrom) {
      const cond = option(props.fetchCondition).map(cond => cond()).getOrElse(true);

      if (cond) {
        setLoading(true);
        return fetch(props.optionsFrom, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
        })
          .then((r) => r.json())
          .then((values) => values.map(props.transformer || valueToSelectOption))
          .then((values) => {
            setValues(values);
            // setValue(values.find((item) => item.value === (value ? value.value : value)) || null);
            setLoading(false);
          });
      }
    }
  }, [props.optionsFrom])

  const handleChanges = (changes) => {
    props.onChange(changes.map(x => x.value))
  }

  return (
    <div className="form-group row">
      <div className="col-sm-10">
        <div style={{ width: '100%' }} className="input-select">
          {props.createOption && (
            <CreatableSelect
              isDisabled={props.disabled}
              components={{ DropdownIndicator: null }}
              inputValue={value}
              isClearable
              onChange={props.onChange}
              // onInputChange={handleChanges}
              // onKeyDown={this.handleKeyDown}
              options={values}
              onCreateOption={option => props.onCreateOption ? props.onCreateOption(option) : undefined} //todo: default onCreateOption
              formatCreateLabel={(value) => props.formatCreateLabel ? props.formatCreateLabel(value) : `create ${value} ?`} //todo: default formatCreateLabel
              placeholder={props.placeholder}
              value={value}
              classNamePrefix="react-form-select"
              className="react-form-select"
            />
          )}
          {!props.createOption && (
            <Select
              name={`${props.label}-search`}
              isLoading={loading}
              value={value}
              isMulti
              isDisabled={props.disabled}
              placeholder={props.placeholder}
              options={values}
              onChange={handleChanges}
              classNamePrefix="react-form-select"
              className="react-form-select"
            />
          )}
        </div>
      </div>
    </div>
  );
}