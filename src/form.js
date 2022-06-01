import React, { useEffect, useState, useRef, useImperativeHandle, useContext } from 'react'
import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'classnames';
import deepEqual from 'fast-deep-equal';
import { HelpCircle, Loader, Upload, ChevronDown, ChevronUp, Trash2 } from 'react-feather';
import { useForm, useFormContext, Controller, useFieldArray, FormProvider, useWatch } from 'react-hook-form';
import { DatePicker } from 'react-rainbow-components';
import ReactToolTip from 'react-tooltip';
import { v4 as uuid } from 'uuid';
import * as yup from "yup";

import { type } from './type';
import { format } from './format';
import { BooleanInput, Collapse, SelectInput, ObjectInput, CodeInput, MarkdownInput, SingleLineCode } from './inputs/index';
import { getShapeAndDependencies } from './resolvers/index';
import { option } from './Option'
import { ControlledInput } from './controlledInput';
import { arrayFlatten, isDefined, useHashEffect } from './utils';

import './style.scss'

const usePrevious = (value) => {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();

  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

const BasicWrapper = ({ entry, className, label, help, children, render }) => {
  if (typeof entry === 'object') {
    return children
  }

  const id = uuid();

  const { formState } = useFormContext();
  const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.errors)
  const isDirty = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.dirtyFields)
  const isTouched = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.touchedFields)
  const errorDisplayed = formState.isSubmitted || isDirty || isTouched

  if (render) {
    return render({ entry, label, error, help, children })
  }

  return (
    <div className='mrf-mt_10' style={{ position: 'relative' }}>
      {label && <label className='mrf-flex mrf-ai_center mrf-mb_5' htmlFor={entry}>
        <span>{label}</span>
        {help && <>
          <ReactToolTip html={true} place={'bottom'} id={id} />
          <span className='mrf-flex mrf-ai_center' data-html={true} data-tip={help} data-for={id}>
            <HelpCircle style={{ color: 'gray', width: 17, marginLeft: '.5rem', cursor: 'help' }} />
          </span>
        </>}
      </label>}

      {children}
      {error && <div className={classNames('mrf-feedback', { ['mrf-txt_red']: errorDisplayed })}>{error.message}</div>}
    </div>
  )
}

const CustomizableInput = props => {
  if (props.render) {
    return (
      props.render({ ...props.field, error: props.error })
    )
  }
  return props.children
}

const defaultVal = (value, array, defaultValue, type) => {
  if (isDefined(defaultValue)) return defaultValue
  if (!!array) return []
  return value
}

const getDefaultValues = (flow, schema, value) => {
  return (flow || []).reduce((acc, key) => {
    if (typeof key === 'object') {
      return { ...acc, ...getDefaultValues(key.flow, schema, value) }
    }
    const entry = schema[key]
    if (!entry) { return acc }
    return { ...acc, [key]: defaultVal(value ? value[key] : null, entry.array || entry.isMulti, entry.defaultValue) }
  }, {})
}


const cleanInputArray = (obj, defaultValues, flow, subSchema) => {
  const realFlow = option(flow)
    .map(f => f.map(v => v.flow || v))
    .map(arrayFlatten)
    .getOrElse(Object.keys(subSchema || {}))

  return Object.entries(subSchema || {})
    .filter(([key]) => realFlow.includes(key))
    .reduce((acc, [key, step]) => {
      let v = null;
      if (obj) {
        v = obj[key];
      }

      const maybeDefaultValue = defaultValues[key]
      if (!v && isDefined(maybeDefaultValue)) {
        v = maybeDefaultValue;
      }

      if (step.array && !step.render) {
        return {
          ...acc, [key]: (v || []).map(value => ({
            value: typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value) ?
              cleanInputArray(value, defaultValues, subSchema[key]?.flow, subSchema[key]?.schema || {}) : value
          }))
        }
      } else if (typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) {
        return { ...acc, [key]: cleanInputArray(v, defaultValues, subSchema[key]?.flow, subSchema[key]?.schema || {}) }
      } else {
        return { ...acc, [key]: v === undefined ? (Array.isArray(v) ? [] : step.type === type.object ? {} : null) : v }
      }
    }, obj)
}

