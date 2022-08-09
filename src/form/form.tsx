import React, { useEffect, useImperativeHandle, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import * as yup from "yup";


import { getShapeAndDependencies } from '../resolvers/index';
import { useHashEffect } from '../utils';
import { FlowObject, Schema, Option, Informations } from './types';
import { cleanInputArray, cleanOutputArray, getDefaultValues } from './formUtils';
import { Watcher } from './watcher';
import { CollapsedStep, Step } from './step';
import { Footer } from './footer';

import '../style/style.scss';

type FormProps = {
  schema: Schema,
  flow?: Array<string | FlowObject>,
  value?: object,
  inputWrapper?: (props: object) => JSX.Element,
  onSubmit: (obj: { [x: string]: any }) => void,
  onError?: () => void,
  footer?: (props: { reset: () => void, valid: () => void }) => JSX.Element,
  style?: object,
  className?: string,
  options?: Option
}

export interface FormRef {
  handleSubmit: () => void,
  trigger: () => void,
  methods: UseFormReturn & { data: () => any}
}


export const Form = React.forwardRef<FormRef, FormProps>(function Form(
  { schema, flow, value, inputWrapper, onSubmit, onError = () => {/* default is nothing */ }, footer, style = {}, className, options = {} }, ref) {

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
    defaultValues: cleanInputArray(value, defaultValues, flow, schema)
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
})

