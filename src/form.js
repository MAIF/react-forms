import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'classnames';
import React, { useEffect, useState, useRef } from 'react'
import { HelpCircle, Loader, Upload } from 'react-feather';
import { useForm, useFormContext, Controller, useFieldArray, FormProvider } from 'react-hook-form';
import { DatePicker } from 'react-rainbow-components';
import ReactToolTip from 'react-tooltip';
import { v4 as uuid } from 'uuid';
import * as yup from "yup";

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
    ref.current = value;
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current;
}


const BasicWrapper = ({ entry, label, error, help, children, render }) => {
  const id = uuid();

  if (render) {
    return render({ entry, label, error, help, children })
  }

  return (
    <div className="form-group mt-3">
      <label className="form-label d-flex align-content-center" htmlFor={entry}>
        <span className="mr-2">{label}</span>
        {help && <>
          <ReactToolTip html={true} place={'bottom'} id={id} />
          <span data-html={true} data-tip={help} data-for={id}>
            <HelpCircle style={{ color: 'gray', width: 17, marginLeft: '.5rem', cursor: 'help' }} />
          </span>
        </>}
      </label>

      {children}
      {error && <div className="invalid-feedback">{error.message}</div>}
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
  if (!!array) return []
  if (!!defaultValue) return defaultValue
  switch (t) {
    case type.bool: return false;
    case type.number: return 0;
    case type.object: return {};
    case type.string: return "";
    default: return undefined;
  }
}
const getDefaultValues = (flow, schema) => {
  return flow.reduce((acc, key) => {
    const entry = schema[key]
    if (typeof key === 'object') {
      return { ...acc, ...getDefaultValues(key.flow, schema) }
    }
    return { ...acc, [key]: defaultVal(entry.type, entry.array, entry.defaultValue) }
  }, {})
}

export const Form = ({ schema, flow, value, inputWrapper, onSubmit, footer, style, className, options = {} }) => {
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

  const cleanInputArray = (obj) => {
    return Object.entries(obj).reduce((acc, curr) => {
      const [key, v] = curr;

      if (Array.isArray(v)) {
        return {...acc, [key]: v.map(value => ({value}))}
      } else if (typeof v === 'object') {
        return {...acc, [key]: cleanInputArray(v)}
      } else {
        return {...acc, [key]: v}
      }
    }, {})
  }

  const cleanOutputArray = (obj) => {
    return Object.entries(obj).reduce((acc, curr) => {

      const [key, v] = curr;
      
      if (Array.isArray(v)) {
        return { ...acc, [key]: v.map(({value}) => value ) }
      } else if (typeof v === 'object') {
        return { ...acc, [key]: cleanOutputArray(v) }
      } else {
        return { ...acc, [key]: v }
      }
    }, {})
  }

  const methods = useForm({
    resolver: (data, context, options) => yupResolver(resolver(data))(data, context, options),
    defaultValues: cleanInputArray(value || defaultValues)
  });

  const { register, handleSubmit, formState: { errors }, control, reset, watch, trigger, getValues, setValue } = methods

  useEffect(() => {
    if (value) {
      reset(cleanInputArray(value))
    }
  }, [value, reset])

  useEffect(() => {
    reset(cleanInputArray(value || defaultValues));
  }, [schema])

  const data = watch();
  useEffect(() => {
    //todo: with debounce
    if (!!options.autosubmit) {
      handleSubmit(data => onSubmit(cleanOutputArray(data)))
    }
  }, [data])

  if (options.watch) {
    console.log(watch())
  }

  return (
    <FormProvider {...methods} >
      <form className={className || "col-12 section pt-2 pr-2"} style={style} onSubmit={handleSubmit(data => {
        const clean = cleanOutputArray(data)
        return onSubmit(clean)})}>
        {formFlow.map((entry, idx) => {
          if (entry && typeof entry === 'object') {
            const errored = entry.flow.some(step => !!errors[step])
            return (
              <Collapse key={idx} label={entry.label} collapsed={entry.collapsed} errored={errored}>
                {entry.flow.map((entry, idx) => {
                  const step = schema[entry]
                  return (
                    <BasicWrapper key={idx} entry={entry} error={error} label={step.label || entry} help={step.help} render={inputWrapper}>
                      <Step entry={entry} step={schema[entry]} error={error}
                        register={register} schema={schema} control={control} trigger={trigger} getValues={getValues}
                        setValue={setValue} watch={watch} inputWrapper={inputWrapper} />
                    </BasicWrapper>
                  )
                })}
              </Collapse>
            )
          }

          const step = schema[entry]
          const error = entry.split('.').reduce((object, key) => {
            return object && object[key];
          }, errors);
          return (
            <BasicWrapper key={idx} entry={entry} error={error} label={step.label || entry} help={step.help} render={inputWrapper}>
              <Step key={idx} entry={entry} step={step} error={error}
                register={register} schema={schema} control={control} trigger={trigger} getValues={getValues}
                setValue={setValue} watch={watch} inputWrapper={inputWrapper} httpClient={maybeCustomHttpClient} />
            </BasicWrapper>
          )
        })}
        <Footer render={footer} reset={() => reset(defaultValues)} valid={handleSubmit(data => onSubmit(cleanOutputArray(data)))} actions={options.actions} />
      </form>
    </FormProvider>
  )
}

const Footer = (props) => {
  if (props.render) {
    return props.render({ reset: props.reset, valid: props.valid })
  }

  const isSubmitDisplayed = props.actions?.submit?.display === undefined ? true : !!props.actions?.submit?.display

  return (
    <div className="d-flex flex-row justify-content-end mt-2">
      {props.actions?.reset?.display && <button className="btn btn-danger" type="button" onClick={props.reset}>{props.actions?.reset?.label || 'Reset'}</button>}
      {isSubmitDisplayed && <button className="btn btn-success ml-1" type="submit">{props.actions?.submit?.label || 'Save'}</button>}
    </div>
  )
}

const Step = ({ entry, step, error, register, schema, control, trigger, getValues, setValue, watch, inputWrapper, httpClient, defaultValue, index }) => {
  if (step.array) {
    return (
      <ArrayStep
        entry={entry} step={step} trigger={trigger}
        register={register} control={control} error={error}
        setValue={setValue} values={getValues(entry)} defaultValue={step.defaultValue || defaultVal(step.type)}
        component={((props, idx) => {
          return (
            <Step entry={`${entry}[${idx}].value`} step={{ ...schema[entry], array: false }} error={error && error[idx]?.value}
              register={register} schema={schema} control={control} trigger={trigger} getValues={getValues}
              setValue={setValue} watch={watch} inputWrapper={inputWrapper} httpClient={httpClient}
              defaultValue={props.defaultValue} value={props.defaultValue} index={idx} />
          )
        })} />
    )
  }

  const visibleStep = step && option(step.visible)
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

  switch (step.type) {
    case type.string:
      switch (step.format) {
        case format.text:
          return (
            <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v) }} error={error}>
              <textarea
                type="text" id={entry}
                className={classNames("form-control", { 'is-invalid': error })}
                readOnly={step.disabled ? 'readOnly' : null}
                {...step.props}
                name={entry}
                defaultValue={defaultValue}
                placeholder={step.placeholder}
                {...register(entry)} />
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
                    {...step.props}
                    className={classNames({ 'is-invalid': error })}
                    readOnly={step.disabled ? 'readOnly' : null}
                    onChange={field.onChange}
                    value={field.value}
                    defaultValue={defaultValue}
                    {...step}
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
                    className={classNames({ 'is-invalid': error })}
                    readOnly={step.disabled ? 'readOnly' : null}
                    onChange={field.onChange}
                    value={field.value}
                    defaultValue={defaultValue}
                    {...step}
                  />
                </CustomizableInput>
              )
            }}
          />
        )
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
                      className={classNames({ 'is-invalid': error })}
                      readOnly={step.disabled ? 'readOnly' : null}
                      onChange={field.onChange}
                      value={field.value}
                      possibleValues={step.options}
                      defaultValue={defaultValue}
                      httpClient={httpClient}
                      {...step}
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
                // {...step.props}
                type={step.format || 'text'} id={entry}
                className={classNames("form-control", { 'is-invalid': error })}
                readOnly={step.disabled ? 'readOnly' : null}
                // defaultValue={defaultValue}
                placeholder={step.placeholder}
                {...register(entry)} />
            </CustomizableInput>
          );
      }

    case type.number:
      switch (step.format) {
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
                      className={classNames({ 'is-invalid': error })}
                      readOnly={step.disabled ? 'readOnly' : null}
                      onChange={field.onChange}
                      value={field.value}
                      possibleValues={step.options}
                      defaultValue={defaultValue}
                      httpClient={httpClient}
                      {...step}
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
                className={classNames("form-control", { 'is-invalid': error })}
                readOnly={step.disabled ? 'readOnly' : null}
                name={entry}
                placeholder={step.placeholder}
                defaultValue={defaultValue}
                {...register(entry)} />
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
                  className={classNames({ 'is-invalid': error })}
                  readOnly={step.disabled ? 'readOnly' : null}
                  onChange={field.onChange}
                  value={field.value}
                />
              </CustomizableInput>
            )
          }}
        />
      )

    case type.object:
      switch (step.format) {
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
                      className={classNames({ 'is-invalid': error })}
                      readOnly={step.disabled ? 'readOnly' : null}
                      onChange={field.onChange}
                      value={field.value}
                      possibleValues={step.options}
                      httpClient={httpClient}
                      {...step}
                    />
                  </CustomizableInput>
                )
              }}
            />
          )
        case format.form:
          const flow = option(step.flow).getOrElse(option(step.schema).map(s => Object.keys(s)).getOrNull());
          return (
            <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }} error={error}>
              <NestedForm
                schema={step.schema} flow={flow} step={step} parent={entry}
                inputWrapper={inputWrapper} maybeCustomHttpClient={httpClient} value={defaultValue} error={error}
                index={index} />
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
                      className={classNames({ 'is-invalid': error })}
                      readOnly={step.disabled ? 'readOnly' : null}
                      onChange={field.onChange}
                      value={field.value}
                      possibleValues={step.options}
                      {...step}
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
                  className={classNames({ 'is-invalid': error })}
                  readOnly={step.disabled ? 'readOnly' : null}
                  value={field.value}
                  onChange={field.onChange}
                  formatStyle="large"
                // locale={state.locale.name}
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
                  <div className={classNames("d-flex flex-row justify-content-start", { 'is-invalid': error })}>
                    <input
                      ref={(r) => setInput(r)}
                      type="file"
                      multiple
                      className="form-control d-none"
                      onChange={setFiles}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-success pl"
                      disabled={uploading}
                      onClick={trigger}>
                      {uploading && <Loader />}
                      {!uploading && <Upload />}
                      Select file
                    </button>
                  </div>
                );
              };

              return (
                <CustomizableInput render={step.render} field={{ setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }} error={error}>
                  <FileInput onChange={field.onChange} error={error} />
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
            className={classNames("form-control", { 'is-invalid': error })}
            readOnly={step.disabled ? 'readOnly' : null}
            name={entry}
            placeholder={step.placeholder}
            {...register(entry)} />
        </CustomizableInput>
      );
    default:
      return null;
  }

}