const cleanOutputArray = (obj, subSchema) => {
  return Object.entries(obj).reduce((acc, curr) => {
    const [key, v] = curr;

    if (Array.isArray(v)) {
      const isArray = option(subSchema)
        //        .orElse(schema) TODO : schema is undefined
        .map(s => s[key])
        .map(entry => !!entry.array && !entry.render)
        .getOrElse(false)

      if (isArray) {
        return {
          ...acc, [key]: v.map(step => {
            if (!!step.value && typeof step.value === 'object' && !(step.value instanceof (Date) && !Array.isArray(step.value)))
              return cleanOutputArray(step.value, subSchema[key]?.schema || {})
            return step.value
          })
        }
      }
      return { ...acc, [key]: v }
    } else if (!!v && typeof v === 'object' && !(v instanceof (Date) && !Array.isArray(v))) {
      return { ...acc, [key]: cleanOutputArray(v, subSchema[key]?.schema || {}) }
    } else {
      if (subSchema[key]?.type === 'json') {
        try {
          return { ...acc, [key]: JSON.parse(v) }
        } catch (err) {
          return { ...acc, [key]: v }
        }
      } else {
        return { ...acc, [key]: v }
      }
    }
  }, {})
}

export const validate = (flow, schema, value) => {
  const formFlow = flow || Object.keys(schema)

  const { shape, dependencies } = getShapeAndDependencies(formFlow, schema);
  return yup.object()
    .shape(shape, dependencies)
    .validate(value, {
      abortEarly: false
    })
}

const Watcher = ({ options, control, schema, onSubmit, handleSubmit }) => {
  const data = useWatch({ control })
  useHashEffect(() => {
    if (!!options.autosubmit) {
      handleSubmit(() => {
        onSubmit(cleanOutputArray(data, schema))
      })()
    }
  }, [data])

  if (options.watch) {
    if (typeof options.watch === 'function') {
      options.watch(cleanOutputArray(data, schema))
    } else {
      console.group('react-form watch')
      console.log(cleanOutputArray(data, schema))
      console.groupEnd()
    }
  }

  return null
}

export const Form = React.forwardRef(({ schema, flow, value, inputWrapper, onSubmit, onError = () => { }, footer, style = {}, className, options = {}, nostyle }, ref) => {
  
  const formFlow = flow || Object.keys(schema)
  const maybeCustomHttpClient = (url, method) => {
    //todo: if present props.resolve()
    if (options.httpClient) {
      return options.httpClient(url, method)
    }
    return fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
    })
  }

  const defaultValues = getDefaultValues(formFlow, schema, value);

  //FIXME: get real schema through the switch

  const resolver = (rawData) => {
    const { shape, dependencies } = getShapeAndDependencies(formFlow, schema, [], rawData);
    const resolver = yup.object().shape(shape, dependencies);
    return resolver;
  }

  const methods = useForm({
    resolver: (data, context, options) => yupResolver(resolver(data))(data, context, options),
    shouldFocusError: false,
    mode: 'onChange'
  });

  const [initialReseted, setReset] = useState(false)

  // useEffect(() => {
  //   reset(cleanInputArray(value, defaultValues, flow, schema))
  //   setReset(true)
  // }, [reset])

  useEffect(() => {
    trigger();
  }, [trigger, initialReseted])

  const { handleSubmit, formState: { errors, dirtyFields }, reset, trigger, getValues, watch } = methods

  useHashEffect(() => {
    reset({ ...cleanInputArray(value, defaultValues, flow, schema) })
  }, [value, schema])


  const functionalProperty = (entry, prop) => {
    if (typeof prop === 'function') {
      return prop({ rawValues: getValues(), value: getValues(entry) });
    } else {
      return prop;
    }
  }

  useImperativeHandle(ref, () => ({
    handleSubmit: () => handleSubmit(data => {
      const clean = cleanOutputArray(data, schema)
      onSubmit(clean)
    }, onError)(),
    trigger,
    methods: {
      ...methods,
      data: () => cleanOutputArray(getValues(), schema)
    }
  }));

  return (
    <FormProvider {...methods}>
      <Watcher
        options={options}
        control={methods.control}
        schema={schema}
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        watch={methods.watch} />
      <form className={className || `mrf-pr_15 mrf-w_100`} onSubmit={handleSubmit(data => {
        const clean = cleanOutputArray(data, schema)
        onSubmit(clean)
      }, onError)}>
        {formFlow.map((entry, idx) => {
          const step = schema[entry]

          if (!step && typeof entry === 'string') {
            console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
            return null;
          }

          const visibleStep = option(step)
            .map(s => s.visible)
            .map(visible => {
              switch (typeof visible) {
                case 'object':
                  const value = watch(step.visible.ref);
                  return option(step.visible.test).map(test => test(value, idx)).getOrElse(value)
                case 'boolean':
                  return visible;
                default:
                  return true;
              }
            })
            .getOrElse(true)

          if (!visibleStep) {
            return null;
          }

          return (
            <BasicWrapper key={`${entry}-${idx}`} entry={entry} dirtyFields={dirtyFields} label={functionalProperty(entry, step?.label === null ? null : step?.label || entry)} help={step?.help} render={inputWrapper}>
              <Step key={idx} entry={entry} step={step}
                schema={schema} inputWrapper={inputWrapper}
                httpClient={maybeCustomHttpClient} functionalProperty={functionalProperty} />
            </BasicWrapper>
          )
        })}
        <Footer render={footer} reset={() => reset(defaultValues)} valid={handleSubmit(data => onSubmit(cleanOutputArray(data, schema)), onError)} actions={options.actions} />
      </form>
    </FormProvider>
  )
})

