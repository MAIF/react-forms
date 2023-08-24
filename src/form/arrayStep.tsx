import React from 'react';
import classNames from 'classnames';
// @ts-ignore
import Trash2 from 'react-feather/dist/icons/trash-2.js';
import { useFormContext, useFieldArray } from "react-hook-form";

import { SchemaEntry } from "./types";
import { option } from '../Option';
import { type } from '../type';
import { defaultVal, getDefaultValues } from './formUtils';

export const ArrayStep = ({ entry, step, component, disabled, addLabel }:
  {
    entry: string,
    step: SchemaEntry,
    component: ({ key, defaultValue, value }: { key: string, defaultValue: any, value?: any }, ids: number) => JSX.Element,
    disabled: boolean,
    addLabel?: string
  }) => {
  const { getValues, setValue, control, trigger, formState } = useFormContext();

  const values = getValues(entry);
  //@ts-ignore
  const error: { [x: string]: any } = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.errors)
  const isDirty = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.dirtyFields)
  const isTouched = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.touchedFields)
  const errorDisplayed = !!error && (formState.isSubmitted || isDirty || isTouched)

  const { fields, append, remove } = useFieldArray({ control, name: entry });

  return (
    <>
      {fields
        .map((field, idx) => {
          return (
            <div key={field.id}>
              <div className='mrf-ai_center mrf-mt_5' style={{ position: 'relative' }}>
                <div style={{ width: '95%' }}>
                  {component({ key: field.id, ...field, defaultValue: values[idx] }, idx)}
                </div>
                <button type="button"
                  style={{ position: 'absolute', top: '2px', right: 0 }}
                  className='mrf-btn mrf-btn_red mrf-btn_sm mrf-ml_5'
                  disabled={disabled}
                  onClick={() => {
                    remove(idx)
                    option(step.onChange)
                      .map(onChange => onChange({ rawValues: getValues(), value: getValues(entry), setValue }))
                    trigger(entry);
                  }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      <div className='mrf-flex mrf-jc_flex_end'>
        <button type="button"
          className={classNames('mrf-btn', 'mrf-btn_blue', 'mrf-btn_sm', 'mrf-mt_5', { ['mrf-input__invalid']: !!errorDisplayed })}
          onClick={() => {
            const defaultValues = step.type === type.object ? getDefaultValues(step.flow, step.schema) : defaultVal()
            append({ value: step.addableDefaultValue || defaultValues })
            // trigger(entry);
            option(step.onChange)
              .map(onChange => onChange({ rawValues: getValues(), value: getValues(entry), setValue }))
          }} disabled={disabled}>{addLabel ? addLabel : 'Add'}</button>
      </div>
    </>
  )
}