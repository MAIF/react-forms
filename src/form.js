import React, { useState } from 'react'
// import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'classnames';
import { HelpCircle, Loader, Upload, ChevronDown, ChevronUp, Trash2 } from 'react-feather';
import { DatePicker } from 'react-rainbow-components';
import ReactToolTip from 'react-tooltip';
import { v4 as uuid } from 'uuid';
import * as yup from "yup";

import { Style } from './styleContext';
import { type } from './type';
import { format } from './format';
import { BooleanInput, Collapse, SelectInput, ObjectInput, CodeInput, MarkdownInput, SingleLineCode } from './inputs/index';
import { getShapeAndDependencies } from './resolvers/index';
import { option } from './Option'
import { ControlledInput } from './controlledInput';
import deepEqual from 'fast-deep-equal';
import get from 'lodash.get';
import set from 'lodash.set';

const BasicWrapper = ({ entry, className, label, help, children, render, classes, fieldState, error, isSubmitted }) => {
  if (typeof entry === 'object') {
    return children
  }
  const id = uuid();

  const errorDisplayed = isSubmitted || fieldState?.isDirty || fieldState?.isTouched

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

const defaultVal = (value, array, defaultValue) => {
  if (!!defaultValue) return defaultValue
  if (!!array) return []
  return value || null
}

const getDefaultValues = (flow, schema, value) => {
  return (flow || []).reduce((acc, key) => {
    if (typeof key === 'object') {
      return { ...acc, ...getDefaultValues(key.flow, schema, value) }
    }
    const step = schema[key]
    if (!step) { return acc }
    return {
      ...acc,
      [key]: (value && value[key] !== undefined) ? value[key] :
        ((step.format === format.form && step.type === type.object && !step.array) ?
          { ...getDefaultValues(step.flow || Object.keys(step.schema || {}), step.schema, value) } :
          defaultVal(value ? value[key] : null, step.array || step.isMulti, step.defaultValue))
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

class FormComponent extends React.Component {
  state = {
    internalValue: undefined,
    errors: {},
    isSubmitted: false,
    isDirty: false,
    fieldsState: {}
  }

  reset = () => {
    const { flow, schema, value } = this.props
    if ((!this.state.internalValue || !deepEqual(value, this.state.internalValue)) && (flow || Object.keys(schema)).length > 0) {
      this.setState({
        isSubmitted: false,
        isDirty: false,
        internalValue: getDefaultValues(flow || Object.keys(schema), schema, { ...value })
      }, this.watch)
    }
  }

  isDirty = () => Object.keys(this.state.errors).length === 0 && this.state.isDirty

  componentDidMount() {
    this.reset()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.schema !== this.props.schema || prevProps.flow !== this.props.flow) {
      this.setState({
        isSubmitted: false,
        isDirty: false,
        internalValue: getDefaultValues(this.props.flow || Object.keys(this.props.schema), this.props.schema, { ...this.props.value })
      })
    }
  }

  watch = () => {
    const { options = {}, flow = [], schema = {} } = this.props

    if (!!options.autosubmit) {
      this.validate()
    }

    if (options.watch) {
      if (typeof options.watch === 'function') {
        options.watch(this.state.internalValue)
      } else {
        console.group('react-form watch')
        console.log(this.state.internalValue)
        console.groupEnd()
      }
    }

    this.callAfterChangeMethods((flow || Object.keys(schema)), schema)
  }

  callAfterChangeMethods = (flow, schema, path) => {
    (flow || []).forEach(key => {
      if (typeof key === 'object') {
        this.callAfterChangeMethods(key.flow, schema, path)
      }

      const currentPath = path ? `${path}.${key}` : key
      const step = get(schema, key)

      if (!step)
        return

      if (step.onAfterChange) {
        const { internalValue } = this.state

        if (step.array)
          (get(internalValue, currentPath) || []).forEach((v, idx) => {
            step.onAfterChange({
              entry: `${key}.${idx}`,
              parent: path,
              value: v,
              rawValues: internalValue,
              getValue: e => get(internalValue, e),
              getFieldValue: e => get(v, e),
              setValue: (e, v) => {
                const newValue = { ...internalValue }
                set(newValue, e, v)
                this.setState({
                  internalValue: newValue
                })
              },
              onChange: (entry, v) => {
                const newValue = { ...internalValue }
                set(newValue, `${currentPath}.${idx}.${entry}`, v)
                this.setState({
                  internalValue: newValue
                })
              }
            })
          })
        else
          step.onAfterChange({
            entry: key,
            parent: path,
            value: get(internalValue, currentPath),
            rawValues: internalValue,
            getValue: e => get(internalValue, e),
            getFieldValue: e => get(v, e),
            setValue: (e, v) => {
              const newValue = { ...internalValue }
              set(newValue, e, v)
              this.setState({
                internalValue: newValue
              })
            },
            onChange: (entry, v) => {
              const newValue = { ...internalValue }
              set(newValue, `${currentPath}.${entry}`, v)
              this.setState({
                internalValue: newValue
              })
            }
          })
      }

      if (!!step.flow || (step.format === format.form && step.type === type.object && !step.array))
        this.callAfterChangeMethods(step.flow || Object.keys(step.schema || {}), step.schema, currentPath)
    })
  }

  maybeCustomHttpClient = (url, method) => {
    if (this.props.options.httpClient) {
      return this.props.options.httpClient(url, method)
    }
    return fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
    })
  }

  handleSubmit = () => this.validate()

  trigger = () => {
    const formFlow = this.props.flow || Object.keys(this.props.schema)

    const { shape, dependencies } = getShapeAndDependencies(formFlow, this.props.schema);
    yup.object()
      .shape(shape, dependencies)
      .validate(this.state.internalValue, { abortEarly: false })
      .then(() => {
        this.setState({ errors: {} })
      })
      .catch(err => {
        if (err.inner && Array.isArray(err.inner)) {
          this.setState({
            errors: err.inner.reduce((acc, r) => set(acc, r.path, r.message), {})
          })
        }
      })
  }

  validate = e => {
    if (e && e.preventDefault)
      e.preventDefault()

    const formFlow = this.props.flow || Object.keys(this.props.schema)

    const { shape, dependencies } = getShapeAndDependencies(formFlow, this.props.schema);
    return yup.object()
      .shape(shape, dependencies)
      .validate(this.state.internalValue, { abortEarly: false })
      .then(() => {
        this.setState({
          isSubmitted: true,
          isDirty: false,
          errors: {}
        })
        this.props.onSubmit(this.state.internalValue)
      })
      .catch(err => {
        this.props.onSubmit(this.state.internalValue) // TODO - bad idea

        if (typeof this.props.onError === 'function')
          this.props.onError(err)
        else
          console.error(err)

        if (err.inner && Array.isArray(err.inner)) {
          this.setState({
            isSubmitted: true,
            errors: err.inner.reduce((acc, r) => set(acc, r.path, r.message), {})
          })
        }
      })
  }

  functionalProperty = (entry, prop) => {
    if (typeof prop === 'function') {
      return prop({ rawValues: value, value: get(this.state.internalValue, entry) });
    } else {
      return prop;
    }
  }

  onChange = (key, e, automatic) => {
    // console.log('onChange', key, e)

    const { internalValue, fieldsState, isSubmitted, isDirty } = this.state

    const newFieldsState = { ...fieldsState }
    const fieldIsDirty = !deepEqual(get(this.props.value, key), e)

    const newState = { ...internalValue }
    set(newState, key, e)

    set(newFieldsState, key, {
      isTouched: !automatic,
      isDirty: fieldIsDirty
    })

    let newDirty = isDirty

    if (!newDirty || isDirty === key)
      newDirty = fieldIsDirty ? key : false

    this.setState({
      fieldsState: newFieldsState,
      internalValue: newState,
      isDirty: newDirty
    }, () => {
      this.watch()

      if (isSubmitted)
        this.trigger()
    })
  }

  render() {
    const {
      schema,
      flow,
      inputWrapper,
      onSubmit,
      onError = () => { },
      footer,
      classes,
      className,
      options = {}
    } = this.props;

    const { errors, fieldsState, internalValue, isSubmitted } = this.state

    if (!internalValue)
      return null

    // console.log({
    //   errors,
    //   value: internalValue,
    //   fieldsState,
    //   hasErrors: Object.keys(this.state.errors).length > 0,
    //   isSubmitted,
    //   comp: {
    //     equal: deepEqual(this.props.value, this.state.internalValue),
    //     propsValue: this.props.value,
    //     internal: this.state.internalValue
    //   },
    //   isDirty: this.isDirty()
    // })

    return <form className={className || `${classes.pr_15} ${classes.w_100}`} onSubmit={this.validate}>
      {(flow || Object.keys(schema)).map((entry, idx) => {
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
                const value = get(internalValue, step.visible.ref);
                return option(step.visible.test).map(test => test(value, idx)).getOrElse(value)
              case 'boolean':
                return visible;
              default:
                return true;
            }
          })
          .getOrElse(true)

        // if (!visibleStep) {
        //   return null;
        // }

        return <Style>
          <BasicWrapper
            className={visibleStep ? '' : classNames.display__none}
            key={`${entry}-${idx}`}
            entry={entry}
            label={this.functionalProperty(entry, step?.label === null ? null : step?.label || entry)}
            help={step?.help}
            render={inputWrapper}
            fieldState={get(fieldsState, entry)}
            error={get(errors, entry)}
            isSubmitted={isSubmitted}
          >
            <Step
              key={idx}
              entry={entry}
              step={step}
              schema={schema}
              inputWrapper={inputWrapper}
              httpClient={this.maybeCustomHttpClient}
              functionalProperty={this.functionalProperty}
              value={get(this.state.internalValue, entry)}
              onChange={this.onChange}
              getField={key => !key ? this.state.internalValue : get(this.state.internalValue, key)}
              getErrorField={key => get(errors, key)}
              getFieldState={key => get(fieldsState, key)}
              isSubmitted={isSubmitted}
            />
          </BasicWrapper>
        </Style>
      })}
      <Style>
        <Footer
          render={footer}
          reset={this.reset}
          valid={this.validate}
          actions={options.actions} />
      </Style>
    </form>
  }
}

