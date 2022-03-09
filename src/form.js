import React, { useEffect, useState, useRef, useImperativeHandle } from 'react'
import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'classnames';
import { HelpCircle, Loader, Upload, ArrowDown, ArrowUp } from 'react-feather';
import { useForm, useFormContext, Controller, useFieldArray, FormProvider } from 'react-hook-form';
import { DatePicker } from 'react-rainbow-components';
import ReactToolTip from 'react-tooltip';
import { v4 as uuid } from 'uuid';
import * as yup from "yup";

import { useCustomStyle } from './styleContext';
import { type } from './type';
import { format } from './format';
import { BooleanInput, Collapse, SelectInput, ObjectInput, CodeInput, MarkdownInput } from './inputs/index';
import { getShapeAndDependencies } from './resolvers/index';
import { option } from './Option'

const usePrevious = (value) => {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();

  // Store current value in ref
  useEffect(() => {
    ref.current = JSON.parse(JSON.stringify(value));
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

const BasicWrapper = ({ entry, className, label, error, help, children, render }) => {
  const classes = useCustomStyle()
  const id = uuid();

  if (typeof entry === 'object') {
    return children
  }

  if (render) {
    return render({ entry, label, error, help, children })
  }

  return (
    <div className={`form-group mt-3 ${className}`}>
      {label && <label className="form-label d-flex align-content-center" htmlFor={entry}>
        <span className="mr-2">{label}</span>
        {help && <>
          <ReactToolTip html={true} place={'bottom'} id={id} />
          <span data-html={true} data-tip={help} data-for={id}>
            <HelpCircle style={{ color: 'gray', width: 17, marginLeft: '.5rem', cursor: 'help' }} />
          </span>
        </>}
      </label>}

      {children}
      {error && <div className={classes.invalid_feedback}>{error.message}</div>}
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

const defaultVal = (t, array, defaultValue) => {
  if (!!defaultValue) return defaultValue
  if (!!array) return []
  switch (t) {
    case type.bool: return false;
    case type.number: return 0;
    case type.object: return undefined; //todo: passur de moi
    case type.string: return "";
    default: return undefined;
  }
}
const getDefaultValues = (flow, schema) => {
  return flow.reduce((acc, key) => {
    if (typeof key === 'object') {
      return { ...acc, ...getDefaultValues(key.flow, schema) }
    }
    const entry = schema[key]
    if (!entry) { return acc }
    return { ...acc, [key]: defaultVal(entry.type, entry.array || entry.isMulti, entry.defaultValue) }
  }, {})
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

  const defaultValues = getDefaultValues(formFlow, schema);


  //FIXME: get real schema through the switch

  const resolver = (rawData) => {
    const { shape, dependencies } = getShapeAndDependencies(formFlow, schema, [], rawData);
    const resolver = yup.object().shape(shape, dependencies);

    return resolver;
  }

  const cleanInputArray = (obj, subSchema) => {
    return Object.entries(obj).reduce((acc, curr) => {
      const [key, v] = curr;

      if (Array.isArray(v)) {
        const isArray = option(subSchema)
          .orElse(schema)
          .map(s => s[key])
          .map(entry => !!entry.array && !entry.render)
          .getOrElse(false)
        if (isArray) {
          return { ...acc, [key]: v.map(value => ({ value })) }
        }
        return { ...acc, [key]: v }
      } else if (!!v && typeof v === 'object' && !(v instanceof (Date))) {
        return { ...acc, [key]: cleanInputArray(v, subSchema[key]?.schema || {}) }
      } else {
        return { ...acc, [key]: v }
      }
    }, {})
  }

  const cleanOutputArray = (obj, subSchema) => {
    return Object.entries(obj).reduce((acc, curr) => {

      const [key, v] = curr;

      if (Array.isArray(v)) {
        const isArray = option(subSchema)
          .orElse(schema)
          .map(s => s[key])
          .map(entry => !!entry.array && !entry.render)
          .getOrElse(false)
        if (isArray) {
          return { ...acc, [key]: v.map(({ value }) => value) }
        }
        return { ...acc, [key]: v }
      } else if (!!v && typeof v === 'object' && !(v instanceof (Date))) {
        return { ...acc, [key]: cleanOutputArray(v, subSchema[key]?.schema || {}) }
      } else {
        return { ...acc, [key]: v }
      }
    }, {})
  }

  const methods = useForm({
    resolver: (data, context, options) => yupResolver(resolver(data))(data, context, options),
    defaultValues: cleanInputArray(value || defaultValues, schema),
    shouldFocusError: !options.autosubmit,
  });

  const { register, handleSubmit, formState: { errors }, control, reset, watch, trigger, getValues, setValue } = methods


  useEffect(() => {
    if (value) {
      reset(cleanInputArray(value, schema))
    }
  }, [value, reset])

  useEffect(() => {
    reset(cleanInputArray(value || defaultValues, schema));
  }, [schema])

  const data = watch();
  const prevData = usePrevious(data)
  useEffect(() => {
    //todo: with debounce
    if (!!options.autosubmit && JSON.stringify(data) !== JSON.stringify(prevData)) {
      handleSubmit(data => {
        const clean = cleanOutputArray(data, schema)
        onSubmit(clean)
      }, onError)()
    }
  }, [data])

  if (options.watch) {
    if (typeof options.watch === 'function') {
      options.watch(watch())
    } else {
      console.group('react-form watch')
      console.log(watch())
      console.groupEnd()
    }
  }

  useImperativeHandle(ref, () => ({
    handleSubmit: () => handleSubmit(data => {
      const clean = cleanOutputArray(data, schema)
      onSubmit(clean)
    }, onError)()
  }));

  const functionalProperty = (entry, prop) => {
    if (typeof prop === 'function') {
      return prop({ rawValues: getValues(), value: getValues(entry) });
    } else {
      return prop;
    }
  }

  return (
    <FormProvider {...methods} >
      <form className={className || `${classes.pr_15} ${classes.full_width}`} onSubmit={handleSubmit(data => {
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
                  return option(step.visible.test).map(test => test(value)).getOrElse(value)
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
            <BasicWrapper key={`${entry}-${idx}`} entry={entry} error={error} label={functionalProperty(entry, step?.label === null ? null : step?.label || entry)} help={step?.help} render={inputWrapper}>
              <Step key={idx} entry={entry} step={step} error={error} errors={errors}
                register={register} schema={schema} control={control} trigger={trigger} getValues={getValues}
                setValue={setValue} watch={watch} inputWrapper={inputWrapper} httpClient={maybeCustomHttpClient} functionalProperty={functionalProperty} />
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

const Step = ({ entry, realEntry, step, error, errors, register, schema, control, trigger, getValues, setValue, watch, inputWrapper, httpClient, defaultValue, index, functionalProperty }) => {
  const classes = useCustomStyle();

  if (entry && typeof entry === 'object') {
    const errored = entry.flow.some(step => !!errors[step])
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
                  return option(visible.test).map(test => test(value)).getOrElse(value)
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
            <BasicWrapper key={`collapse-${en}-${entryIdx}`} entry={en} error={err} label={functionalProperty(en, stp?.label === null ? null : stp?.label || en)} help={stp?.help} render={inputWrapper}>
              <Step entry={en} step={stp} error={err} errors={errors}
                register={register} schema={schema} control={control} trigger={trigger} getValues={getValues}
                setValue={setValue} watch={watch} inputWrapper={inputWrapper} httpClient={httpClient}
                defaultValue={stp?.defaultValue} functionalProperty={functionalProperty} />
            </BasicWrapper>
          )
        })}
      </Collapse>
    )
  }

  if (step.array) {
    return (
      <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v) }} error={error}>
        <ArrayStep
          entry={entry} step={step} trigger={trigger}
          register={register} control={control} error={error}
          setValue={setValue} values={getValues(entry)} defaultValue={step.defaultValue || defaultVal(step.type)}
          getValues={getValues} disabled={functionalProperty(entry, step.disabled)}
          component={((props, idx) => {
            return (
              <Step entry={`${entry}[${idx}].value`} step={{ ...(schema[realEntry || entry]), render: step.itemRender, onChange: undefined, array: false }} error={error && error[idx]?.value}
                register={register} schema={schema} control={control} trigger={trigger} getValues={getValues}
                setValue={setValue} watch={watch} inputWrapper={inputWrapper} httpClient={httpClient}
                defaultValue={props.defaultValue} value={props.value} index={idx} functionalProperty={functionalProperty} />
            )
          })} />
      </CustomizableInput>

    )
  }

  const registeredInput = register(entry);
  const inputProps = {
    ...registeredInput,
    onChange: (e) => {
      registeredInput.onChange(e);
      option(step.onChange)
        .map(onChange => onChange({ rawValues: getValues(), value: e.target.value, setValue }))
    }
  }

  switch (step.type) {
    case type.string:
      switch (step.format) {
        case format.text:
          return (
            <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v) }} error={error}>
              <textarea
                type="text" id={entry}
                className={classNames(classes.input, { [classes.input__invalid]: error })}
                readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
                {...step.props}
                defaultValue={defaultValue}
                placeholder={step.placeholder}
                {...inputProps} />
            </CustomizableInput>
          );
        case format.code: return (
          <Controller
            name={entry}
            control={control}
            render={({ field }) => {
              return (
                <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                  <CodeInput
                    className={classNames({ [classes.input__invalid]: error })}
                    readOnly={functionalProperty(entry, step.disabled) ? true : false}
                    onChange={(e) => {
                      field.onChange(e)
                      option(step.onChange)
                        .map(onChange => onChange({ rawValues: getValues(), value: e, setValue }))
                    }}
                    value={field.value}
                    defaultValue={defaultValue}
                    {...step.props}
                  />
                </CustomizableInput>
              )
            }}
          />
        )
        case format.markdown: return (
          <Controller
            name={entry}
            control={control}
            render={({ field }) => {
              return (
                <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                  <MarkdownInput
                    {...step.props}
                    className={classNames({ [classes.input__invalid]: error })}
                    readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
                    onChange={(e) => {
                      field.onChange(e)
                      option(step.onChange)
                        .map(onChange => onChange({ rawValues: getValues(), value: e, setValue }))
                    }}
                    value={field.value}
                    defaultValue={defaultValue}
                    {...step}
                  />
                </CustomizableInput>
              )
            }}
          />
        )
        case format.buttonsSelect:
        case format.select:
          return (
            <Controller
              name={entry}
              control={control}
              render={({ field }) => {
                return (
                  <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                    <SelectInput
                      {...step.props}
                      {...step}
                      className={classNames({ [classes.input__invalid]: error })}
                      disabled={functionalProperty(entry, step.disabled)}
                      value={field.value}
                      possibleValues={step.options}
                      defaultValue={defaultValue}
                      httpClient={httpClient}
                      onChange={(value) => {
                        field.onChange(value)
                        option(step.onChange)
                          .map(onChange => onChange({ rawValues: getValues(), value, setValue }))
                      }}
                    />
                  </CustomizableInput>
                )
              }}
            />
          )
        default:
          return (
            <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }} error={error}>
              <input
                type={step.format || 'text'} id={entry}
                className={classNames(classes.input, { [classes.input__invalid]: error })}
                readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
                defaultValue={defaultValue}
                placeholder={step.placeholder}
                {...inputProps} />
            </CustomizableInput>
          );
      }

    case type.number:
      switch (step.format) {
        case format.buttonsSelect:
        case format.select:
          return (
            <Controller
              name={entry}
              control={control}
              render={({ field }) => {
                return (
                  <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                    <SelectInput
                      {...step.props}
                      {...step}
                      className={classNames(classes.content, { [classes.input__invalid]: error })}
                      readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
                      onChange={(e) => {
                        field.onChange(e)
                        option(step.onChange)
                          .map(onChange => onChange({ rawValues: getValues(), value: e, setValue }))
                      }}
                      value={field.value}
                      possibleValues={step.options}
                      defaultValue={defaultValue}
                      httpClient={httpClient}
                    />
                  </CustomizableInput>
                )
              }}
            />
          )
        default:
          return (
            <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v) }} error={error}>
              <input
                {...step.props}
                type={step.format || 'number'} id={entry}
                className={classNames(classes.input, { [classes.input__invalid]: error })}
                readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
                name={entry}
                placeholder={step.placeholder}
                defaultValue={defaultValue}
                {...inputProps} />
            </CustomizableInput>
          );
      }

    case type.bool:
      return (
        <Controller
          name={entry}
          control={control}
          render={({ field }) => {
            return (
              <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                <BooleanInput
                  {...step.props}
                  className={classNames({ [classes.input__invalid]: error })}
                  readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
                  onChange={(e) => {
                    field.onChange(e)
                    option(step.onChange)
                      .map(onChange => onChange({ rawValues: getValues(), value: e, setValue }))
                  }}
                  value={field.value}
                />
              </CustomizableInput>
            )
          }}
        />
      )

    case type.object:
      switch (step.format) {
        case format.buttonsSelect:
        case format.select:
          return (
            <Controller
              name={entry}
              control={control}
              defaultValue={step.defaultValue}
              render={({ field }) => {
                return (
                  <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                    <SelectInput
                      {...step.props}
                      {...step}
                      className={classNames({ [classes.input__invalid]: error })}
                      readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
                      onChange={(e) => {
                        field.onChange(e)
                        option(step.onChange)
                          .map(onChange => onChange({ rawValues: getValues(), value: e, setValue }))
                      }}
                      value={field.value}
                      possibleValues={step.options}
                      httpClient={httpClient}
                    />
                  </CustomizableInput>
                )
              }}
            />
          )
        case format.form: //todo: disabled ?
          const flow = option(step.flow).getOrElse(option(step.schema).map(s => Object.keys(s)).getOrNull());
          return (
            <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }} error={error}>
              <NestedForm
                schema={step.schema} flow={flow} step={step} parent={entry}
                inputWrapper={inputWrapper} maybeCustomHttpClient={httpClient} value={getValues(entry) || defaultValue} error={error}
                index={index} functionalProperty={functionalProperty} />
            </CustomizableInput>
          )

        default:
          return (
            <Controller
              name={entry}
              control={control}
              defaultValue={step.defaultValue}
              render={({ field }) => {
                return (
                  <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                    <ObjectInput
                      {...step.props}
                      {...step}
                      className={classNames({ [classes.input__invalid]: error })}
                      readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
                      onChange={(e) => {
                        field.onChange(e)
                        option(step.onChange)
                          .map(onChange => onChange({ rawValues: getValues(), value: e, setValue }))
                      }}
                      value={field.value}
                      possibleValues={step.options}
                    />
                  </CustomizableInput>
                )
              }}
            />
          )
      }
    case type.date:
      return (
        <Controller
          name={entry}
          control={control}
          defaultValue={step.defaultValue}
          render={({ field }) => {
            return (
              <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                <DatePicker
                  {...step.props}
                  id="datePicker-1"
                  className={classNames({ [classes.input__invalid]: error })}
                  readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e)
                    option(step.onChange)
                      .map(onChange => onChange({ rawValues: getValues(), value: e, setValue }))
                  }}
                  formatStyle="large"
                />
              </CustomizableInput>
            )
          }}
        />
      )
    case type.file:
      if (step.format === format.hidden) {
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
                  onChange(files)
                  setUploading(false);
                };

                const trigger = () => {
                  input.click();
                };

                return (
                  <div className={classNames("d-flex flex-row justify-content-start", { [classes.input__invalid]: error })}>
                    <input
                      ref={(r) => setInput(r)}
                      type="file"
                      multiple
                      className={classes.d_none}
                      onChange={setFiles}
                    />
                    <button
                      type="button"
                      className={`${classes.btn} ${classes.flex} ${classes.ai_center}`}
                      disabled={uploading || functionalProperty(entry, step.disabled)}
                      onClick={trigger}>
                      {uploading && <Loader />}
                      {!uploading && <Upload />}
                      <span className={`${classes.ml_5}`}>Select file</span>
                    </button>
                  </div>
                );
              };

              return (
                <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                  <FileInput
                    onChange={(e) => {
                      field.onChange(e)
                      option(step.onChange)
                        .map(onChange => onChange({ rawValues: getValues(), value: e, setValue }))
                    }}
                    error={error} />
                </CustomizableInput>
              )
            }}
          />
        )
      }
      return (
        <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }} error={error}>
          <input
            {...step.props}
            type='file' id={entry}
            className={classNames(classes.input, { [classes.input__invalid]: error })}
            readOnly={functionalProperty(entry, step.disabled) ? 'readOnly' : null}
            name={entry}
            placeholder={step.placeholder}
            {...inputProps} />
        </CustomizableInput>
      );
    default:
      return null;
  }

}


