import React, { useEffect, useState, useRef, useImperativeHandle, useContext, RefObject, FormEvent, ChangeEvent, useCallback } from 'react'
import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'classnames';
import deepEqual from 'fast-deep-equal';
import { HelpCircle, Loader, Upload, ChevronDown, ChevronUp, Trash2 } from 'react-feather';
import { useForm, useFormContext, Controller, useFieldArray, FormProvider, useWatch, FieldValue, Control, UnpackNestedValue, FieldPathValue } from 'react-hook-form';
import { DatePicker } from 'react-rainbow-components';
import ReactToolTip from 'react-tooltip';
import { v4 as uuid } from 'uuid';
import * as yup from "yup";
import debounce from "lodash.debounce"

import { type, Type } from './type';
import { format, Format } from './format';
import { BooleanInput, Collapse, SelectInput, ObjectInput, CodeInput, MarkdownInput, SingleLineCode, SelectOption } from './inputs/index';
import { getShapeAndDependencies } from './resolvers/index';
import { option } from './Option'
import { ControlledInput } from './controlledInput.js';
import { arrayFlatten, isDefined, useHashEffect } from './utils';

import './style/style.scss'
import { Constraint, TConstraintType } from './constraints';

interface OptionActionItem {
  display?: boolean;
  label?: string;
}

interface OptionActions {
  reset?: OptionActionItem;
  submit?: OptionActionItem;
}

type HttpClient = (url: string, method: string) => Promise<Response>;

interface Option {
  httpClient?: HttpClient;
  watch?: boolean | ((param: any) => void);
  autosubmit?: boolean;
  actions?: OptionActions,
  showErrorsOnStart?: boolean
}


export interface Schema {
  [key: string]: SchemaEntry;
}

type SchemaRenderType = ({ rawValues, value, onChange, error, setValue, parent }: { rawValues?: any, value?: any, onChange?: (param: object) => void, error?: boolean, parent?: string, setValue?: (data: any) => void }) => JSX.Element

interface ConditionnalSchemaElement {
  default?: boolean;
  condition?: ({ rawValues, ref }: { rawValues: { [x: string]: any }, ref: any }) => boolean | any;
  schema: Schema;
  flow: Array<FlowObject | string>
}


export interface ConditionnalSchema {
  ref: string;
  switch: ConditionnalSchemaElement[];
}

export interface SchemaEntry {
  schema?: Schema;
  type: Type;
  format?: Format;
  array?: boolean;
  createOption?: boolean;
  onCreateOption?: (option: string) => any; // TODO specify option style
  isMulti?: boolean;
  defaultKeyValue?: object;
  visible?: boolean | { ref: string, test: (b: any, idx?: number) => boolean };  // TODO match signatures of disabled / label
  disabled?: boolean | ((prop: { rawValues: { [x: string]: any }, value: any }) => boolean);
  label?: React.ReactNode | ((prop: { rawValues: { [x: string]: any }, value: any }) => React.ReactNode);
  placeholder?: string;
  defaultValue?: any;
  help?: string;
  className?: string;
  style?: object;
  onChange?: (param: object) => void;
  render?: SchemaRenderType;
  itemRender?: SchemaRenderType;
  props?: object;
  options?: Array<any | { label: string, value: any }>;
  optionsFrom?: string;
  transformer?: ((v: any) => SelectOption) | { label: string, value: string };
  conditionalSchema?: ConditionnalSchema;
  constraints?: Array<Constraint | { type: TConstraintType, message?: string }>;
  flow?: Array<string | FlowObject>;
  onAfterChange?: (obj: { entry: string, value: object, rawValues: object, previousValue?: object, getValue: (entry: string) => any, setValue: (entry: string, value: any) => void, onChange: (v: any) => void, informations?: Informations }) => void;
  visibleOnCollapse?: boolean;
  addableDefaultValue?: any; /* TODO doc : possible only with array, used to give default value to dynamically added elements */
  collapsed?: boolean; // TODO doc : indicate wether form is closed or not, only for objects with form
  collapsable?: boolean; // TODO doc : indicate wether schema can be collapsed, only for objects with form
}