export const Form = React.forwardRef((props, ref) => {
  const { options = {} } = props
  if (options.hideLogs) {
    var console = {};
    console.log = function () { }
    console.error = function () { }
    console.warn = function () { }
    window.console = console;
  }

  return <Style overrideStyle={props.style}>
    <FormComponent {...props} ref={ref} />
  </Style>
})

const FileInput = ({ onChange, classes, readOnly, value, error }) => {
  const [uploading, setUploading] = useState(false);
  const [input, setInput] = useState(undefined);

  const setFiles = (e) => {
    const files = e.target.files;
    setUploading(true);
    onChange([...files])
    setUploading(false);
  };

  const files = value || []

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
        disabled={uploading || readOnly}
        onClick={() => {
          input.click();
        }}>
        {uploading && <Loader />}
        {!uploading && <Upload />}
        <span className={`${classes.ml_5}`}>Select file(s)</span>
      </button>

      <span className={`${classes.ml_5}`}>{files.length <= 0 ? 'No files selected' : files.map(r => r.name).join(" , ")}</span>
    </div>
  );
};

class Step extends React.Component {
  render() {
    const {
      entry, realEntry, step, schema, inputWrapper, httpClient,
      defaultValue, index, functionalProperty, parent, getField, value,
      onChange, getErrorField, getFieldState, isSubmitted } = this.props

    if (entry && typeof entry === 'object') {
      const errored = entry.flow.some(step => {
        const fieldState = getFieldState(step)
        return !!getErrorField(step) && (fieldState?.isDirty || fieldState?.isTouched)
      })
      return <Style>
        <Collapse {...entry} errored={errored}>
          {entry.flow.map((en, entryIdx) => {
            const stp = schema[en]

            if (!stp && typeof en === 'string') {
              console.error(`no step found for the entry "${en}" in the given schema. Your form might not work properly. Please fix it`)
              return null;
            }

            const visibleStep = option(stp)
              .map(s => s.visible)
              .map(visible => {
                switch (typeof visible) {
                  case 'object':
                    const value = getField(visible.ref);
                    return option(visible.test).map(test => test(value, index)).getOrElse(value)
                  case 'boolean':
                    return visible;
                  default:
                    return true;
                }
              })
              .getOrElse(true)

            // if (!visibleStep) {
            //   return null;
            // }

            return <Style>
              <BasicWrapper
                className={visibleStep ? '' : classNames.display__none}
                key={`collapse-${en}-${entryIdx}`}
                entry={en}
                label={functionalProperty(en, stp?.label === null ? null : stp?.label || en)}
                help={stp?.help}
                render={inputWrapper}
                fieldState={getFieldState(entry)}
                error={getErrorField(entry)}
                isSubmitted={isSubmitted}>
                <Step
                  entry={en}
                  step={stp}
                  schema={schema}
                  inputWrapper={inputWrapper}
                  httpClient={httpClient}
                  defaultValue={stp?.defaultValue}
                  functionalProperty={functionalProperty}
                  getField={getField}
                  getErrorField={getErrorField}
                  getFieldState={getFieldState}
                  isSubmitted={isSubmitted}
                  value={getField(en)}
                  onChange={onChange} />
              </BasicWrapper>
            </Style>
          })}
        </Collapse>
      </Style>
    }

    const error = getErrorField(entry)
    const fieldState = getFieldState(entry)
    const errorDisplayed = !!error && (isSubmitted || fieldState?.isDirty || fieldState?.isTouched)

    if (step.array) {
      return (
        <CustomizableInput render={step.render} field={{
          setValue: onChange,
          rawValues: getField(),
          value,
          onChange: e => onChange(entry, e)
        }} error={error}>
          <Style>
            <ArrayStep
              entry={entry}
              step={step}
              disabled={functionalProperty(entry, step.disabled)}
              values={getField(entry) || []}
              remove={idx => onChange(entry, [...getField(entry).filter((_, i) => i !== idx)])}
              append={newItem => onChange(entry, [...(getField(entry) || []), newItem])}
              component={(({ value, defaultValue, idx, classes }) => {
                return (
                  <Step
                    entry={`${entry}.${idx}`}
                    step={{
                      ...(schema[realEntry || entry]),
                      render: step.itemRender,
                      onChange: undefined,
                      array: false
                    }}
                    schema={schema}
                    inputWrapper={inputWrapper}
                    httpClient={httpClient}
                    onChange={onChange}
                    // defaultValue={props.defaultValue?.value}
                    value={value}
                    index={idx}
                    functionalProperty={functionalProperty}
                    getField={getField}
                    getErrorField={getErrorField}
                    getFieldState={getFieldState}
                    isSubmitted={isSubmitted}
                    classes={classes} />
                )
              })} />
          </Style>
        </CustomizableInput>
      )
    }

    const controlledProps = {
      functionalProperty,
      defaultValue,
      step,
      entry,
      error,
      errorDisplayed,
      getField,
      onChange: v => onChange(entry, v),
      value
    }

    // TMP 
    const typeStringSelect = ({ classes }) =>
      <SelectInput
        className={classNames(classes.flex_grow_1, { [classes.input__invalid]: errorDisplayed })}
        disabled={functionalProperty(entry, step.disabled)}
        possibleValues={step.options}
        httpClient={httpClient}
        isMulti={step.isMulti}
        createOption={step.createOption}
        transformer={step.transformer}
        buttons={step.format === format.buttonsSelect}
      />

    const typeNumberSelect = ({ classes }) => <SelectInput
      className={classNames(classes.content, { [classes.input__invalid]: errorDisplayed })}
      possibleValues={step.options}
      httpClient={httpClient}
      isMulti={step.isMulti}
      createOption={step.createOption}
      onCreateOption={step.onCreateOption}
      transformer={step.transformer}
      buttons={step.format === format.buttonsSelect}
    />

    const typeObjectSelect = ({ classes }) => <SelectInput
      className={classNames(classes.flex_grow_1, { [classes.input__invalid]: errorDisplayed })}
      possibleValues={step.options}
      httpClient={httpClient}
      isMulti={step.isMulti}
      createOption={step.createOption}
      onCreateOption={step.onCreateOption}
      transformer={step.transformer}
      buttons={step.format === format.buttonsSelect}
    />

    const uncontrolledInput = {
      [type.object]: [format.form, format.code],
      [type.json]: []
    }

    const components = {
      [type.string]: {
        [format.text]: ({ classes }) => <textarea type="text" className={classNames(classes.input, { [classes.input__invalid]: errorDisplayed })} />,
        [format.code]: ({ classes }) => <CodeInput className={classNames({ [classes.input__invalid]: errorDisplayed })} />,
        [format.singleLineCode]: ({ classes }) => <SingleLineCode className={classNames({ [classes.input__invalid]: errorDisplayed })} />,
        [format.markdown]: ({ classes }) => <MarkdownInput className={classNames({ [classes.input__invalid]: errorDisplayed })} />,
        [format.buttonsSelect]: typeStringSelect,
        [format.select]: typeStringSelect,
        default: ({ classes }) => <input
          type={step.format || 'text'}
          className={classNames(classes.input, { [classes.input__invalid]: errorDisplayed })}
        />
      },
      [type.number]: {
        [format.buttonsSelect]: typeNumberSelect,
        [format.select]: typeNumberSelect,
        default: ({ classes }) => <input
          type={step.format || 'number'}
          className={classNames(classes.input, { [classes.input__invalid]: errorDisplayed })}
        />
      },
      [type.bool]: {
        default: ({ classes }) => <BooleanInput className={classNames({ [classes.input__invalid]: errorDisplayed })} />
      },
      [type.object]: {
        [format.buttonsSelect]: typeObjectSelect,
        [format.select]: typeObjectSelect,
        [format.form]: () => {
          return (
            <CustomizableInput render={step.render} field={{
              parent,
              setValue: onChange,
              rawValues: getField(),
              value,
              onChange: e => onChange(entry, e)
            }}>
              <Style>
                <NestedForm
                  schema={step.schema}
                  flow={option(step.flow).getOrElse(option(step.schema).map(s => Object.keys(s)).getOrNull())}
                  step={step}
                  parent={entry}
                  grandparent={parent}
                  inputWrapper={inputWrapper}
                  maybeCustomHttpClient={httpClient}
                  index={index}
                  functionalProperty={functionalProperty}
                  errorDisplayed={errorDisplayed}
                  value={getField(entry)}
                  onChange={onChange}
                  getField={getField}
                  getErrorField={getErrorField}
                  getFieldState={getFieldState}
                  isSubmitted={isSubmitted}
                />
              </Style>
            </CustomizableInput>
          )
        },
        [format.code]: () =>
          <ControlledInput {...controlledProps} component={props => (
            <CodeInput
              {...props}
              className={classNames({ [props.classes.input__invalid]: error })}
              onChange={(e) => {
                let v
                try {
                  v = JSON.parse(e)
                } catch (err) {
                  v = e
                }
                props.onChange(v)
                option(step.onChange)
                  .map(onChange => onChange({
                    rawValues: getField(),
                    value,
                    setValue: onChange
                  }))
              }}
              value={props.value === null ? null : ((typeof props.value === 'object') ? JSON.stringify(props.value, null, 2) : props.value)}
            />
          )}>
          </ControlledInput>,
        default: ({ classes }) => <ObjectInput
          className={classNames({ [classes.input__invalid]: errorDisplayed })}
          possibleValues={step.options}
        />
      },
      [type.date]: {
        default: ({ classes }) => <DatePicker
          className={classNames(classes.datepicker, { [classes.input__invalid]: errorDisplayed })}
          formatStyle="large"
        />
      },
      [type.file]: {
        default: () => <FileInput />
      },
      [type.json]: {
        default: () => <ControlledInput {...controlledProps} component={props => (
          <CodeInput
            {...props}
            value={JSON.stringify(props.value, null, 2)}
            className={classNames({ [props.classes.input__invalid]: errorDisplayed })}
            onChange={e => {
              onChange(entry, JSON.parse(e))
              option(step.onChange)
                .map(onChange => onChange({ rawValues: getField(), value, setValue: onChange }))
            }}
          />
        )}>
        </ControlledInput>
      },
      default: () => null
    }

    const stepComponentType = components[step.type]

    if (!stepComponentType)
      return components.default()
    else {
      const stepComponentFormat = stepComponentType[step.format]

      const uncontrolledInputType = uncontrolledInput[step.type]
      const isUncontrolled = uncontrolledInputType && (uncontrolledInputType.length === 0 || (uncontrolledInputType.length > 0 && uncontrolledInputType.includes(step.format)))

      const component = stepComponentFormat ? stepComponentFormat : stepComponentType.default

      if (isUncontrolled)
        return <Style>
          {component()}
        </Style>
      else {
        return <Style>
          <ControlledInput {...controlledProps} component={props => {
            return React.cloneElement(component(props), { ...props })
          }} />
        </Style>
      }
    }
  }
}


