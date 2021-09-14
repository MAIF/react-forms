import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react'
import { HelpCircle, Loader, Upload } from 'react-feather';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { DatePicker } from 'react-rainbow-components';
import ReactToolTip from 'react-tooltip';
import { v4 as uuid } from 'uuid';
import * as yup from "yup";

import { Types } from './types';
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

const getDefaultValues = (flow, schema) => {

  return flow.reduce((acc, key) => {
    const entry = schema[key]
    if (typeof key === 'object') {
      return { ...acc, ...getDefaultValues(key.flow, schema) }
    }
    if (typeof entry.defaultValue !== 'undefined' && entry.defaultValue !== null) {
      return { ...acc, [key]: entry.defaultValue }
    }
    let defaultValue = undefined;
    if (entry.type === Types.object) { defaultValue = {} }
    if (entry.format === 'array' || entry.isMulti) { defaultValue = [] }
    return { ...acc, [key]: defaultValue }
  }, {})
}

export const Form = ({ schema, flow, value, inputWrapper, onChange, footer, httpClient }) => {

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

  const defaultValues = getDefaultValues(flow, schema);

  const { shape, dependencies } = getShapeAndDependencies(flow, schema);
  const resolver = yup.object().shape(shape, dependencies);

  const { register, handleSubmit, formState: { errors }, control, reset, watch, trigger, getValues, setValue } = useForm({
    resolver: yupResolver(resolver),
    defaultValues: value || defaultValues
  });

  useEffect(() => {
    if (flow && value) {
      reset(value)
    }
  }, [value, flow, reset])

  // console.debug(watch())

  return (
    <form className="col-12 section pt-2 pr-2" onSubmit={handleSubmit(onChange)}>
      {flow.map((entry, idx) => <Step key={idx} entry={entry} step={schema[entry]} errors={errors}
        register={register} schema={schema} control={control} trigger={trigger} getValues={getValues}
        setValue={setValue} watch={watch} inputWrapper={inputWrapper} httpClient={maybeCustomHttpClient} />)}
      <Footer render={footer} reset={() => reset(defaultValues)} valid={handleSubmit(onChange)} />
    </form>
  )
}

const Footer = (props) => {
  if (props.render) {
    return props.render({ reset: props.reset, valid: props.valid })
  }
  return (
    <div className="d-flex flex-row justify-content-end">
      <button className="btn btn-danger" type="button" onClick={props.reset}>Annuler</button>
      <button className="btn btn-success ml-1" type="submit">Sauvegarder</button>
    </div>
  )
}