interface FlowObject {
  label: string;
  flow: Flow;
  collapse: boolean;
}
export type Flow = Array<string | FlowObject>


type TFunctionalProperty = <T, >(entry: string, prop: T | ((param: { rawValues: { [x: string]: any }, value: any }) => T)) => T

interface Informations {
  path: string,
  parent?: Informations,
  index?: number
}


const usePrevious = (value: any) => {
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

const BasicWrapper = ({ entry, children, render, functionalProperty, step }:
  {
    entry: object | string,
    className?: string,
    children: JSX.Element,
    render?: ({ entry, label, error, help, children }: { entry: string, label: React.ReactNode, error: object, help: React.ReactNode, children: React.ReactNode }) => JSX.Element,
    functionalProperty: (entry: string, prop: React.ReactNode) => React.ReactNode,
    step?: SchemaEntry
  }) => {
  const { formState, watch } = useFormContext();

  if (typeof entry === 'object') {
    return children
  }

  const visibleStep = option(step)
    .map(s => s.visible)
    .map(visible => {
      let value: any;
      switch (typeof visible) {
        case 'object':
          value = watch(visible.ref);
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

  const computedLabel = functionalProperty(entry, step?.label === null ? null : step?.label || entry)

  const id = uuid();

  // FIXME not sure it works as intended with more two or more parts
  const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.errors)
  const isDirty = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.dirtyFields)
  const isTouched = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.touchedFields)
  const errorDisplayed = formState.isSubmitted || isDirty || isTouched

  if (render) {
    return render({ entry, label: computedLabel, error, help: step?.help, children })
  }

  return (
    <div className='mrf-mt_10' style={{ position: 'relative' }}>
      {computedLabel && <label className='mrf-flex mrf-ai_center mrf-mb_5' htmlFor={entry}>
        <span>{computedLabel}</span>
        {step?.help && <>
          <ReactToolTip html={true} place={'bottom'} id={id} />
          <span className='mrf-flex mrf-ai_center' data-html={true} data-tip={step?.help} data-for={id}>
            <HelpCircle style={{ color: 'gray', width: 17, marginLeft: '.5rem', cursor: 'help' }} />
          </span>
        </>}
      </label>}

      {children}
      {error && <div className={classNames('mrf-feedback', { ['mrf-txt_red']: !!errorDisplayed })}>{error.message}</div>}
    </div>
  )
}

const CustomizableInput = (props: { field: object, error?: boolean, render?: SchemaRenderType, children: JSX.Element }) => {
  if (props.render) {
    return (
      props.render({ ...props.field, error: props.error })
    )
  }
  return props.children
}

const defaultVal = (value?: any, array?: boolean, defaultValue?: any, type?: any) => {
  if (isDefined(defaultValue)) return defaultValue
  if (array) return []
  return value
}

function getDefaultValues(flow: Flow, schema: Schema, value?: any): object {
  return (flow || []).reduce((acc: object, key: string | FlowObject) => {
    if (typeof key === 'object') {
      return { ...acc, ...getDefaultValues(key.flow, schema, value) }
    }
    const entry = schema[key]
    if (!entry) { return acc }
    return { ...acc, [key]: defaultVal(value ? value[key] : null, entry.array || entry.isMulti || false, entry.defaultValue) }
  }, {})
}

const cleanInputArray = (obj: { [x: string]: any } = {}, defaultValues: { [x: string]: any } = {}, flow?: Flow, subSchema?: Schema): object => {
  const realFlow = option(flow)
    .map(f => f.map(v => typeof v === 'object' ? v.flow : v))
    .map(arrayFlatten)
    .getOrElse(Object.keys(subSchema || {}))

  return Object.entries(subSchema || {})
    .filter(([key]) => realFlow.includes(key))
    .reduce((acc, [key, step]) => {
      let v: any = null;
      if (obj) {
        v = obj[key];
      }

      const maybeDefaultValue = defaultValues[key]
      if (!v && isDefined(maybeDefaultValue)) {
        v = maybeDefaultValue;
      }

      if (step.array && !step.render) {
        return {
          ...acc, [key]: (v || []).map((value: any) => ({
            value: typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value) ?
              cleanInputArray(value, defaultValues, subSchema?.[key]?.flow, subSchema?.[key]?.schema || {}) : value
          }))
        }
      } else if (typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) {
        return { ...acc, [key]: cleanInputArray(v, defaultValues, subSchema?.[key]?.flow, subSchema?.[key]?.schema || {}) }
      } else {
        return { ...acc, [key]: v === undefined ? (Array.isArray(v) ? [] : step.type === type.object ? {} : null) : v }
      }
    }, obj)
}