class ArrayStep extends React.Component {
  render() {
    const { entry, step, component, disabled, append, values, remove, classes } = this.props;

    return <>
      {values.map((field, idx) => {
        const key = `${entry}${idx}`
        return (
          <div key={key}>
            <div className={classNames(classes.ai_center, classes.mt_5)} style={{ position: 'relative' }}>
              <div style={{ width: '95%' }}>
                {component({ key, value: field, idx, classes })}
              </div>
              <button type="button"
                style={{ position: 'absolute', top: '2px', right: 0 }}
                className={classNames(classes.btn, classes.btn_red, classes.btn_sm, classes.ml_5)} disabled={disabled} onClick={() => {
                  remove(idx)
                }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )
      })}
      <div className={classNames(classes.flex, classes.jc_flex_end)}>
        <button
          type="button"
          className={classNames(classes.btn, classes.btn_blue, classes.btn_sm, classes.mt_5)}
          disabled={disabled}
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()

            const newValue = getDefaultValues(step.flow, step.schema, {})
            append(step.addableDefaultValue || ((step.type === type.object && newValue) ? newValue : defaultVal()))
            option(step.onChange)
              .map(onChange => onChange({ rawValues: getField(), value, onChange }))
          }}>
          Add
        </button>
      </div>
    </>
  }
}

