import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react'
import { HelpCircle, Loader, Upload } from 'react-feather';
import { useForm, useFormContext, Controller, useFieldArray, FormProvider } from 'react-hook-form';
import { DatePicker } from 'react-rainbow-components';
import ReactToolTip from 'react-tooltip';
import { v4 as uuid } from 'uuid';
import * as yup from "yup";
import { createUseStyles, useTheme } from 'react-jss'

import { types } from './types';
import { BooleanInput, Collapse, SelectInput, ObjectInput, CodeInput, MarkdownInput } from './inputs/index';
import { getShapeAndDependencies } from './resolvers/index';
import { option } from './Option'


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

const defaultVal = (type, array, defaultValue) => {
  if (!!array) return []
  if (!!defaultValue) return defaultValue
  switch (type) {
    case types.bool: return false;
    case types.number: return 0;
    case types.object: return {};
    case types.string: return "";
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

export const Form = ({ schema, flow, value, inputWrapper, onChange, footer, httpClient, autosave }) => {
  const useStyles = createUseStyles({
    myButton: {
      color: 'white',
      backgroundColor: "forestgreen",
      margin: {
        // jss-expand gives more readable syntax
        top: 5, // jss-default-unit makes this 5px
        right: 0,
        bottom: 0,
        left: '1rem'
      },
      '& span': {
        // jss-nested applies this to a child span
        fontWeight: 'bold' // jss-camel-case turns this into 'font-weight'
      }
    },
    myLabel: {
      fontStyle: 'italic'
    }
  });

  const classes = useStyles();

  const formFlow = flow || Object.keys(schema)

  const maybeCustomHttpClient = (url, method) => {
    //todo: if present props.resolve()
    if (httpClient) {
      return httpClient(url, method)
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

    console.log({ rawData, shape, resolver })

    return resolver;
  }

  const methods = useForm({
    resolver: (data, context, options) => yupResolver(resolver(data))(data, context, options),
    defaultValues: value || defaultValues
  });

  const { register, handleSubmit, formState: { errors }, control, reset, watch, trigger, getValues, setValue } = methods

  useEffect(() => {
    if (formFlow && value) {
      reset(value)
    }
  }, [value, formFlow, reset])

  const data = watch();
  useEffect(() => {
    //todo: with debounce
    if (!!autosave) {
      handleSubmit(onChange)
    }
  }, [data])

  // console.log(watch())

  // console.log({errors})

  return (
      <FormProvider {...methods} >
        <form className="col-12 section pt-2 pr-2" onSubmit={handleSubmit(onChange)}>
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
          <Footer classes={classes} render={footer} reset={() => reset(defaultValues)} valid={handleSubmit(onChange)} />
        </form>
      </FormProvider>
  )
}

const Footer = (props) => {
  if (props.render) {
    return props.render({ reset: props.reset, valid: props.valid })
  }
  return (
    <div className="d-flex flex-row justify-content-end">
      <button className="btn btn-danger" type="button" onClick={props.reset}>Reset</button>
      <button className={props.classes.myButton} type="submit">Save</button>
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
          <div>{idx}</div>
          return (
            <Step entry={`${entry}[${idx}]`} step={{ ...schema[entry], array: false }} error={error}
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
    case types.string:
      switch (step.format) {
        case 'text':
          return (
            <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v) }} error={error}>
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
        case 'code': return (
          <Controller
            name={entry}
            control={control}
            render={({ field }) => {
              return (
                <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={error}>
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
        case 'markdown': return (
          <Controller
            name={entry}
            control={control}
            render={({ field }) => {
              return (
                <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={error}>
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
        case 'select':
          return (
            <Controller
              name={entry}
              control={control}
              render={({ field }) => {
                return (
                  <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={error}>
                    <SelectInput
                      {...step.props}
                      className={classNames({ 'is-invalid': error })}
                      readOnly={step.disabled ? 'readOnly' : null}
                      onChange={field.onChange}
                      value={field.value}
                      possibleValues={step.options}
                      defaultValue={defaultValue}
                      {...step}
                    />
                  </CustomizableInput>
                )
              }}
            />
          )
        default:
          return (
            <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }} error={error}>
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

    case types.number:
      switch (step.format) {
        default:
          return (
            <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v) }} error={error}>
              <input
                {...step.props}
                type="number" id={entry}
                className={classNames("form-control", { 'is-invalid': error })}
                readOnly={step.disabled ? 'readOnly' : null}
                name={entry}
                placeholder={step.placeholder}
                defaultValue={defaultValue}
                {...register(entry)} />
            </CustomizableInput>
          );
      }

    case types.bool:
      return (
        <Controller
          name={entry}
          control={control}
          render={({ field }) => {
            return (
              <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={error}>
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

    case types.object:
      switch (step.format) {
        case 'select':
          return (
            <Controller
              name={entry}
              control={control}
              defaultValue={step.defaultValue}
              render={({ field }) => {
                return (
                  <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={error}>
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
        case 'form':
          const flow = option(step.flow).getOrElse(option(step.schema).map(s => Object.keys(s)).getOrNull());
          return (
            <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }} error={error}>
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
                  <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={error}>
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
    case types.date:
      return (
        <Controller
          name={entry}
          control={control}
          defaultValue={step.defaultValue}
          render={({ field }) => {
            return (
              <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={error}>
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
    case types.file:
      if (step.format === 'hidden') {
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
                <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={error}>
                  <FileInput onChange={field.onChange} error={error} />
                </CustomizableInput>
              )
            }}
          />
        )
      }
      return (
        <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }} error={error}>
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
          append(defaultValue)
          trigger(entry);
        }} value="Add" />
        {error && <div className="invalid-feedback">{error.message}</div>}
      </div>
    </>
  )
}

const NestedForm = ({ schema, flow, parent, inputWrapper, maybeCustomHttpClient, index, error, value, step }) => {
  const { register, control, getValues, setValue, trigger, watch } = useFormContext(); // retrieve all hook methods

  const schemaAndfFlow = option(step.conditionalSchema)
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


  return (
    <div style={{ borderLeft: '2px solid lightGray', paddingLeft: '.5rem', marginBottom: '.5rem' }}>
      {schemaAndfFlow.flow.map((entry, idx) => {
        const step = schemaAndfFlow.schema[entry]
        const realError = index !== undefined ? error && error[index] && error[index][entry] : error && error[entry]

        return (
          <BasicWrapper key={`${entry}.${idx}`} entry={`${parent}.${entry}`} error={realError} label={step.label || entry} help={step.help} render={inputWrapper}>
            <Step key={`step.${entry}.${idx}`} entry={`${parent}.${entry}`} step={schemaAndfFlow.schema[entry]} error={realError}
              register={register} schema={schemaAndfFlow.schema} control={control} trigger={trigger} getValues={getValues}
              setValue={setValue} watch={watch} inputWrapper={inputWrapper} httpClient={maybeCustomHttpClient}
              defaultValue={value && value[entry]}
            />
          </BasicWrapper>
        )
      })}
    </div>
  )
}