const Step = ({ entry, step, errors, register, schema, control, trigger, getValues, setValue, watch, inputWrapper, httpClient }) => {

  if (entry && typeof entry === 'object') {
    const errored = entry.flow.some(step => !!errors[step])
    return (
      <Collapse label={entry.label} collapsed={entry.collapsed} errored={errored}>
        {entry.flow.map((entry, idx) => <Step key={idx} entry={entry} step={schema[entry]} errors={errors}
          register={register} schema={schema} control={control} trigger={trigger} getValues={getValues}
          setValue={setValue} watch={watch} inputWrapper={inputWrapper} />)}
      </Collapse>
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
    case Types.string:
      switch (step.format) {
        case 'text':
          return (
            <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
              <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v) }} error={errors[entry]}>
                <textarea
                  type="text" id={entry}
                  className={classNames("form-control", { 'is-invalid': errors[entry] })}
                  readOnly={step.disabled ? 'readOnly' : null}
                  {...step.props}
                  name={entry}
                  placeholder={step.placeholder}
                  {...register(entry)} />
              </CustomizableInput>
            </BasicWrapper>
          );
        case 'code': return (
          <Controller
            name={entry}
            control={control}
            render={({ field }) => {
              return (
                <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
                  <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={errors[entry]}>
                    <CodeInput
                      {...step.props}
                      className={classNames({ 'is-invalid': errors[entry] })}
                      readOnly={step.disabled ? 'readOnly' : null}
                      onChange={field.onChange}
                      value={field.value}
                      {...step}
                    />
                  </CustomizableInput>
                </BasicWrapper>
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
                <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
                  <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={errors[entry]}>
                    <MarkdownInput
                      {...step.props}
                      className={classNames({ 'is-invalid': errors[entry] })}
                      readOnly={step.disabled ? 'readOnly' : null}
                      onChange={field.onChange}
                      value={field.value}
                      {...step}
                    />
                  </CustomizableInput>
                </BasicWrapper>
              )
            }}
          />
        )
        case 'array':
          return (
            <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
              <ArrayStep
                entry={entry} step={step} trigger={trigger}
                register={register} control={control} errors={errors}
                setValue={setValue} values={getValues(entry)}
                component={((props, idx) => {
                  return (
                    <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(`${entry}.${idx}`), onChange: v => setValue(`${entry}.${idx}`, v, { shouldValidate: true }) }} error={errors[entry] && errors[entry][idx]}>
                      <>
                        <input
                          {...step.props}
                          type="text"
                          readOnly={step.disabled ? 'readOnly' : null}
                          className={classNames("form-control", { 'is-invalid': errors[entry] && errors[entry][idx] })}
                          placeholder={step.placeholder} {...props} />
                        {errors[entry] && errors[entry][idx] && <div className="invalid-feedback">{errors[entry][idx].message}</div>}
                      </>
                    </CustomizableInput>
                  )
                })} />
            </BasicWrapper>
          )
        case 'select':
          return (
            <Controller
              name={entry}
              control={control}
              render={({ field }) => {
                return (
                  <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
                    <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={errors[entry]}>
                      <SelectInput
                        {...step.props}
                        className={classNames({ 'is-invalid': errors[entry] })}
                        readOnly={step.disabled ? 'readOnly' : null}
                        onChange={field.onChange}
                        value={field.value}
                        possibleValues={step.options}
                        {...step}
                      />
                    </CustomizableInput>
                  </BasicWrapper>
                )
              }}
            />
          )
        default:
          return (
            <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
              <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }} error={errors[entry]}>
                <input
                  {...step.props}
                  type={step.format || 'text'} id={entry}
                  className={classNames("form-control", { 'is-invalid': errors[entry] })}
                  readOnly={step.disabled ? 'readOnly' : null}
                  name={entry}
                  defaultValue=""
                  placeholder={step.placeholder}
                  {...register(entry)} />
              </CustomizableInput>
            </BasicWrapper>
          );
      }

    case Types.number:
      switch (step.format) {
        case 'array':
          return (
            <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
              <ArrayStep
                entry={entry} step={step} trigger={trigger}
                register={register} control={control} errors={errors}
                values={getValues(entry)}
                component={((props, idx) => {
                  return (
                    <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(`${entry}.${idx}`), onChange: v => setValue(`${entry}.${idx}`, v, { shouldValidate: true }) }} error={errors[entry] && errors[entry][idx]}>
                      <input
                        {...step.props}
                        type="number"
                        className={classNames("form-control", { 'is-invalid': errors[entry] && errors[entry][idx] })}
                        readOnly={step.disabled ? 'readOnly' : null}
                        placeholder={step.placeholder} {...props} />
                      {errors[entry] && errors[entry][idx] && <div className="invalid-feedback">{errors[entry][idx].message}</div>}
                    </CustomizableInput>
                  )
                })} />
            </BasicWrapper>
          )

        default:
          return (
            <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
              <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v) }} error={errors[entry]}>
                <input
                  {...step.props}
                  type="number" id={entry}
                  className={classNames("form-control", { 'is-invalid': errors[entry] })}
                  readOnly={step.disabled ? 'readOnly' : null}
                  name={entry}
                  placeholder={step.placeholder}
                  {...register(entry)} />
              </CustomizableInput>
            </BasicWrapper>
          );
      }

    case Types.bool:
      return (
        <Controller
          name={entry}
          control={control}
          render={({ field }) => {
            return (
              <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
                <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={errors[entry]}>
                  <BooleanInput
                    {...step.props}
                    className={classNames({ 'is-invalid': errors[entry] })}
                    readOnly={step.disabled ? 'readOnly' : null}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </CustomizableInput>
              </BasicWrapper>
            )
          }}
        />
      )

    case Types.object:
      switch (step.format) {
        case 'select':
          return (
            <Controller
              name={entry}
              control={control}
              defaultValue={step.defaultValue}
              render={({ field }) => {
                return (
                  <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
                    <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={errors[entry]}>
                      <SelectInput
                        {...step.props}
                        className={classNames({ 'is-invalid': errors[entry] })}
                        readOnly={step.disabled ? 'readOnly' : null}
                        onChange={field.onChange}
                        value={field.value}
                        possibleValues={step.options}
                        httpClient={httpClient}
                        {...step}
                      />
                    </CustomizableInput>
                  </BasicWrapper>
                )
              }}
            />
          )
        default:
          return (
            <Controller
              name={entry}
              control={control}
              defaultValue={step.defaultValue}
              render={({ field }) => {
                return (
                  <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
                    <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={errors[entry]}>
                      <ObjectInput
                        {...step.props}
                        className={classNames({ 'is-invalid': errors[entry] })}
                        readOnly={step.disabled ? 'readOnly' : null}
                        onChange={field.onChange}
                        value={field.value}
                        possibleValues={step.options}
                        {...step}
                      />
                    </CustomizableInput>
                  </BasicWrapper>
                )
              }}
            />
          )
      }
    case Types.date:
      return (
        <Controller
          name={entry}
          control={control}
          defaultValue={step.defaultValue}
          render={({ field }) => {
            return (
              <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
                <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={errors[entry]}>
                  <DatePicker
                    {...step.props}
                    id="datePicker-1"
                    className={classNames({ 'is-invalid': errors[entry] })}
                    readOnly={step.disabled ? 'readOnly' : null}
                    value={field.value}
                    onChange={field.onChange}
                    formatStyle="large"
                  // locale={state.locale.name}
                  />
                </CustomizableInput>
              </BasicWrapper>
            )
          }}
        />
      )
    case Types.file:
      if (step.format === 'hidden') {
        return (
          <Controller
            name={entry}
            control={control}
            render={({ field }) => {
              const FileInput = ({onChange}) => {
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
                  <div className={classNames("d-flex flex-row justify-content-start", { 'is-invalid': errors[entry] })}>
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
                <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
                  <CustomizableInput render={step.render} field={{ rawValues: getValues(), ...field }} error={errors[entry]}>
                    <FileInput onChange={field.onChange} error={errors[entry]}/>
                  </CustomizableInput>
                </BasicWrapper>
              )
            }}
          />
        )
      }
      return (
        <BasicWrapper entry={entry} error={errors[entry]} label={entry} help={step.help} render={inputWrapper}>
          <CustomizableInput render={step.render} field={{ rawValues: getValues(), value: getValues(entry), onChange: v => setValue(entry, v, { shouldValidate: true }) }} error={errors[entry]}>
            <input
              {...step.props}
              type='file' id={entry}
              className={classNames("form-control", { 'is-invalid': errors[entry] })}
              readOnly={step.disabled ? 'readOnly' : null}
              name={entry}
              placeholder={step.placeholder}
              {...register(entry)} />
          </CustomizableInput>
        </BasicWrapper>
      );
    default:
      return null;
  }

}


const ArrayStep = ({ entry, step, control, trigger, register, errors, component, values, defaultValue, setValue }) => {
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
              {component({ key: field.id, ...register(`${entry}.${idx}`), value: values[idx], ...field }, idx)}
              <div className="input-group-append">
                <button className="btn btn-danger btn-sm" onClick={() => {
                  remove(idx)
                  trigger("comments");
                }}>remove</button>
              </div>
            </div>
          )
        })}
      <div>
        <input type="button" className={classNames("btn btn-info mt-2", { 'is-invalid': errors[entry] })} onClick={() => {
          append(defaultValue)
          trigger(entry);
        }} value="Add" />
        {errors[entry] && <div className="invalid-feedback">{errors[entry].message}</div>}
      </div>
    </>
  )
}