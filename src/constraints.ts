import * as yup from 'yup';
import Reference from "yup/lib/Reference";

export const required = (message: string = "Value required") => (r: yup.AnySchema) => r.required(message)

//string
export const url = (message: string = "That is not a valid url") => (r: yup.StringSchema) => r.url(message)
export const email = (message: string = "That is not a valid email") => (r: yup.StringSchema) => r.email(message)
export const uuid = (message: string = "That is not a valid uuid") => (r: yup.StringSchema) => r.uuid(message)
export const matches = (regexp: RegExp = /.*/, message: string = "This field does not match the pattern") => (r: yup.StringSchema) => r.matches(regexp, { message })

//string & number
export const min = (ref: number | Reference<number>, message: string = "Min value is required") => (r: yup.NumberSchema | yup.StringSchema) => r.min(ref, message)
export const max = (ref: number | Reference<number>, message: string = "Max value is required") => (r: yup.NumberSchema) => r.max(ref, message)

//number
export const positive = (message: string = "Positive value is required") => (r: yup.NumberSchema) => r.positive(message)
export const negative = (message: string = "Negative value is required") => (r: yup.NumberSchema) => r.negative(message)
export const integer = (message: string = "an integer please") => (r: yup.NumberSchema) => r.integer(message)
export const lessThan = (ref: number | Reference<number>, message: string = `This field must be less than ${ref}`) =>
  (r: yup.NumberSchema, key: string, dependencies: any) => {
    dependencies.push([key, ref])
    return r.lessThan(ref, message)
  }
export const moreThan = (ref: number | Reference<number>, message: string = `This field must be more than ${ref}`) =>
  (r: yup.NumberSchema, key: string, dependencies: any) => {
    dependencies.push([key, ref])
    return r.moreThan(ref, message)
  }

//array
export const length = (value: number, message: string = `The size of this collection must be ${value}`) => (r: yup.ArraySchema<yup.AnySchema>) => r.length(value, message)

// //file
export const supportedFormat = (arrayOfValues: string[], message: string = 'Unsupported File Format') => (r: yup.ObjectSchema<any, any, any, any>) => {
  const SUPPORTED_FORMATS = arrayOfValues.map(f => f.toLowerCase());
  return r.test('supportedFormat', message, (value: any) => {
    if (!value.length) return true
    return SUPPORTED_FORMATS.some(format => value[0].type.toLowerCase().includes(format))
  })
}
export const unsupportedFormat = (arrayOfValues: string[], message: string = 'Unsupported File Format') => (r: yup.ObjectSchema<any, any, any, any>) => {
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
export const test = (name: string, message: string = 'Test failed', test: (val: any) => boolean) => (r: yup.AnySchema) => r.test(name, message, test)
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
export const oneOf = (arrayOfValues: any[], message: string = `This value must be one of ${arrayOfValues.join(', ')}`) => (r: yup.AnySchema) => r.oneOf(arrayOfValues, message)

export const ref = (ref: string): Reference => yup.ref(ref)