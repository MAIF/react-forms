import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { None, option, OptionType, Some } from '../Option';
import { isPromise } from '../utils'
import deepEqual from 'fast-deep-equal';
import { useFormContext } from 'react-hook-form';

export type SelectOption = { label: string, value: any };

const valueToSelectOption = (value: any, possibleValues: SelectOption[] = [], isMulti = false): SelectOption | SelectOption[] | null => {
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
        })().map((x: any) => valueToSelectOption(x, possibleValues, false))
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

export const SelectInput = <T extends { [x: string]: any },>(props: {
  possibleValues?: T[],
  transformer?: ((v: T) => SelectOption) | { label: string, value: string },
  value?: any,
  defaultValue?: any,
  isMulti?: boolean,
  optionsFrom?: string | ((param: { rawValues: object, value: any, getValue: (k: string) => any }) => Promise<T[]> | string) | Promise<T[]>,
  fetchCondition?: () => boolean,
  id?: string,
  httpClient?: (url: string, method: string) => Promise<Response>,
  onChange?: (options: any[] | any) => void,
  onCreateOption?: (option: string) => T,
  buttons: boolean,
  disabled?: boolean,
  createOption?: boolean,
  label?: string,
  placeholder?: React.ReactNode,
  className: string
  isClearable?: boolean
}) => {
  const { getValues } = useFormContext()

  function transform(v: T): OptionType<SelectOption> {
    if (!props.transformer) {
      return None;
    }

    if (typeof props.transformer === 'function') {
      return option(props.transformer(v));
    } else {
      return Some({ label: v[props.transformer.label], value: v[props.transformer.value] });
    }
  }

  function transformOption(v: T) {
    const maybeSelectOption = props.transformer ?
      (typeof props.transformer === 'function' ?
        props.transformer(v) :
        ({ label: v[props.transformer.label], value: v[props.transformer.value] }))
      : v

    return {
      label: maybeSelectOption?.label || (typeof maybeSelectOption === 'object' ? JSON.stringify(maybeSelectOption) : maybeSelectOption),
      value: maybeSelectOption?.value || v
    }
  }

  const possibleValues: SelectOption[] = (props.possibleValues || [])
    .map(v => transformOption(v))

  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<SelectOption[]>(possibleValues);
  const [value, setValue] = useState<readonly SelectOption[] | SelectOption | null>()

  useEffect(() => {
    if (!loading && values.length) {
      setValue(valueToSelectOption(props.value || props.defaultValue, values, props.isMulti))
    }
  }, [props.value, values, props.defaultValue, loading])

  useEffect(() => {
    if (props.optionsFrom) {
      const cond = option(props.fetchCondition)
        .map(cond => cond())
        .getOrElse(true);

      if (cond) {
        setLoading(true);

        let promise: Promise<T[]>;
        if (isPromise(props.optionsFrom)) {
          promise = props.optionsFrom as Promise<T[]>
        } else if (typeof props.optionsFrom === 'function') {
          const result = props.optionsFrom({ rawValues: getValues(), value: getValues(props.id!), getValue: (k: string) => getValues(k) })
          promise = isPromise(result) ? result as Promise<T[]> : props.httpClient!(result as string, 'GET').then(r => r.json())
        } else {
          promise = props.httpClient!(props.optionsFrom as string, 'GET').then(r => r.json())
        }

        promise
          .then((values: T[]) => values.map(x => transformOption(x)))
          .then((values: SelectOption[]) => {
            setValues(values);
            setValue(values.find((item) => {
              if (Array.isArray(value)) {
                return (value as SelectOption[]).find(opt => opt.value === item.value)
              } else {
                return item.value === (value ? (value as SelectOption).value : value)
              }

            }) || null);
            setLoading(false);
          });
      }
    } else {
      setValues((props.possibleValues || [])
        .map(v => transformOption(v)))
      setTimeout(() => setLoading(false), 250)
    }

  }, [props.optionsFrom, props.possibleValues, props.onChange]) //FIXME: I'mnot sure that adding onchange is a good idea to recompute 


  const onChange = (changes: readonly SelectOption[] | SelectOption | null) => {
    setValue(changes)
    if (props.isMulti) {
      props?.onChange?.((changes as SelectOption[]).map(x => x.value))
    } else {
      props?.onChange?.((changes as SelectOption)?.value);
    }
  };

  const handleCreate = (label: string, fn: (x: string) => T) => {
    const createdValue = option(fn)
      .map(func => func(label))
      .flatMap(createdOpt => transform(createdOpt))
      .getOrElse(valueToSelectOption(label, values) as SelectOption)

    setValues([...values || [], createdValue])

    if (props.isMulti) {
      onChange([...(value as SelectOption[]) || [], createdValue])
    } else {
      onChange(createdValue)
    }
  }

  const handleSelectButtonClick = (v: SelectOption) => {
    if (props.isMulti) {
      const vs = value as SelectOption[]
      if (vs.includes(v)) { /* FIXME could be a different object ref but the same SelectOption, perhaps it would be better to compare label/values ? */
        return onChange(vs.filter(val => val.value !== v.value))
      } else {
        return onChange([...vs, v])
      }
    }

    if (!props.isMulti && props.isClearable && !!value && v.value === (value as SelectOption).value) {
      return onChange(null)
    }

    return onChange(v)
  }

  if (props.buttons) {
    return (
      <div style={{ display: 'flex' }}>
        {values.map((v, idx) => {
          const active = !!value && (props.isMulti ? (value as SelectOption[]).includes(v) : v.value === (value as SelectOption).value)
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
        isDisabled={loading || props.disabled}
        placeholder={props.placeholder}
        onChange={onChange}
        options={values}
        onCreateOption={option => handleCreate(option, props.onCreateOption!)}
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
        defaultValue={value}
        isDisabled={loading || props.disabled}
        placeholder={props.placeholder}
        options={values}
        onChange={onChange}
        classNamePrefix="react-form-select"
        className={props.className}
      />
    )
  }
}
