import { useEffect, useRef } from "react";
import * as yup from "yup";

import { option } from "../Option";
import { getShapeAndDependencies } from "../resolvers";
import { type } from "../type";
import { arrayFlatten, isDefined } from "../utils";
import { Flow, FlowObject, Informations, Schema, SchemaRenderType, TBaseObject } from "./types";

export const usePrevious = (value: any) => {
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

export const defaultVal = (value?: any, array?: boolean, defaultValue?: any, type?: any) => {
  if (isDefined(defaultValue)) return defaultValue
  if (array) return []
  return value
}

export function getDefaultValues(flow?: Flow, schema?: Schema, value?: any): object {
  if (!schema){
    return {};
  }
  return (flow || Object.keys(schema)).reduce((acc: object, key: string | FlowObject) => {
    if (typeof key === 'object') {
      return { ...acc, ...getDefaultValues(key.flow, schema, value) }
    }
    const entry = schema[key]
    if (!entry) { return acc }
    if (entry.schema && !entry.array) {
      return {...acc, [key]: entry.defaultValue || getDefaultValues(entry.flow, entry.schema)}
    }
    return { ...acc, [key]: defaultVal(value ? value[key] : null, entry.array || entry.isMulti || false, entry.defaultValue) }
  }, {})
}

export const cleanInputArray = <T extends TBaseObject>(value?: T, defaultValues: { [x: string]: any } = {}, flow?: Flow, subSchema?: Schema): object => {
  const realFlow = option(flow)
    .map(f => f.map(v => typeof v === 'object' ? v.flow : v))
    .map(arrayFlatten)
    .getOrElse(Object.keys(subSchema || {}))

  return Object.entries(subSchema || {})
    .filter(([key]) => realFlow.includes(key))
    .reduce((acc, [key, step]) => {
      let v: any = null;
      if (value) {
        v = value[key];
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
      } else if (v !== null && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) {
        return { ...acc, [key]: cleanInputArray(value?.[key], defaultValues?.[key], subSchema?.[key]?.flow, subSchema?.[key]?.schema || {}) }
      } else {
        return { ...acc, [key]: v === undefined ? (Array.isArray(v) ? [] : null) : v }
      }
    }, value || {})
}

export const cleanOutputArray = (obj: any, subSchema: Schema): any => {
  if (!obj || typeof obj !== 'object' || obj instanceof (Date) || Array.isArray(obj)) {
    return obj
  }

  return Object.entries(obj as object).reduce((acc, curr) => {
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


export function extractFlowString(entry: FlowObject): string[] {
  return entry.flow.map(eitherStringOrObject => {
    if (typeof eitherStringOrObject === "string") {
      return eitherStringOrObject;
    } else {
      return extractFlowString(eitherStringOrObject)
    }
  }).flat()
}