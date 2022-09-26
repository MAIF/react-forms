import React, { useEffect, useImperativeHandle, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import * as yup from "yup";


import { getShapeAndDependencies } from '../resolvers/index';
import { useHashEffect } from '../utils';
import { FlowObject, Schema, Option, Informations, TBaseObject } from './types';
import { cleanInputArray, cleanOutputArray, getDefaultValues } from './formUtils';
import { Watcher } from './watcher';
import { CollapsedStep, Step } from './step';
import { Footer } from './footer';

import '../style/style.scss';
import { type } from '../type';

type baseType = {[x: string]: any}



type Props<T extends unknown> = {
  data: T;
  children: React.ReactNode;
  onSubmit: (data: T) => void;
};

const MyForm = React.forwardRef(
  <T extends unknown>(props: Props<T>, ref: React.Ref<HTMLFormElement>) => {
      const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
          // onSubmit(...);
      };
      // some code here ...
      return (
          <form ref={ref} onSubmit={handleSubmit}>
              {props.children}
          </form>
      );
  }
);

// export default MyForm as <T extends unknown>(props: Props<T> & { ref: React.Ref<HTMLFormElement> })



type FormProps<DataType> = {
  schema: Schema,
  flow?: Array<string | FlowObject>,
  value?: DataType,
  inputWrapper?: (props: object) => JSX.Element,
  onSubmit: (obj: DataType) => void,
  onError?: (errors: Object, e?: React.BaseSyntheticEvent) => void,
  footer?: (props: { reset: () => void, valid: () => void }) => JSX.Element,
  className?: string,
  options?: Option
}

export interface FormRef {
  handleSubmit: () => void,
  trigger: () => void,
  methods: UseFormReturn & { data: () => any}
}









type TUser = {
  name: string,
  age: number,
} 

const user: TUser = {
  name: 'quentin',
  age: 35
}

const userSchema: Schema = {
  name: { type: type.string },
  age: { type: type.number}
}

function App() {
  const [count, setCount] = useState(0)


  return (
    <div className="App">
      <Form<TUser> 
        schema={userSchema}
        onSubmit={(d) => console.debug(d)}
        value={user}/>
    </div>
  )
}

const FormComponent = <T extends TBaseObject>(props: FormProps<T>, ref?: React.Ref<FormRef>) => {
  const { schema, flow, value, inputWrapper, onSubmit, onError = () => { }, footer, className, options = {} } = props

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
    mode: 'onChange',
    defaultValues: cleanInputArray<T>(value, defaultValues, flow, schema)
  });

  const [initialReseted, setReset] = useState(false)

  // useEffect(() => {
  //   reset(cleanInputArray(value, defaultValues, flow, schema))
  //   setReset(true)
  // }, [reset])

  const { handleSubmit, reset, trigger } = methods
  const { getValues }: { getValues: (param?: string | string[]) => any } = methods //todo:check after react-hook-form update if type is good


  useEffect(() => {
    if (!!options.showErrorsOnStart) {
      trigger();
    }
  }, [trigger, initialReseted])


  useHashEffect(() => {
    reset({ ...cleanInputArray(value, defaultValues, flow, schema) })
  }, [value, schema, flow])


  const functionalProperty = <T,>(entry: string, prop: T | ((param: { rawValues: { [x: string]: any }, value: any, informations?: Informations, getValue: (key: string) => any }) => T), informations?: Informations, error?: { [x: string]: any }): T => {
    if (typeof prop === 'function') {

      return (prop as Function)({ rawValues: getValues(), value: getValues(entry), informations, getValue: (key: string) => getValues(key), error });
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
      {(!!options.watch || !!options.autosubmit) && <Watcher
        options={options}
        control={methods.control}
        schema={schema}
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        onError={onError} />}
      <form
        className={className || `mrf-pr_15 mrf-w_100`}
        onSubmit={handleSubmit(data => {
          const clean = cleanOutputArray(data, schema)
          onSubmit(clean)
        }, onError)}>
        {formFlow.map((entry, idx) => {
          if (typeof entry === 'object') {
            return (
              <CollapsedStep key={idx}
                entry={entry}
                schema={schema}
                inputWrapper={inputWrapper}
                httpClient={maybeCustomHttpClient}
                functionalProperty={functionalProperty}
              />
            )
          }

          const step = schema[entry]

          if (!step && typeof entry === 'string') {
            console.error(`no step found for the entry "${entry}" in the given schema. Your form might not work properly. Please fix it`)
            return null;
          }

          const informations = { path: entry, key: entry }
          return (
            <Step key={idx} entry={entry} step={step}
              schema={schema} inputWrapper={inputWrapper}
              httpClient={maybeCustomHttpClient} functionalProperty={functionalProperty}
              informations={informations} />
          )
        })}
        <Footer render={footer} reset={() => reset(defaultValues)} valid={handleSubmit(data => onSubmit(cleanOutputArray(data, schema)), onError)} actions={options.actions} />
      </form>
    </FormProvider>
  )
}

export const Form = React.forwardRef(FormComponent) as
<T extends TBaseObject>(props: FormProps<T>, ref?: React.Ref<FormRef>) => React.ReactElement
