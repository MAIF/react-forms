import React, { ChangeEvent, useMemo, useState } from "react"
import { Controller, useController, useFormContext, useWatch } from "react-hook-form"
import deepEqual from 'fast-deep-equal';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import TextField from '@mui/material/TextField';
// @ts-ignore
import Loader from 'react-feather/dist/icons/loader.js';
// @ts-ignore
import Upload from 'react-feather/dist/icons/upload.js';
// @ts-ignore
import ChevronDown from 'react-feather/dist/icons/chevron-down.js';
// @ts-ignore 
import ChevronUp from 'react-feather/dist/icons/chevron-up.js';
// @ts-ignore 
import Trash2 from 'react-feather/dist/icons/trash-2.js';

import { BooleanInput, CodeInput, Collapse, MarkdownInput, ObjectInput, SelectInput, SingleLineCode } from "../inputs"
import { cleanHash, isDefined } from "../utils"
import { cleanOutputArray, extractFlowString, getDefaultValues, usePrevious } from "./formUtils"
import { Flow, FlowObject, HttpClient, Informations, Schema, SchemaEntry, SchemaRenderType, StepsOptions, TFunctionalProperty } from "./types"
import { ControlledInput } from "./controlledInput";
import { ArrayStep } from "./arrayStep";
import { type } from "../type";
import { format } from "../format";
import classNames from "classnames";
import { option } from "../Option";

type TCustomizableInputProps = {
  rawValues?: any,
  value?: any,
  onChange?: (param: object) => void,
  error?: boolean,
  getValue: (entry: string) => any,
  informations?: Informations,
  setValue?: (key: string, data: any) => void,
  render?: SchemaRenderType,
  children: JSX.Element,
  defaultValue?: any
}
const CustomizableInput = (props: TCustomizableInputProps) => {
  if (props.render) {
    return (
      props.render({ ...props, error: props.error })
    )
  }
  return props.children
}

export const CollapsedStep = (props: {
  entry: FlowObject,
  schema: Schema,
  inputWrapper?: (props: object) => JSX.Element,
  httpClient?: HttpClient,
  functionalProperty: TFunctionalProperty,
  stepsOptions?: StepsOptions
  defaultFormValue: any
}) => {
  let {
    entry, schema,
    inputWrapper, httpClient,
    functionalProperty } = props;

  const { formState: { errors, dirtyFields, touchedFields } } = useFormContext()

  const errored = extractFlowString(entry).some(step => !!errors[step] && (dirtyFields[step] || touchedFields[step]))

  //FIXME: get collapse errors
  return (
    <Collapse {...entry} errored={errored}>
      {entry.flow.map((en, entryIdx) => {

        if (typeof en === 'object') {
          return (
            <CollapsedStep key={entryIdx} {...props} entry={en} />
          )
        }

        const stp = schema[en];

        if (!stp && typeof en === 'string') {
          console.error(`no step found for the entry "${en}" in the given schema. Your form might not work properly. Please fix it`)
          return null;
        }

        const informations = { path: en, key: en }

        return (
          <Step entry={en} step={stp} schema={schema}
            inputWrapper={inputWrapper} httpClient={httpClient}
            defaultValue={stp?.defaultValue} functionalProperty={functionalProperty} informations={informations} options={props.stepsOptions} defaultFormValue={props.defaultFormValue} />
        )
      })}
    </Collapse>
  )
}

