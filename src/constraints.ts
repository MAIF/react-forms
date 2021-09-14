import * as yup from 'yup';
import Reference from "yup/lib/Reference";

export const required = (message: string = "Ce champ est requis") => (r: yup.AnySchema) => r.required(message)

//string
export const url = (message: string = "not an url") => (r: yup.StringSchema) => r.url(message)
export const email = (message: string = "not an email") => (r: yup.StringSchema) => r.email(message)
export const uuid = (message: string = "not an uuid") => (r: yup.StringSchema) => r.uuid(message)
export const matches = (regexp: RegExp = /.*/, message: string = "not an email") => (r: yup.StringSchema) => r.matches(regexp, { message })

//string & number
export const min = (ref: number | Reference<number>, message: string = "trop petit") => (r: yup.NumberSchema | yup.StringSchema) => r.min(ref, message)
export const max = (ref: number | Reference<number>, message: string = "trop grand") => (r: yup.NumberSchema) => r.max(ref, message)

//number
export const positive = (message: string = "trop negatif") => (r: yup.NumberSchema) => r.positive(message)
export const negative = (message: string = "trop positif") => (r: yup.NumberSchema) => r.negative(message)
export const integer = (message: string = "an integer please") => (r: yup.NumberSchema) => r.integer(message)
export const lessThan = (ref: number | Reference<number>, message: string = `plus grand que ${ref}`) =>
  (r: yup.NumberSchema, key: string, dependencies: any) => {
    dependencies.push([key, ref])
    return r.lessThan(ref, message)
  }
export const moreThan = (ref: number | Reference<number>, message: string = `plus petit que ${ref}`) =>
  (r: yup.NumberSchema, key: string, dependencies: any) => {
    dependencies.push([key, ref])
    return r.moreThan(ref, message)
  }

//array
export const length = (value: number, message: string = `la taille doit etre ${value}`) => (r: yup.ArraySchema<yup.AnySchema>) => r.length(value, message)

// //file
export const supportedFormat = (arrayOfValues: String[], message: 'Unsupported File Format') => (r: yup.ObjectSchema<any, any, any, any>) => {
  const SUPPORTED_FORMATS = arrayOfValues.map(f => f.toLowerCase());
  return r.test('supportedFormat', message, (value: any) => {
    if (!value.length) return true
    return SUPPORTED_FORMATS.some(format => value[0].type.toLowerCase().includes(format))
  })
}
export const unsupportedFormat = (arrayOfValues: String[], message: 'Unsupported File Format') => (r: yup.ObjectSchema<any, any, any, any>) => {
  const UNSUPPORTED_FORMATS = arrayOfValues.map(f => f.toLowerCase());
  return r.test('unsupportedFormat', message, (value: any) => {
    if (!value.length) return true
    return UNSUPPORTED_FORMATS.some(format => value[0].type.toLowerCase().includes(format))
  })
}

export const maxSize = (value: number, message: string = `size is excedeed ${value}`) => (r: yup.ObjectSchema<any, any, any, any>) => {
  return r.test('fileSize', message, (value) => {
    if (!value.length) return true
    return value[0].size <= value
  })
}

//mixed
export const test = (name: string, message: string = 'test failed', test: (val: any) => boolean) => (r: yup.AnySchema) => r.test(name, message, test)
export const when = (ref: string, test: (val: any) => boolean, then: any = [], otherwise: any = []) => (r: yup.AnySchema, key: string, dependencies: any) => {
  // dependencies.push([key, ref])
  const thenReducer = then.reduce((resolver: yup.AnySchema, constraint: any) => {
    return constraint(resolver, key, dependencies)
  }, r)
  const otherWiseReducer = otherwise.reduce((resolver: yup.AnySchema, constraint: any) => {
    return constraint(resolver, key, dependencies)
  }, r)

  return r.when(ref, { is: test, then: thenReducer, otherwise: otherWiseReducer })
}
export const oneOf = (arrayOfValues: any[], message: string) => (r: yup.AnySchema) => r.oneOf(arrayOfValues, message)

export const ref = (ref: string): Reference => yup.ref(ref)