const Footer = (props) => {
  if (props.render) {
    return props.render({ reset: props.reset, valid: props.valid })
  }

  const isSubmitDisplayed = props.actions?.submit?.display === undefined ? true : !!props.actions?.submit?.display

  return (
    <div className='mrf-flex mrf-jc_end mrf-mt_5'>
      {props.actions?.cancel?.display && <button className='mrf-btn mrf-btn_red' type="button" onClick={() => props.actions?.cancel.action()}>{props.actions?.cancel?.label || 'Cancel'}</button>}
      {props.actions?.reset?.display && <button className='mrf-btn mrf-btn_red' type="button" onClick={props.reset}>{props.actions?.reset?.label || 'Reset'}</button>}
      {isSubmitDisplayed && <button className='mrf-btn mrf-btn_green mrf-ml_10' type="submit">{props.actions?.submit?.label || 'Save'}</button>}
    </div>
  )
}

const Step = ({ entry, realEntry, step, schema, inputWrapper, httpClient, defaultValue, index, functionalProperty, parent, onAfterChange }) => {
  const { formState: { errors, dirtyFields, touchedFields, isSubmitted }, control, trigger, getValues, setValue, watch, register } = useFormContext();

  if (entry && typeof entry === 'object') {
    const errored = entry.flow.some(step => !!errors[step] && (dirtyFields[step] || touchedFields[step]))
    return (
      <Collapse {...entry} errored={errored}>
        {entry.flow.map((en, entryIdx) => {
          const stp = schema[en]
          const err = typeof en === 'object' ? undefined : en.split('.').reduce((object, key) => {
            return object && object[key];
          }, errors);

          if (!stp && typeof en === 'string') {
            console.error(`no step found for the entry "${en}" in the given schema. Your form might not work properly. Please fix it`)
            return null;
          }

          const visibleStep = option(stp)
            .map(s => s.visible)
            .map(visible => {
              switch (typeof visible) {
                case 'object':
                  const value = watch(visible.ref);
                  return option(visible.test).map(test => test(value, index)).getOrElse(value)
                case 'boolean':
                  return visible;
                default:
                  return true;
              }
            })
            .getOrElse(true)

          if (!visibleStep) {
            return null;
          }

          return (
            <BasicWrapper key={`collapse-${en}-${entryIdx}`} entry={en} label={functionalProperty(en, stp?.label === null ? null : stp?.label || en)} help={stp?.help} render={inputWrapper}>
              <Step entry={en} step={stp} schema={schema}
                inputWrapper={inputWrapper} httpClient={httpClient}
                defaultValue={stp?.defaultValue} functionalProperty={functionalProperty} />
            </BasicWrapper>
          )
        })}
      </Collapse>
    )
  }

  const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], errors)
  const isDirty = entry.split('.').reduce((acc, curr) => acc && acc[curr], dirtyFields)
  const isTouched = entry.split('.').reduce((acc, curr) => acc && acc[curr], touchedFields)
  const errorDisplayed = !!error && (isSubmitted || isDirty || isTouched)

  const onAfterChangeFunc = onAfterChange || step.onAfterChange || step.on_after_change

  if (onAfterChangeFunc) {
    const data = watch()

    const d = entry
      .replace('[', '.').replace(']', '')
      .split('.')
      .reduce((acc, curr) => acc && acc[curr], data) || {}

    const currentData = usePrevious(cleanOutputArray(d, schema))
    const newData = cleanOutputArray(d, schema)

    if (!deepEqual(newData, currentData) || (newData !== undefined && currentData === undefined))
      onAfterChangeFunc({
        entry,
        value: getValues(entry),
        rawValues: newData,
        previousValue: currentData,
        getValue: e => getValues(e),
        setValue,
        onChange: v => setValue(entry, v)
      })
  }

  if (step.array) {
    return (
      <CustomizableInput render={step.render} field={{
        setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v)
      }} error={error}>
        <ArrayStep
          entry={entry}
          step={step}
          disabled={functionalProperty(entry, step.disabled)}
          component={((props, idx) => {
            return (
              <Step
                entry={`${entry}.${idx}.value`}
                onAfterChange={step.onAfterChange || step.on_after_change}
                step={{ ...(schema[realEntry || entry]), render: step.itemRender, onChange: undefined, array: false }}
                schema={schema}
                inputWrapper={inputWrapper}
                httpClient={httpClient}
                defaultValue={props.defaultValue?.value}
                value={props.value}
                index={idx}
                functionalProperty={functionalProperty} />
            )
          })} />
      </CustomizableInput >
    )
  }

  switch (step.type) {
    case type.string:
      switch (step.format) {
        case format.text:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <textarea
                type="text"
                className={classNames('mrf-input', step.className, { ['mrf-mrf-input__invalid']: errorDisplayed })} />
            </ControlledInput>
          );
        case format.code:
        case format.singleLineCode:
          const Component = step.format === format.code ? CodeInput : SingleLineCode
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <Component className={classNames(step.className, { ['mrf-input__invalid']: errorDisplayed })} />
            </ControlledInput>
          )
        case format.markdown:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <MarkdownInput className={classNames(step.className, { ['mrf-input__invalid']: errorDisplayed })} />
            </ControlledInput>
          )
        case format.buttonsSelect:
        case format.select: {
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <SelectInput
                className={classNames('mrf-flex_grow_1', step.className, { ['mrf-input__invalid']: errorDisplayed })}
                disabled={functionalProperty(entry, step.disabled)}
                {...step.props}
                possibleValues={step.options}
                httpClient={httpClient}
                isMulti={step.isMulti}
                createOption={step.createOption}
                transformer={step.transformer}
                buttons={step.format === format.buttonsSelect}
                optionsFrom={step.optionsFrom}
              />
            </ControlledInput>
          )
        }
        default:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <input
                type={step.format || 'text'}
                className={classNames('mrf-input', step.className, { ['mrf-input__invalid']: errorDisplayed })}
              />
            </ControlledInput>
          )
      }

    case type.number:
      switch (step.format) {
        case format.buttonsSelect:
        case format.select:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <SelectInput
                className={classNames('mrf-content', step.className, { ['mrf-input__invalid']: errorDisplayed })}
                {...step.props}
                possibleValues={step.options}
                httpClient={httpClient}
                isMulti={step.isMulti}
                createOption={step.createOption}
                onCreateOption={step.onCreateOption}
                transformer={step.transformer}
                buttons={step.format === format.buttonsSelect}
                optionsFrom={step.optionsFrom}
              />
            </ControlledInput>
          )
        default:
          return <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
            <input
              type={step.format || 'number'}
              className={classNames('mrf-input', step.className, { ['mrf-input__invalid']: errorDisplayed })}
            />
          </ControlledInput>
      }

    case type.bool:
      return (
        <ControlledInput
          step={step}
          entry={entry}
          errorDisplayed={errorDisplayed}>
          <BooleanInput className={classNames(step.className, { ['mrf-input__invalid']: errorDisplayed })} />
        </ControlledInput>
      )

    case type.object:
      switch (step.format) {
        case format.buttonsSelect:
        case format.select:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <SelectInput
                className={classNames('mrf-flex_grow_1', step.className, { ['mrf-input__invalid']: errorDisplayed })}
                {...step.props}
                possibleValues={step.options}
                httpClient={httpClient}
                isMulti={step.isMulti}
                createOption={step.createOption}
                onCreateOption={step.onCreateOption}
                transformer={step.transformer}
                buttons={step.format === format.buttonsSelect}
                optionsFrom={step.optionsFrom}
              />
            </ControlledInput>
          )
        case format.form: //todo: disabled ?
          const flow = option(step.flow).getOrElse(option(step.schema).map(s => Object.keys(s)).getOrNull());
          return (
            <CustomizableInput render={step.render} field={{ parent, setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }}>
              <NestedForm
                schema={step.schema} flow={flow} step={step} parent={entry}
                inputWrapper={inputWrapper} maybeCustomHttpClient={httpClient} value={getValues(entry) || defaultValue}
                index={index} functionalProperty={functionalProperty} errorDisplayed={errorDisplayed} />
            </CustomizableInput>
          )

        case format.code:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed} component={(field, props) => (
              <CodeInput
                {...props}
                className={classNames(step.className, { ['mrf-input__invalid']: error })}
                onChange={(e) => {
                  errorDisplayed = { errorDisplayed }
                  let v
                  try {
                    v = JSON.parse(e)
                  } catch (err) {
                    v = e
                  }
                  field.onChange(v)
                  option(step.onChange)
                    .map(onChange => onChange({ rawValues: getValues(), value: v, setValue }))
                }}
                value={field.value === null ? null : ((typeof field.value === 'object') ? JSON.stringify(field.value, null, 2) : field.value)}
              />
            )}>
            </ControlledInput>
          )
        default:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <ObjectInput
                className={classNames(step.className, { ['mrf-input__invalid']: errorDisplayed })}
              />
            </ControlledInput>
          )
      }
    case type.date:
      return (
        <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
          <DatePicker
            className={classNames('mrf-datepicker', step.className, { ['mrf-input__invalid']: errorDisplayed })}
            formatStyle="large"
          />
        </ControlledInput>
      )
    case type.file:
      return (
        <Controller
          name={entry}
          control={control}
          render={({ field }) => {
            const FileInput = ({ onChange }) => {
              const [uploading, setUploading] = useState(false);
              const [input, setInput] = useState(undefined);

              const setFiles = (e) => {
                const files = e.target.files;
                setUploading(true);
                onChange([...files])
                setUploading(false);
              };

              const trigger = () => {
                input.click();
              };

              const files = field.value || []

              return (
                <div className={classNames('mrf-flex', 'mrf-ai_center', step.className, { ['mrf-input__invalid']: error })}>
                  <input
                    ref={(r) => setInput(r)}
                    type="file"
                    multiple
                    className='mrf-d_none'
                    onChange={setFiles}
                  />
                  <button
                    type="button"
                    className='mrf-btn mrf-btn_sm mrf-flex mrf-ai_center'
                    disabled={uploading || functionalProperty(entry, step.disabled)}
                    onClick={trigger}>
                    {uploading && <Loader />}
                    {!uploading && <Upload />}
                    <span className='mrf-ml_5'>Select file(s)</span>
                  </button>

                  <span className='mrf-ml_5'>{files.length <= 0 ? 'No files selected' : files.map(r => r.name).join(" , ")}</span>
                </div>
              );
            };

            return (
              <ControlledInput defaultValue={defaultValue} step={step} entry={entry} errorDisplayed={errorDisplayed}>
                <FileInput />
              </ControlledInput>
            )
          }}
        />
      )

    case type.json:
      return (
        <ControlledInput defaultValue={defaultValue} step={step} entry={entry} component={(field, props) => (
          <CodeInput
            {...props}
            className={classNames({ ['mrf-input__invalid']: error })}
            onChange={v => {
              field.onChange(v)
              option(step.onChange)
                .map(onChange => onChange({ rawValues: getValues(), value: v, setValue }))
            }}
            value={field.value}
          />
        )}>
        </ControlledInput>
      )

    default:
      return null;
  }

}