const ArrayStep = ({ entry, step, control, trigger, register, error, component, values, defaultValue, setValue }) => {
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
              {component({ key: field.id, ...field, defaultValue: values[idx] || defaultValue }, idx)}
              <div className="input-group-append">
                <button className="btn btn-danger btn-sm" onClick={() => {
                  remove(idx)
                  trigger(entry);
                }}>remove</button>
              </div>
            </div>
          )
        })}
      <div>
        <input type="button" className={classNames("btn btn-info mt-2", { 'is-invalid': error })} onClick={() => {
          append({value: defaultValue})
          trigger(entry);
        }} value="Add" />
        {error && <div className="invalid-feedback">{error.message}</div>}
      </div>
    </>
  )
}

const NestedForm = ({ schema, flow, parent, inputWrapper, maybeCustomHttpClient, index, error, value, step }) => {
  const { register, control, getValues, setValue, trigger, watch } = useFormContext(); // retrieve all hook methods

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
    if (JSON.stringify(prevSchema) !== JSON.stringify(schemaAndFlow.schema)) {
      const def = getDefaultValues(schemaAndFlow.flow, schemaAndFlow.schema);
      setValue(parent, def, { shouldValidate: false })
    }
  }, [prevSchema, schemaAndFlow.schema])

  return (
    <div style={{ borderLeft: '2px solid lightGray', paddingLeft: '.5rem', marginBottom: '.5rem' }}>
      {schemaAndFlow.flow.map((entry, idx) => {
        const step = schemaAndFlow.schema[entry]
        const realError = error && error[entry]

        return (
          <BasicWrapper key={`${entry}.${idx}`} entry={`${parent}.${entry}`} error={realError} label={step.label || entry} help={step.help} render={inputWrapper}>
            <Step key={`step.${entry}.${idx}`} entry={`${parent}.${entry}`} step={schemaAndFlow.schema[entry]} error={realError}
              register={register} schema={schemaAndFlow.schema} control={control} trigger={trigger} getValues={getValues}
              setValue={setValue} watch={watch} inputWrapper={inputWrapper} httpClient={maybeCustomHttpClient}
              defaultValue={value && value[entry]}
            />
          </BasicWrapper>
        )
      })}
    </div>
  )
}