const ArrayStep = ({ entry, step, control, trigger, register, error, component, values, defaultValue, setValue, getValues, disabled }) => {
  const classes = useCustomStyle()
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
            <div key={field.id} className="d-flex flex-row">
              <div className="flex-grow-1">
                {component({ key: field.id, ...field, defaultValue: values[idx] || defaultValue }, idx)}
              </div>
              <div className="input-group-append">
                <button className="btn btn-danger btn-sm" disabled={disabled} onClick={() => {
                  remove(idx)
                  trigger(entry);
                }}>remove</button>
              </div>
            </div>
          )
        })}
      <div>
        <input type="button" className={classNames("btn btn-info mt-2", { [classes.input__invalid]: error })} onClick={() => {
          append({ value: step.addableDefaultValue || defaultVal(step.type) })
          trigger(entry);
          option(step.onChange)
            .map(onChange => onChange({ rawValues: getValues(), value: getValues(entry), setValue }))
        }} disabled={disabled} value="Add" />
        {error && <div className="invalid-feedback">{error.message}</div>}
      </div>
    </>
  )
}

const NestedForm = ({ schema, flow, parent, inputWrapper, maybeCustomHttpClient, index, error, value, step, functionalProperty }) => {
  const { register, control, getValues, setValue, trigger, watch } = useFormContext(); // retrieve all hook methods
  const [collapsed, setCollapsed] = useState(!!step.collapsed);

  const classes = useCustomStyle();

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
    if (!!prevSchema && JSON.stringify(prevSchema) !== JSON.stringify(schemaAndFlow.schema)) {
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
            return option(visible.test).map(test => test(value)).getOrElse(value)
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
    <div className={classNames({ [classes.nestedform__border]: bordered, [classes.border__error]: !!error })}>
      {!!step.collapsable && schemaAndFlow.flow.length > 1 && collapsed && <ArrowDown size={30} className={classes.cursor_pointer} style={{ position: 'absolute', top: '5px', left: '-16px' }} strokeWidth="3" onClick={() => setCollapsed(!collapsed)} />}
      {!!step.collapsable && schemaAndFlow.flow.length > 1 && !collapsed && <ArrowUp size={30} className={classes.cursor_pointer} style={{ position: 'absolute', top: '5px', left: '-16px' }} strokeWidth="3" onClick={() => setCollapsed(!collapsed)} />}

      {computedSandF.map(({ step, visibleStep, entry }, idx) => {

        if (!step && typeof entry === 'string') {
          console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
          return null;
        }

        const realError = error && error[entry]

        return (
          <BasicWrapper key={`${entry}.${idx}`} className={classNames({ [classes.display__none]: (collapsed && !step.visibleOnCollapse) || !visibleStep })} entry={`${parent}.${entry}`} error={realError}
            label={functionalProperty(entry, step?.label === null ? null : step?.label || entry)} help={step.help} render={inputWrapper}>
            <Step key={`step.${entry}.${idx}`} entry={`${parent}.${entry}`} realEntry={entry} step={schemaAndFlow.schema[entry]} error={realError}
              register={register} schema={schemaAndFlow.schema} control={control} trigger={trigger} getValues={getValues}
              setValue={setValue} watch={watch} inputWrapper={inputWrapper} httpClient={maybeCustomHttpClient}
              defaultValue={value && value[entry]} functionalProperty={functionalProperty}
            />
          </BasicWrapper>
        )
      })}
    </div>
  )
}