const ArrayStep = ({ entry, step, component, disabled }) => {
  const { getValues, setValue, control, trigger, formState } = useFormContext();

  const values = getValues(entry);
  const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.errors)
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
                  className='mrf-btn mrf-btn_red mrf-btn_sm mrf-ml_5' disabled={disabled} onClick={() => {
                    remove(idx)
                    trigger(entry);
                  }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      <div className='mrf-flex mrf-jc_flex_end'>
        <button type="button" className={classNames('mrf-btn', 'mrf-btn_blue', 'mrf-btn_sm', 'mrf-mt_5', { ['mrf-input__invalid']: errorDisplayed })} onClick={() => {
          const newValue = cleanInputArray({}, getValues(entry), step.flow, step.schema)
          append({ value: step.addableDefaultValue || ((step.type === type.object && newValue) ? newValue : defaultVal()) })
          // trigger(entry);
          option(step.onChange)
            .map(onChange => onChange({ rawValues: getValues(), value: getValues(entry), setValue }))
        }} disabled={disabled}>Add</button>
        {error && <div className="mrf-invalid-feedback">{error.message}</div>}
      </div>
    </>
  )
}

const NestedForm = ({ schema, flow, parent, inputWrapper, maybeCustomHttpClient, errorDisplayed, value, step, functionalProperty, index }) => {
  const { getValues, setValue, watch } = useFormContext();
  const [collapsed, setCollapsed] = useState(!!step.collapsed);

  useWatch(step?.conditionalSchema?.ref)

  const schemaAndFlow = option(step.conditionalSchema)
    .map(condiSchema => {
      const ref = option(condiSchema.ref).map(ref => getValues(ref)).getOrNull();
      const rawValues = getValues()

      const filterSwitch = condiSchema.switch.find(s => {
        if (typeof s.condition === 'function') {
          return s.condition({ rawValues, ref })
        } else {
          return s.condition === ref
        }
      })

      const schemaAndFlow = option(filterSwitch)
        .orElse(condiSchema.switch.find(s => s.default))
        .getOrElse({ schema: {}, flow: [] })

      return { schema: schemaAndFlow.schema, flow: schemaAndFlow.flow || Object.keys(schemaAndFlow.schema) }
    })
    .getOrElse({ schema, flow })

  useHashEffect(() => {
    const def = getDefaultValues(schemaAndFlow.flow, schemaAndFlow.schema, getValues(parent));
    setValue(parent, def, { shouldValidate: false })
  }, [schemaAndFlow.schema])

  const computedSandF = schemaAndFlow.flow.reduce((acc, entry) => {
    const step = schemaAndFlow.schema[entry]

    const visibleStep = option(step)
      .map(s => s.visible)
      .map(visible => {
        switch (typeof visible) {
          case 'object':
            const value = watch(visible.ref);
            return option(visible.test).map(test => test(value, index)).getOrElse(value)
          case 'boolean':
            return visible;
          default:
            return true;
        }
      })
      .getOrElse(true)

    return [...acc, { step, visibleStep, entry }]
  }, [])

  const bordered = computedSandF.filter(x => x.visibleStep).length >= 1 && step.label !== null;
  return (
    <div className={classNames({ ['mrf-nestedform__border']: bordered, ['mrf-border__error']: !!errorDisplayed })} style={{ position: 'relative' }}>
      {!!step.collapsable && schemaAndFlow.flow.length > 1 && collapsed &&
        <ChevronDown size={30} className='mrf-cursor_pointer' style={{ position: 'absolute', top: -35, right: 0, zIndex: 100 }} strokeWidth="2" onClick={() => setCollapsed(!collapsed)} />}
      {!!step.collapsable && schemaAndFlow.flow.length > 1 && !collapsed &&
        <ChevronUp size={30} className='mrf-cursor_pointer' style={{ position: 'absolute', top: -35, right: 0, zIndex: 100 }} strokeWidth="2" onClick={() => setCollapsed(!collapsed)} />}

      {computedSandF.map(({ step, visibleStep, entry }, idx) => {

        if (!step && typeof entry === 'string') {
          console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
          return null;
        }

        return (
          <BasicWrapper key={`${entry}.${idx}`}
            className={classNames({ ['mrf-display__none']: (collapsed && !step.visibleOnCollapse) || !visibleStep })}
            entry={`${parent}.${entry}`}
            label={functionalProperty(entry, step?.label === null ? null : step?.label || entry)} help={step.help} render={inputWrapper}>
            <Step
              key={`step.${entry}.${idx}`}
              entry={`${parent}.${entry}`}
              realEntry={entry}
              step={schemaAndFlow.schema[entry]}
              parent={parent}
              schema={schemaAndFlow.schema}
              inputWrapper={inputWrapper}
              httpClient={maybeCustomHttpClient}
              defaultValue={value && value[entry]}
              functionalProperty={functionalProperty} />
          </BasicWrapper>
        )
      })}
    </div>
  )
}