class NestedForm extends React.Component {
  state = {
    collapsed: !!this.props.step.collapsed,
    schemaAndFlow: undefined
  }

  componentDidMount() {
    this.loadSchemaAndFlow()
  }

  loadSchemaAndFlow = () => {
    this.setState({
      schemaAndFlow: this.calculateConditionalSchema()
    }, () => {
      this.props.onChange(this.props.parent, getDefaultValues(
        this.state.schemaAndFlow.flow,
        this.state.schemaAndFlow.schema,
        this.props.getField(this.props.parent)
      ), true)
    })
  }

  calculateConditionalSchema = () => option(this.props.step.conditionalSchema)
    .map(condiSchema => {
      let ref = option(condiSchema.ref)
        .map(ref => this.props.getField(ref))
        .getOrNull();

      if (!ref)
        ref = option(condiSchema.rawRef)
          .map(ref => this.props.getField(`${this.props.grandparent}.${ref}`))
          .getOrNull();

      const rawData = this.props.value

      const filterSwitch = condiSchema.switch.find(s => {
        if (typeof s.condition === 'function') {
          return s.condition({ rawData, ref })
        } else {
          return s.condition === ref
        }
      })

      const schemaAndFlow = option(filterSwitch)
        .orElse(condiSchema.switch.find(s => s.default))
        .getOrElse({ schema: {}, flow: [] })

      // console.log(this.props.getField, condiSchema, this.props, ref)

      return { schema: schemaAndFlow.schema, flow: schemaAndFlow.flow || Object.keys(schemaAndFlow.schema) }
    })
    .getOrElse({ schema: this.props.schema, flow: this.props.flow })

