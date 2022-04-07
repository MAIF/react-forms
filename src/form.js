import React, { useEffect, useState, useRef, useImperativeHandle } from 'react'
import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'classnames';
import { HelpCircle, Loader, Upload, ChevronDown, ChevronUp, Trash2 } from 'react-feather';
import { useForm, useFormContext, Controller, useFieldArray, FormProvider } from 'react-hook-form';
import { DatePicker } from 'react-rainbow-components';
import ReactToolTip from 'react-tooltip';
import { v4 as uuid } from 'uuid';
import * as yup from "yup";

import { useCustomStyle } from './styleContext';
import { type } from './type';
import { format } from './format';
import { BooleanInput, Collapse, SelectInput, ObjectInput, CodeInput, MarkdownInput, SingleLineCode } from './inputs/index';
import { getShapeAndDependencies } from './resolvers/index';
import { option } from './Option'
import { ControlledInput } from './controlledInput';
import { deepEqual } from './utils';

const usePrevious = (value) => {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();

  // Store current value in ref
  useEffect(() => {
    ref.current = value && JSON.parse(JSON.stringify(value));
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

const BasicWrapper = ({ entry, className, label, help, children, render }) => {
  if (typeof entry === 'object') {
    return children
  }

  const classes = useCustomStyle()
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
    <div className={`${classes.mt_10} ${className}`} style={{ position: 'relative' }}>
      {label && <label className={`${classes.flex} ${classes.ai_center} ${classes.mb_5}`} htmlFor={entry}>
        <span>{label}</span>
        {help && <>
          <ReactToolTip html={true} place={'bottom'} id={id} />
          <span className={`${classes.flex} ${classes.ai_center}`} data-html={true} data-tip={help} data-for={id}>
            <HelpCircle style={{ color: 'gray', width: 17, marginLeft: '.5rem', cursor: 'help' }} />
          </span>
        </>}
      </label>}

      {children}
      {error && <div className={classNames(classes.feedback, { [classes.txt_red]: errorDisplayed })}>{error.message}</div>}
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

const defaultVal = (value, t, array, defaultValue) => {
  if (!!defaultValue) return defaultValue
  if (!!array) return []
  return value
}

const getDefaultValues = (flow, schema, value) => {
  return flow.reduce((acc, key) => {
    if (typeof key === 'object') {
      return { ...acc, ...getDefaultValues(key.flow, schema, value) }
    }
    const entry = schema[key]
    if (!entry) { return acc }
    return { ...acc, [key]: defaultVal(value ? value[key] : null, entry.type, entry.array || entry.isMulti, entry.defaultValue) }
  }, {})
}


const cleanInputArray = (obj, defaultValues, subSchema) => {
  return Object.entries(subSchema).reduce((acc, [key, step]) => {
    let v
    if (obj)
      v = obj[key]
    if (!v && defaultValues)
      v = defaultValues[key]

    if (step.array && !step.render) {
      return { ...acc, [key]: (v || []).map(value => ({ value })) }
    } else if (typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) {
      return { ...acc, [key]: cleanInputArray(v, defaultValues, subSchema[key]?.schema || {}) }
    } else {
      return { ...acc, [key]: v }
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
        return { ...acc, [key]: v.map(({ value }) => value) }
      }
      return { ...acc, [key]: v }
    } else if (!!v && typeof v === 'object' && !(v instanceof (Date) && !Array.isArray(v))) {
      return { ...acc, [key]: cleanOutputArray(v, subSchema[key]?.schema || {}) }
    } else {
      return { ...acc, [key]: v === undefined ? null : v }
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

export const Form = React.forwardRef(({ schema, flow, value, inputWrapper, onSubmit, onError = () => { }, footer, style = {}, className, options = {} }, ref) => {
  const classes = useCustomStyle(style)
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
    defaultValues: cleanInputArray(value, defaultValues, schema),
    shouldFocusError: false,
    mode: 'onChange'
  });

  const { handleSubmit, formState: { errors, dirtyFields }, reset, watch, trigger, getValues } = methods

  useEffect(() => {
    trigger()
  }, [trigger])

  useEffect(() => {
    if (value) {
      reset(cleanInputArray(value, defaultValues, schema))
    }
  }, [value, reset])

  useEffect(() => {
    reset(cleanInputArray(value, defaultValues, schema))
  }, [schema])

  const data = watch();
  const prevData = usePrevious(cleanOutputArray(data, schema))
  useEffect(() => {
    //todo: with debounce
    if (!!options.autosubmit && !isEqual(cleanOutputArray(data, schema), prevData)) {
      handleSubmit(data => {
        const clean = cleanOutputArray(data, schema)
        onSubmit(clean)
      }, onError)()
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
    rawData: () => cleanOutputArray(data, schema),
    trigger,
    methods
  }));

  return (
    <FormProvider {...methods} >
      <form className={className || `${classes.pr_15} ${classes.w_100}`} onSubmit={handleSubmit(data => {
        const clean = cleanOutputArray(data, schema)
        onSubmit(clean)
      }, onError)}>
        {formFlow.map((entry, idx) => {
          const step = schema[entry]

          if (!step && typeof entry === 'string') {
            console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
            return null;
          }
          const error = typeof entry === 'object' ? undefined : entry.split('.').reduce((object, key) => {
            return object && object[key];
          }, errors);

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
  const classes = useCustomStyle();

  if (props.render) {
    return props.render({ reset: props.reset, valid: props.valid })
  }

  const isSubmitDisplayed = props.actions?.submit?.display === undefined ? true : !!props.actions?.submit?.display

  return (
    <div className={`${classes.flex} ${classes.jc_end} ${classes.mt_5}`}>
      {props.actions?.cancel?.display && <button className={`${classes.btn} ${classes.btn_red}`} type="button" onClick={() => props.actions?.cancel.action()}>{props.actions?.cancel?.label || 'Cancel'}</button>}
      {props.actions?.reset?.display && <button className={`${classes.btn} ${classes.btn_red}`} type="button" onClick={props.reset}>{props.actions?.reset?.label || 'Reset'}</button>}
      {isSubmitDisplayed && <button className={`${classes.btn} ${classes.btn_green} ${classes.ml_10}`} type="submit">{props.actions?.submit?.label || 'Save'}</button>}
    </div>
  )
}

const Step = ({ entry, realEntry, step, schema, inputWrapper, httpClient, defaultValue, index, functionalProperty, parent, onAfterChange }) => {
  const classes = useCustomStyle();
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

  const data = watch()
  const currentData = usePrevious(cleanOutputArray(data, schema))

  useEffect(() => {
    const newData = cleanOutputArray(data, schema)
    const onAfterChange = onAfterChange || step.onAfterChange || step.on_after_change

    if (onAfterChange && !deepEqual(newData, currentData)) {
      onAfterChange({
        entry,
        value: getValues(entry),
        getValue: e => getValues(e),
        rawValues: newData,
        setValue,
        onChange: v => setValue(entry, v)
      })
    }
  }, [data])

  if (step.array) {
    return (
      <CustomizableInput render={step.render} field={{
        setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v)
      }} error={error}>
        <ArrayStep
          entry={entry} 
          step={step}
          defaultValue={step.defaultValue || null}
          disabled={functionalProperty(entry, step.disabled)}
          component={((props, idx) => {
            return (
              <Step
                entry={`${entry}.${idx}.value`}
                onAfterChange={step.onAfterChange || step.on_after_change}
                step={{  ...(schema[realEntry || entry]), render: step.itemRender, onChange: undefined, array: false }}
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
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
              <textarea
                type="text"
                className={classNames(classes.input, { [classes.input__invalid]: errorDisplayed })} />
            </ControlledInput>
          );
        case format.code:
        case format.singleLineCode:
          const Component = step.format === format.code ? CodeInput : SingleLineCode
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
              <Component className={classNames({ [classes.input__invalid]: errorDisplayed })} />
            </ControlledInput>
          )
        case format.markdown:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
              <MarkdownInput className={classNames({ [classes.input__invalid]: errorDisplayed })} />
            </ControlledInput>
          )
        case format.buttonsSelect:
        case format.select:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
              <SelectInput
                className={classNames(classes.flex_grow_1, { [classes.input__invalid]: errorDisplayed })}
                disabled={functionalProperty(entry, step.disabled)}
                possibleValues={step.options}
                httpClient={httpClient}
              />
            </ControlledInput>
          )
        default:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
              <input
                type={step.format || 'text'}
                className={classNames(classes.input, { [classes.input__invalid]: errorDisplayed })}
              />
            </ControlledInput>
          )
      }

    case type.number:
      switch (step.format) {
        case format.buttonsSelect:
        case format.select:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
              <SelectInput
                className={classNames(classes.content, { [classes.input__invalid]: errorDisplayed })}
                possibleValues={step.options}
                httpClient={httpClient}
              />
            </ControlledInput>
          )
        default:
          return <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
            <input
              type={step.format || 'number'}
              className={classNames(classes.input, { [classes.input__invalid]: errorDisplayed })}
            />
          </ControlledInput>
      }

    case type.bool:
      return (
        <ControlledInput
          defaultValue={defaultValue}
          step={step}
          entry={entry}>
          <BooleanInput className={classNames({ [classes.input__invalid]: errorDisplayed })} />
        </ControlledInput>
      )

    case type.object:
      switch (step.format) {
        case format.buttonsSelect:
        case format.select:
          return (
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
              <SelectInput
                className={classNames(classes.flex_grow_1, { [classes.input__invalid]: errorDisplayed })}
                possibleValues={step.options}
                httpClient={httpClient}
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
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry} component={(field, props) => (
              <CodeInput
                {...props}
                className={classNames({ [classes.input__invalid]: error })}
                onChange={(e) => {
                  let v
                  try {
                    v = JSON.parse(e)
                  } catch (err) {
                    v = {}
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
            <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
              <ObjectInput
                className={classNames({ [classes.input__invalid]: errorDisplayed })}
                possibleValues={step.options}
              />
            </ControlledInput>
          )
      }
    case type.date:
      return (
        <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
          <DatePicker
            className={classNames(classes.datepicker, { [classes.input__invalid]: errorDisplayed })}
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
                <div className={classNames(classes.flex, classes.ai_center, { [classes.input__invalid]: error })}>
                  <input
                    ref={(r) => setInput(r)}
                    type="file"
                    multiple
                    className={classes.d_none}
                    onChange={setFiles}
                  />
                  <button
                    type="button"
                    className={`${classes.btn} ${classes.btn_sm} ${classes.flex} ${classes.ai_center}`}
                    disabled={uploading || functionalProperty(entry, step.disabled)}
                    onClick={trigger}>
                    {uploading && <Loader />}
                    {!uploading && <Upload />}
                    <span className={`${classes.ml_5}`}>Select file(s)</span>
                  </button>

                  <span className={`${classes.ml_5}`}>{files.length <= 0 ? 'No files selected' : files.map(r => r.name).join(" , ")}</span>
                </div>
              );
            };

            return (
              <ControlledInput defaultValue={defaultValue} step={step} entry={entry}>
                <FileInput />
              </ControlledInput>
            )
          }}
        />
      )
    default:
      return null;
  }

}


const ArrayStep = ({ entry, step, component, disabled }) => {
  const classes = useCustomStyle()
  const { getValues, setValue, control, trigger, formState } = useFormContext();

  const values = getValues(entry);
  const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.errors)
  const isDirty = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.dirtyFields)
  const isTouched = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.touchedFields)
  const errorDisplayed = !!error && (formState.isSubmitted || isDirty || isTouched)

  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: entry, // unique name for your Field Array
    // keyName: "id", default to "id", you can change the key name
  });

  return (
    <>
      {fields
        .map((field, idx) => {
          return (
            <div key={field.id}>
              <div className={classNames(classes.ai_center, classes.mt_5)} style={{ position: 'relative' }}>
                <div style={{ width: '95%' }}>
                  {component({ key: field.id, ...field, defaultValue: values[idx] }, idx)}
                </div>
                <button type="button"
                  style={{ position: 'absolute', top: '2px', right: 0 }}
                  className={classNames(classes.btn, classes.btn_red, classes.btn_sm, classes.ml_5)} disabled={disabled} onClick={() => {
                    remove(idx)
                    trigger(entry);
                  }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      <div className={classNames(classes.flex, classes.jc_flex_end)}>
        <button type="button" className={classNames(classes.btn, classes.btn_blue, classes.btn_sm, classes.mt_5, { [classes.input__invalid]: errorDisplayed })} onClick={() => {
          append({ value: step.addableDefaultValue || defaultVal(null, step.type) })
          trigger(entry);
          option(step.onChange)
            .map(onChange => onChange({ rawValues: getValues(), value: getValues(entry), setValue }))
        }} disabled={disabled}>Add</button>
        {error && <div className="invalid-feedback">{error.message}</div>}
      </div>
    </>
  )
}

const NestedForm = ({ schema, flow, parent, inputWrapper, maybeCustomHttpClient, errorDisplayed, value, step, functionalProperty, index }) => {
  const { getValues, setValue, watch, trigger, formState } = useFormContext();
  const [collapsed, setCollapsed] = useState(!!step.collapsed);

  const classes = useCustomStyle();

  // TODO - voir ce qui se passe et à quoi ça sert
  // const v = getValues(parent);
  // useEffect(() => {
  //   trigger(parent)
  // }, [JSON.stringify(v)])

  const schemaAndFlow = option(step.conditionalSchema)
    .map(condiSchema => {
      const ref = option(condiSchema.ref).map(ref => getValues(ref)).getOrNull();
      const rawData = getValues()

      const filterSwitch = condiSchema.switch.find(s => {
        if (typeof s.condition === 'function') {
          return s.condition({ rawData, ref })
        } else {
          return s.condition === ref
        }
      })

      return option(filterSwitch).getOrElse(condiSchema.switch.find(s => s.default))
    })
    .getOrElse({ schema, flow })

  const prevSchema = usePrevious(schemaAndFlow.schema);
  useEffect(() => {
    if (!!prevSchema && !deepEqual(prevSchema, schemaAndFlow.schema)) {
      const def = getDefaultValues(schemaAndFlow.flow, schemaAndFlow.schema);
      setValue(parent, def, { shouldValidate: false })
    }
  }, [prevSchema, schemaAndFlow.schema])

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

  const bordered = computedSandF.filter(x => x.visibleStep).length > 1 && step.label !== null;
  return (
    <div className={classNames({ [classes.nestedform__border]: bordered, [classes.border__error]: !!errorDisplayed })} style={{ position: 'relative' }}>
      {!!step.collapsable && schemaAndFlow.flow.length > 1 && collapsed &&
        <ChevronDown size={30} className={classes.cursor_pointer} style={{ position: 'absolute', top: -35, right: 0, zIndex: 100 }} strokeWidth="2" onClick={() => setCollapsed(!collapsed)} />}
      {!!step.collapsable && schemaAndFlow.flow.length > 1 && !collapsed &&
        <ChevronUp size={30} className={classes.cursor_pointer} style={{ position: 'absolute', top: -35, right: 0, zIndex: 100 }} strokeWidth="2" onClick={() => setCollapsed(!collapsed)} />}

      {computedSandF.map(({ step, visibleStep, entry }, idx) => {

        if (!step && typeof entry === 'string') {
          console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
          return null;
        }

        return (
          <BasicWrapper key={`${entry}.${idx}`}
            className={classNames({ [classes.display__none]: (collapsed && !step.visibleOnCollapse) || !visibleStep })}
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