export const Step = (props: {
  entry: string,
  realEntry?: string,
  step: SchemaEntry,
  schema: Schema,
  inputWrapper?: (props: object) => JSX.Element,
  httpClient?: HttpClient,
  defaultValue?: any,
  index?: number,
  functionalProperty: TFunctionalProperty,
  informations: Informations,
  options?: StepsOptions
  defaultFormValue: any
}) => {
  let { entry, realEntry, step, schema, inputWrapper, httpClient, functionalProperty, informations, defaultFormValue } = props;
  const methods = useFormContext();
  const { formState: { errors, dirtyFields, touchedFields, isSubmitted }, control, getValues, setValue, reset } = methods;
  const { watch }: { watch: (param?: string | string[]) => any } = methods;

  const [render, setRender] = useState(cleanHash(getValues()));

  const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], errors as { [x: string]: any })
  const isDirty = entry.split('.').reduce((acc, curr) => acc && acc[curr], dirtyFields)
  const isTouched = entry.split('.').reduce((acc, curr) => acc && acc[curr], touchedFields)
  const errorDisplayed = (!!error && (isSubmitted || isDirty || isTouched)) as boolean

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
        reset,
        informations
      })
  }

  const deactivateReactMemo = useMemo(() => {
    const isVisibleIsFunction = typeof step.visible === 'function';
    const isDisableIsFunction = typeof step.disabled === 'function';
    const isLabelIsFunction = typeof step.label === 'function';
    const deps = (typeof step.deps === 'function') ? step.deps(informations) : step.deps

    return !!deps || isVisibleIsFunction || isDisableIsFunction || isLabelIsFunction || !!step.render || !!step.conditionalSchema

  }, [cleanHash(schema)]);

  if (deactivateReactMemo) {
    const deps = (typeof step.deps === 'function') ? step.deps(informations) : step.deps
    const test = deps ? watch(deps) : watch()
    const hash = cleanHash(test)
    if (hash !== render) {
      setRender(hash)
    }
  }

  if (step.array) {
    return (
      <ControlledInput step={step} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
        <ArrayStep
          entry={entry}
          step={step}
          disabled={functionalProperty(entry, step.disabled || false, informations, error)}
          component={((cprops, idx) => {
            return (
              <Step
                entry={`${entry}.${idx}.value`}
                step={{
                  ...(schema[realEntry || (entry as string)]),
                  label: step.item?.label || null,
                  render: step.item?.render,
                  onChange: step.item?.onChange,
                  array: step.item?.array || false,
                  onAfterChange: step.item?.onAfterChange,
                  visible: step.item?.visible,
                  disabled: step.item?.disabled,
                  deps: step.item?.deps
                }}
                schema={schema}
                inputWrapper={inputWrapper}
                httpClient={httpClient}
                defaultValue={cprops.defaultValue?.value}
                index={idx}
                functionalProperty={functionalProperty}
                informations={{ path: `${informations?.path}.${idx}.value`, parent: informations, index: idx }}
                options={props.options}
                defaultFormValue={defaultFormValue} />
            )
          })}
          addLabel={props.options?.addLabel} />
      </ControlledInput>
    )
  }

  switch (step.type) {
    case type.string:
      switch (step.format) {
        case format.text:
          return (
            <ControlledInput step={step} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
              <textarea
                className={classNames('mrf-input', step.className, { 'mrf-mrf-input__invalid': !!errorDisplayed })} />
            </ControlledInput>
          );
        case format.code:
        case format.singleLineCode:
          const Component = step.format === format.code ? CodeInput : SingleLineCode
          return (
            <ControlledInput step={step} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
              <Component className={classNames(step?.className, { 'mrf-input__invalid': !!error })} />
            </ControlledInput>
          )
        case format.markdown:
          return (
            <ControlledInput step={step} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
              <MarkdownInput className={classNames(step.className, { 'mrf-input__invalid': !!errorDisplayed })} />
            </ControlledInput>
          )
        case format.buttonsSelect:
        case format.select: {
          return (
            <ControlledInput step={step} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
              <SelectInput
                className={classNames('mrf-flex_grow_1', step.className, { 'mrf-input__invalid': !!errorDisplayed })}
                disabled={functionalProperty(entry, step.disabled || false, informations, error)}
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
            <ControlledInput step={step} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
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
            <ControlledInput step={step} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
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
          return <ControlledInput step={step} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
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
          defaultFormValue={defaultFormValue}
          entry={entry} realEntry={realEntry}
          errorDisplayed={errorDisplayed}
          informations={informations}
          deactivateReactMemo={deactivateReactMemo}
          inputWrapper={inputWrapper}>
          <BooleanInput
            className={step.className}
            errorDisplayed={errorDisplayed}
            buttons={step.format === format.buttonsSelect} />
        </ControlledInput>
      )

    case type.object:
      const value = getValues(entry)
      const defaultValue = isDefined(step.defaultValue) ? step.defaultValue : getDefaultValues(step.flow, step.schema)
      switch (step.format) {
        case format.buttonsSelect:
        case format.select:
          return (
            <ControlledInput step={{ ...step, defaultValue: value || defaultValue }} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
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
            <ControlledInput step={{ ...step, defaultValue: value || defaultValue }} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
              <CustomizableInput
                render={step.render}
                rawValues={getValues()}
                value={getValues(entry)}
                onChange={(v: any) => setValue((entry as string), v, { shouldValidate: true })}
                setValue={(key: string, value: any) => setValue(key, value)}
                getValue={(key: string) => getValues(key)}
                informations={informations}
                defaultValue={value || defaultValue}
              >
                <NestedForm
                  schema={step.schema!} flow={flow} step={step} parent={entry}
                  inputWrapper={inputWrapper} maybeCustomHttpClient={httpClient} value={getValues(entry) || defaultValue}
                  functionalProperty={functionalProperty} errorDisplayed={errorDisplayed} informations={informations} stepsOptions={props.options} defaultFormValue={defaultFormValue} />
              </CustomizableInput>
            </ControlledInput>
          )

        case format.code:
          return (
            <ControlledInput step={{ ...step, defaultValue: value || defaultValue }} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue}
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
            <ControlledInput step={{ ...step, defaultValue: value || defaultValue }} entry={entry} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
              <ObjectInput
                className={classNames(step.className, { 'mrf-input__invalid': !!errorDisplayed })}
              />
            </ControlledInput>
          )
      }
    case type.date:
      switch (step.format) {
        case format.datetime:
          return (
            <ControlledInput step={step} entry={entry} realEntry={realEntry} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue}
              component={(field: { value: any, onChange: (v: any) => void }) => {
                return (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      value={field.value}
                      onChange={value => {
                        field.onChange(value)
                        option(step.onChange)
                          .map(onChange => onChange({ rawValues: getValues(), value, setValue }))
                      }}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                )
              }} />
          )
        case format.time:
          return (
            <ControlledInput step={step} entry={entry} realEntry={realEntry} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue}
              component={(field: { value: any, onChange: (v: any) => void }) => {
                return (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      value={field.value}
                      onChange={value => {
                        field.onChange(value)
                        option(step.onChange)
                          .map(onChange => onChange({ rawValues: getValues(), value, setValue }))
                      }}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                )
              }} />
          )
        default:
          return (
            <ControlledInput step={step} entry={entry} realEntry={realEntry} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue}
              component={(field: { value: any, onChange: (v: any) => void }) => {
                return (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={field.value}
                      onChange={value => {
                        field.onChange(value)
                        option(step.onChange)
                          .map(onChange => onChange({ rawValues: getValues(), value, setValue }))
                      }}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                )
              }} />
          )
      }
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
                    disabled={uploading || functionalProperty((entry as string), step?.disabled || false, informations, error)}
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
              <ControlledInput step={step!} entry={entry as string} realEntry={realEntry} errorDisplayed={errorDisplayed} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue} >
                <FileInput />
              </ControlledInput>
            )
          }}
        />
      )

    case type.json:
      return (
        <ControlledInput step={step} entry={entry} realEntry={realEntry} informations={informations} deactivateReactMemo={deactivateReactMemo} inputWrapper={inputWrapper} defaultFormValue={defaultFormValue}
          component={(field: { value: any, onChange: (v: any) => void }, props: object) => (
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

const NestedForm = ({ schema, flow, parent, inputWrapper, maybeCustomHttpClient, errorDisplayed, value, step, functionalProperty, informations, stepsOptions, defaultFormValue }:
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
    stepsOptions?: StepsOptions,
    defaultFormValue: any
  }) => {

  const { getValues, control } = useFormContext();
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

  // useHashEffect(() => {
  //   const def = getDefaultValues(schemaAndFlow.flow, schemaAndFlow.schema, getValues(parent));
  //   setValue(parent, def, { shouldValidate: false })
  // }, [schemaAndFlow.schema])

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

      {collapsed && !!step.collapsable && typeof step.collapsable === 'function' && step.collapsable({ rawValues: getValues(), getValue: (key: string) => getValues(key), value })}

      {(typeof step.collapsable !== 'function' || !collapsed) && computedSandF.map(({ step, entry }, idx: number) => {
        if (collapsed && !step.visibleOnCollapse) {
          return null;
        }


        if (typeof entry === 'object') {
          return (
            <CollapsedStep key={idx}
              entry={entry}
              schema={schema}
              inputWrapper={inputWrapper}
              httpClient={maybeCustomHttpClient}
              functionalProperty={functionalProperty}
              stepsOptions={stepsOptions}
              defaultFormValue={defaultFormValue}
            />
          )
        }

        if (!step && typeof entry === 'string') {
          console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
          return null;
        }

        return (
          <Step
            key={`step.${entry}.${idx}`}
            entry={`${parent}.${entry}`}
            realEntry={entry}
            step={schemaAndFlow.schema[entry]}
            schema={schemaAndFlow.schema}
            inputWrapper={inputWrapper}
            httpClient={maybeCustomHttpClient}
            defaultValue={value && value[entry]}
            functionalProperty={functionalProperty}
            informations={{ path: `${informations?.path}.${entry}`, key: entry, parent: informations }}
            options={stepsOptions}
            defaultFormValue={defaultFormValue} />
        )
      })}
    </div>
  )
}

const OptionalStep = (props: {
  entry: string,
  realEntry?: string,
  step: SchemaEntry,
  schema: Schema,
  inputWrapper?: (props: object) => JSX.Element,
  httpClient?: HttpClient,
  defaultValue?: any,
  index?: number,
  functionalProperty: TFunctionalProperty,
  informations: Informations,
  options?: StepsOptions
  defaultFormValue: any
}) => {
  const { field } = useController({
    defaultValue: isDefined(props.step.defaultValue) ? props.step.defaultValue : null,
    name: props.entry
  })
  const [isAdded, setIsAdded] = useState<boolean>(!!field.value)
  const { setValue } = useFormContext()


  if (isAdded) {
    return (
      <div className='mrf-ai_center mrf-mt_5' style={{ position: 'relative' }}>
        <div style={{ width: '95%' }}>
          <Step {...{ ...props, step: { ...props.step, optional: false } }} />
        </div>
        <button type="button"
          style={{ position: 'absolute', top: '2px', right: 0 }}
          className='mrf-btn mrf-btn_red mrf-btn_sm mrf-ml_5'
          onClick={() => {
            setIsAdded(false)
            setValue(props.entry, null)
          }}>
          <Trash2 size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className='mrf-flex mrf-jc_flex_end'>
      <button type="button"
        className={classNames('mrf-btn', 'mrf-btn_blue', 'mrf-btn_sm', 'mrf-mt_5')}
        onClick={() => {
          setIsAdded(true)
          //todo: setup la valeur par defaut ??
        }}>Add</button>
    </div>
  )
}