  componentDidUpdate(prevProps) {
    if (!deepEqual(this.calculateConditionalSchema().schema, this.state.schemaAndFlow.schema)) {
      this.loadSchemaAndFlow()
    }
  }

  render() {
    const {
      parent, inputWrapper, maybeCustomHttpClient,
      errorDisplayed, value, step, functionalProperty, index,
      getField, onChange, classes, getErrorField, isSubmitted, getFieldState
    } = this.props

    const { collapsed, schemaAndFlow } = this.state

    if (!schemaAndFlow)
      return null

    const computedSandF = schemaAndFlow.flow.reduce((acc, entry) => {
      const step = schemaAndFlow.schema[entry]

      const visibleStep = option(step)
        .map(s => s.visible)
        .map(visible => {
          switch (typeof visible) {
            case 'object':
              const value = getField(visible.ref);
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
          <ChevronDown
            size={30}
            className={classes.cursor_pointer}
            style={{ position: 'absolute', top: -35, right: 0, zIndex: 100 }}
            strokeWidth="2"
            onClick={() => this.setState({ collapsed: !collapsed })}
          />}
        {!!step.collapsable && schemaAndFlow.flow.length > 1 && !collapsed &&
          <ChevronUp size={30}
            className={classes.cursor_pointer}
            style={{ position: 'absolute', top: -35, right: 0, zIndex: 100 }}
            strokeWidth="2"
            onClick={() => this.setState({ collapsed: !collapsed })}
          />}

        {computedSandF.map(({ step, visibleStep, entry }, idx) => {
          if (!step && typeof entry === 'string') {
            console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
            return null;
          }

          // if ((collapsed && !step.visibleOnCollapse) || !visibleStep)
          //   return null

          return <Style key={`${entry}.${idx}`}>
            <BasicWrapper
              className={classNames({ [classes.display__none]: (collapsed && !step.visibleOnCollapse) || !visibleStep })}
              entry={`${parent}.${entry}`}
              label={functionalProperty(entry, step?.label === null ? null : step?.label || entry)} help={step.help} render={inputWrapper}
              fieldState={getFieldState(`${parent}.${entry}`)}
              error={getErrorField(`${parent}.${entry}`)}
              isSubmitted={isSubmitted}>
              <Step
                {...this.props}
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
                getErrorField={getErrorField}
                getField={getField}
                value={getField(`${parent}.${entry}`)}
                onChange={onChange}
              />
            </BasicWrapper>
          </Style>
        })}
      </div>
    )
  }
}


const Footer = ({ render, reset, valid, actions, classes }) => {

  if (render) {
    return render({ reset: reset, valid: valid })
  }

  const isSubmitDisplayed = actions?.submit?.display === undefined ? true : !!actions?.submit?.display

  return (
    <div className={`${classes.flex} ${classes.jc_end} ${classes.mt_5}`}>
      {actions?.cancel?.display && <button className={`${classes.btn} ${classes.btn_red}`} type="button" onClick={() => actions?.cancel.action()}>{actions?.cancel?.label || 'Cancel'}</button>}
      {actions?.reset?.display && <button className={`${classes.btn} ${classes.btn_red}`} type="button" onClick={reset}>{actions?.reset?.label || 'Reset'}</button>}
      {isSubmitDisplayed && <button className={`${classes.btn} ${classes.btn_green} ${classes.ml_10}`} type="submit">{actions?.submit?.label || 'Save'}</button>}
    </div>
  )
}