const cleanOutputArray = (obj: object, subSchema: Schema): object => {
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

export const validate = (flow: string[], schema: Schema, value: object) => {
  const formFlow = flow || Object.keys(schema)

  const { shape, dependencies } = getShapeAndDependencies(formFlow, schema);
  return yup.object()
    .shape(shape, dependencies)
    .validate(value, {
      abortEarly: false
    })
}

const Watcher = React.memo(({ options, control, schema, onSubmit, handleSubmit }: { options?: Option, control: Control<any, any> | undefined, schema: Schema, onSubmit: (param: any) => void, handleSubmit: ((func: (param: any) => void) => (() => void)) }) => {
  const data = useWatch({ control })

  const realSubmit = (d: any) => handleSubmit(() => {
    onSubmit(d);
  })()

  const debouncedSubmit = useCallback(debounce(realSubmit, 250, { leading: true }), [])

  useHashEffect(() => {
    if (options?.autosubmit) {
      debouncedSubmit(data)
    }
  }, [data])

  if (options?.watch) {
    if (typeof options.watch === 'function') {
      options.watch(cleanOutputArray(data, schema))
    } else {
      console.group('react-form watch')
      console.log(cleanOutputArray(data, schema))
      console.groupEnd()
    }
  }

  return null
}, () => {
  return true
})

export const Form = React.forwardRef(function Form(
  { schema, flow, value, inputWrapper, onSubmit, onError = () => {/* default is nothing */ }, footer, style = {}, className, options = {}, nostyle }:
    { schema: Schema, flow: Array<string | FlowObject>, value?: object, inputWrapper?: (props: object) => JSX.Element, onSubmit: (obj: { [x: string]: any }) => void, onError?: () => void /* TODO */, footer?: (props: { reset: () => void, valid: () => void }) => JSX.Element, style?: object, className?: string, options?: Option, nostyle: boolean }, ref) {

  const formFlow = flow || Object.keys(schema)
  const maybeCustomHttpClient = (url: string, method: string) => {
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

  const resolver = (rawData: object) => {
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

  const { handleSubmit, formState: { errors, dirtyFields }, reset, trigger, getValues, watch } = methods

  useEffect(() => {
    if (!!options.showErrorsOnStart) {
      trigger();
    }
  }, [trigger, initialReseted])


  useHashEffect(() => {
    reset({ ...cleanInputArray(value, defaultValues, flow, schema) })
  }, [value, schema])


  const functionalProperty = <T,>(entry: string, prop: T | ((param: { rawValues: { [x: string]: any }, value: any }) => T)): T => {
    if (typeof prop === 'function') {
      return (prop as Function)({ rawValues: getValues(), value: getValues(entry) }); // FIXME why ???
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
        handleSubmit={handleSubmit} />
      <form className={className || `mrf-pr_15 mrf-w_100`} onSubmit={handleSubmit(data => {
        const clean = cleanOutputArray(data, schema)
        onSubmit(clean)
      }, onError)}>
        {formFlow.map((entry, idx) => {
          const step = typeof entry === "object" ? undefined : schema[entry]

          if (!step && typeof entry === 'string') {
            console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
            return null;
          }

          return (
            <BasicWrapper key={`${entry}-${idx}`} entry={entry} functionalProperty={functionalProperty} render={inputWrapper} step={step}>
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

const Footer = (props: { actions?: { submit?: { display?: boolean, label?: React.ReactNode }, cancel?: { display?: boolean, action: () => void, label?: React.ReactNode }, reset?: { display?: boolean, label?: React.ReactNode } }, render?: ({ reset, valid }: { reset: () => void, valid: () => void }) => JSX.Element, reset: () => void, valid: () => void }) => {
  if (props.render) {
    return props.render({ reset: props.reset, valid: props.valid })
  }

  const isSubmitDisplayed = props.actions?.submit?.display === undefined ? true : !!props.actions?.submit?.display

  return (
    <div className='mrf-flex mrf-jc_end mrf-mt_5'>
      {props.actions?.cancel?.display && <button className='mrf-btn mrf-btn_red' type="button" onClick={() => props.actions?.cancel?.action()}>{props.actions?.cancel?.label || 'Cancel'}</button>}
      {props.actions?.reset?.display && <button className='mrf-btn mrf-btn_red' type="button" onClick={props.reset}>{props.actions?.reset?.label || 'Reset'}</button>}
      {isSubmitDisplayed && <button className='mrf-btn mrf-btn_green mrf-ml_10' type="submit">{props.actions?.submit?.label || 'Save'}</button>}
    </div>
  )
}

const Step = (props: {
  entry: string | FlowObject,
  realEntry?: string,
  step?: SchemaEntry,
  schema: Schema,
  inputWrapper?: (props: object) => JSX.Element,
  httpClient?: HttpClient,
  defaultValue?: any,
  index?: number,
  functionalProperty: TFunctionalProperty,
  parent?: string,
  parentInformations?: Informations
}) => {
  let { entry, realEntry, step, schema, inputWrapper, httpClient, defaultValue, index, functionalProperty, parent, parentInformations } = props;
  const { formState: { errors, dirtyFields, touchedFields, isSubmitted }, control, getValues, setValue, watch } = useFormContext();

  if (entry && typeof entry === 'object') {
    const errored = extractFlowString(entry).some(step => !!errors[step] && (dirtyFields[step] || touchedFields[step]))
    return (
      <Collapse {...entry} errored={errored}>
        {entry.flow.map((en, entryIdx) => {
          const stp = typeof en === "object" ? undefined : schema[en]; // TODO Factorise this logic

          if (!stp && typeof en === 'string') {
            console.error(`no step found for the entry "${en}" in the given schema. Your form might not work properly. Please fix it`)
            return null;
          }

          return (
            <BasicWrapper key={`collapse-${en}-${entryIdx}`} entry={en} functionalProperty={functionalProperty} step={stp} render={inputWrapper}>
              <Step entry={en} step={stp} schema={schema}
                inputWrapper={inputWrapper} httpClient={httpClient}
                defaultValue={stp?.defaultValue} functionalProperty={functionalProperty} parentInformations={parentInformations} />
            </BasicWrapper>
          )
        })}
      </Collapse>
    )
  }

  const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], errors)
  const isDirty = entry.split('.').reduce((acc, curr) => acc && acc[curr], dirtyFields)
  const isTouched = entry.split('.').reduce((acc, curr) => acc && acc[curr], touchedFields)
  const errorDisplayed = (!!error && (isSubmitted || isDirty || isTouched)) as boolean

  const informations = { path: entry, parent: parentInformations, index }

  step = step!;

  if (step.onAfterChange) {
    const data = watch()

    const d = entry
      .replace('[', '.').replace(']', '')
      .split('.')
      .reduce((acc, curr) => acc && acc[curr], data) || {}

    const currentData = usePrevious(cleanOutputArray(d, schema))
    const newData = cleanOutputArray(d, schema)

    if (!deepEqual(newData, currentData) || (newData !== undefined && currentData === undefined))
      step.onAfterChange({
        entry,
        value: getValues(entry),
        rawValues: getValues(),
        previousValue: currentData,
        getValue: (e: string) => getValues(e),
        setValue,
        onChange: (v: any) => setValue(entry as string, v),
        informations
      })
  }

  if (step.array) {
    return (
      <CustomizableInput render={step.render} field={{
        setValue: (key: string, value: any) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: (v: any) => setValue((entry as string), v)
      }} error={!!error}>
        <ArrayStep
          entry={entry}
          step={step}
          disabled={functionalProperty(entry, step.disabled || false)}
          component={((props, idx) => {
            return (
              <Step
                entry={`${entry}.${idx}.value`}
                step={{ ...(schema[realEntry || (entry as string)]), render: step!.itemRender!, onChange: undefined, array: false, onAfterChange: step!.onAfterChange }}
                schema={schema}
                inputWrapper={inputWrapper}
                httpClient={httpClient}
                defaultValue={props.defaultValue?.value}
                index={idx}
                functionalProperty={functionalProperty}
                parentInformations={informations} />
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
            <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <textarea
                className={classNames('mrf-input', step.className, { 'mrf-mrf-input__invalid': !!errorDisplayed })} />
            </ControlledInput>
          );
        case format.code:
        case format.singleLineCode:
          const Component = step.format === format.code ? CodeInput : SingleLineCode
          return (
            <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <Component className={classNames(step?.className, { 'mrf-input__invalid': !!error })}/>
            </ControlledInput>
          )
        case format.markdown:
          return (
            <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <MarkdownInput className={classNames(step.className, { 'mrf-input__invalid': !!errorDisplayed })} />
            </ControlledInput>
          )
        case format.buttonsSelect:
        case format.select: {
          return (
            <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <SelectInput
                className={classNames('mrf-flex_grow_1', step.className, { 'mrf-input__invalid': !!errorDisplayed })}
                disabled={functionalProperty(entry, step.disabled || false)}
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
        }
        default:
          return (
            <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <input
                type={step.format || 'text'}
                className={classNames('mrf-input', step.className, { 'mrf-input__invalid': !!errorDisplayed })}
              />
            </ControlledInput>
          )
      }

    case type.number:
      switch (step.format) {
        case format.buttonsSelect:
        case format.select:
          return (
            <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <SelectInput
                className={classNames('mrf-content', step.className, { 'mrf-input__invalid': !!errorDisplayed })}
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
          return <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
            <input
              type={step.format || 'number'}
              className={classNames('mrf-input', step.className, { 'mrf-input__invalid': !!errorDisplayed })}
            />
          </ControlledInput>
      }

    case type.bool:
      return (
        <ControlledInput
          step={step}
          entry={entry}
          errorDisplayed={errorDisplayed}>
          <BooleanInput className={step.className} errorDisplayed={errorDisplayed} />
        </ControlledInput>
      )

    case type.object:
      switch (step.format) {
        case format.buttonsSelect:
        case format.select:
          return (
            <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <SelectInput
                className={classNames('mrf-flex_grow_1', step.className, { 'mrf-input__invalid': !!errorDisplayed })}
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
          const flow = option(step.flow).getOrElse(option(step.schema).map(s => Object.keys(s)).getOrElse([]));
          return (
            <CustomizableInput render={step.render} field={{ parent, setValue: (key: string, value: any) => setValue(key, value), rawValues: getValues(), value: getValues(entry), onChange: (v: any) => setValue((entry as string), v, { shouldValidate: true }) }}>
              <NestedForm
                schema={step.schema!} flow={flow} step={step} parent={entry}
                inputWrapper={inputWrapper} maybeCustomHttpClient={httpClient} value={getValues(entry) || defaultValue}
                functionalProperty={functionalProperty} errorDisplayed={errorDisplayed} informations={informations} />
            </CustomizableInput>
          )

        case format.code:
          return (
            <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}
              component={(field, props) => (
                <CodeInput
                  {...props}
                  className={classNames(step?.className, { 'mrf-input__invalid': !!error })}
                  onChange={(e: any) => {
                    let v: any
                    try {
                      v = JSON.parse(e)
                    } catch (err) {
                      v = e
                    }
                    field.onChange(v)
                    option(step?.onChange)
                      .map(onChange => onChange({ rawValues: getValues(), value: v, setValue }))
                  }}
                  value={field.value === null ? null : ((typeof field.value === 'object') ? JSON.stringify(field.value, null, 2) : field.value)}
                />
              )} />
          )
        default:
          return (
            <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
              <ObjectInput
                className={classNames(step.className, { 'mrf-input__invalid': !!errorDisplayed })}
              />
            </ControlledInput>
          )
      }
    case type.date:
      return (
        <ControlledInput step={step} entry={entry} errorDisplayed={errorDisplayed}>
          <DatePicker
            className={classNames('mrf-datepicker', step.className, { 'mrf-input__invalid': !!errorDisplayed })}
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
            const FileInput = ({ onChange }: { onChange?: (files: any[]) => void }) => {
              const [uploading, setUploading] = useState(false);
              const [input, setInput] = useState<HTMLInputElement | undefined | null>(undefined);

              const setFiles = (e: ChangeEvent<HTMLInputElement>) => {
                const files = (e.target as HTMLInputElement).files;
                setUploading(true);
                onChange && onChange(files ? [...files] : [])
                setUploading(false);
              };

              const trigger = () => {
                input?.click();
              };

              const files: File[] = field.value || []

              return (
                <div className={classNames('mrf-flex', 'mrf-ai_center', step?.className, { 'mrf-input__invalid': !!error })}>
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
                    disabled={uploading || functionalProperty((entry as string), step?.disabled || false)}
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
              <ControlledInput step={step!} entry={entry as string} errorDisplayed={errorDisplayed}>
                <FileInput />
              </ControlledInput>
            )
          }}
        />
      )

    case type.json:
      return (
        <ControlledInput step={step} entry={entry} component={(field: { value: any, onChange: (v: any) => void }, props: object) => (
          <CodeInput
            {...props}
            className={classNames(step?.className, { 'mrf-input__invalid': !!error })}
            onChange={(v: any) => {
              field.onChange(v)
              option(step?.onChange)
                .map(onChange => onChange({ rawValues: getValues(), value: v, setValue }))
            }}
            value={field.value}
          />
        )} />
      )

    default:
      return null;
  }

}


const ArrayStep = ({ entry, step, component, disabled }: { entry: string, step: SchemaEntry, component: ({ key, defaultValue, value }: { key: string, defaultValue: any, value?: any }, ids: number) => JSX.Element, disabled: boolean }) => {
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
        <button type="button" className={classNames('mrf-btn', 'mrf-btn_blue', 'mrf-btn_sm', 'mrf-mt_5', { ['mrf-input__invalid']: !!errorDisplayed })} onClick={() => {
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

const NestedForm = ({ schema, flow, parent, inputWrapper, maybeCustomHttpClient, errorDisplayed, value, step, functionalProperty, informations }:
  {
    schema: Schema,
    flow: Flow,
    parent: string,
    inputWrapper?: (props: object) => JSX.Element,
    maybeCustomHttpClient?: HttpClient,
    errorDisplayed: boolean,
    value: any,
    step: SchemaEntry,
    functionalProperty: TFunctionalProperty,
    informations?: Informations
  }) => {

  const { getValues, setValue, control, formState: { errors, dirtyFields, touchedFields } } = useFormContext();
  const [collapsed, setCollapsed] = useState<boolean>(!!step.collapsed);

  useWatch({ name: step?.conditionalSchema?.ref || "", control })

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
        .orElse(condiSchema.switch.find(s => s.default)!)
        .getOrElse({ schema: {}, flow: [] })

      return { schema: schemaAndFlow.schema, flow: schemaAndFlow.flow || Object.keys(schemaAndFlow.schema) }
    })
    .getOrElse({ schema, flow })

  useHashEffect(() => {
    const def = getDefaultValues(schemaAndFlow.flow, schemaAndFlow.schema, getValues(parent));
    setValue(parent, def, { shouldValidate: false })
  }, [schemaAndFlow.schema])

  const computedSandF = schemaAndFlow.flow.reduce((
    acc: { step: SchemaEntry, entry: string | FlowObject }[],
    entry: string | FlowObject) => {
    const step = (typeof entry === "string") ? schemaAndFlow.schema[entry] : schemaAndFlow.schema[entry.label]

    return [...acc, { step, entry }]
  }, [])

  const bordered = computedSandF.length >= 1 && step.label !== null;
  return (
    <div className={classNames(step.className, { ['mrf-nestedform__border']: bordered, ['mrf-border__error']: !!errorDisplayed })} style={{ position: 'relative' }}>
      {!!step.collapsable && schemaAndFlow.flow.length > 1 && collapsed &&
        <ChevronDown size={30} className='mrf-cursor_pointer' style={{ position: 'absolute', top: -35, right: 0, zIndex: 100 }} strokeWidth="2" onClick={() => setCollapsed(!collapsed)} />}
      {!!step.collapsable && schemaAndFlow.flow.length > 1 && !collapsed &&
        <ChevronUp size={30} className='mrf-cursor_pointer' style={{ position: 'absolute', top: -35, right: 0, zIndex: 100 }} strokeWidth="2" onClick={() => setCollapsed(!collapsed)} />}

      {computedSandF.map(({ step, entry }, idx: number) => {

        if (!step && typeof entry === 'string') {
          console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
          return null;
        }

        if (typeof entry === "object") {
          const errored = extractFlowString(entry).some(step => !!errors[step] && (dirtyFields[step] || touchedFields[step])) /* FIXME does it works in case of Flow object ? Need to do a "flatMap" to retrieve all leafs string of flows objects */
          return <Collapse {...entry} errored={errored}>
            {entry.flow.map((en, entryIdx) => {
              const stp = typeof en === "object" ? undefined : schema[en]

              if (!stp && typeof en === 'string') {
                console.error(`no step found for the entry "${en}" in the given schema. Your form might not work properly. Please fix it`)
                return null;
              }

              return (
                <BasicWrapper key={`collapse-${en}-${entryIdx}`} entry={en} functionalProperty={functionalProperty} step={stp} render={inputWrapper}>
                  <Step entry={en} step={stp} schema={schema}
                    inputWrapper={inputWrapper} httpClient={maybeCustomHttpClient}
                    defaultValue={stp?.defaultValue} functionalProperty={functionalProperty} />
                </BasicWrapper>
              )
            })}
          </Collapse>
          // TODO return collapse, then entry will always be a string in below return
        }
        return (
          <BasicWrapper key={`${entry}.${idx}`}
            className={classNames({ ['mrf-display__none']: (collapsed && !step.visibleOnCollapse) })}
            entry={`${parent}.${entry}`}
            functionalProperty={functionalProperty}
            step={step}
            render={inputWrapper}
          >
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
              functionalProperty={functionalProperty}
              parentInformations={informations} />
          </BasicWrapper>
        )
      })}
    </div>
  )
}


function extractFlowString(entry: FlowObject): string[] {
  return entry.flow.map(eitherStringOrObject => {
    if (typeof eitherStringOrObject === "string") {
      return eitherStringOrObject;
    } else {
      return extractFlowString(eitherStringOrObject)
    }
  }).flat()
}