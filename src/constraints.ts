import * as yup from 'yup';
import Reference from "yup/lib/Reference";

interface NumberReference {
  ref: number | Reference<number>,
  message: string
}
interface ArrayOfStringConstraint {
  arrayOfValues: string[],
  message: string
}
interface ArrayOfAnyConstraint {
  arrayOfValues: any[],
  message: string
}
interface TestConstraint {
  name: string,
  message: string,
  test: (val: any) => boolean
}
interface WhenConstraint {
  ref: string,
  test: (val: any) => boolean,
  then: any,
  otherwise: any,
} 

interface Ref {
  ref: string
}

export const required = (message = "Value required") => (r: yup.AnySchema) => r.required(message)

//string
export const url = (message: string = "That is not a valid url") => (r: yup.StringSchema) => r.url(message)
export const email = (message: string = "That is not a valid email") => (r: yup.StringSchema) => r.email(message)
export const uuid = (message: string = "That is not a valid uuid") => (r: yup.StringSchema) => r.uuid(message)
export const matches = (regexp: RegExp = /.*/, message = "This field does not match the pattern") => (r: yup.StringSchema) => r.matches(regexp, { message })

//string & number
export const min = (ref: number | Reference<number>, message = "Min value is required") => (r: yup.NumberSchema | yup.StringSchema) => r.min(maybeRef(ref), message)
export const max = (ref: number | Reference<number>, message = "Max value is required") => (r: yup.NumberSchema | yup.StringSchema) => r.max(maybeRef(ref), message)

//number
export const positive = (message: string = "Positive value is required") => (r: yup.NumberSchema) => r.positive(message)
export const negative = (message: string = "Negative value is required") => (r: yup.NumberSchema) => r.negative(message)
export const integer = (message: string = "an integer please") => (r: yup.NumberSchema) => r.integer(message)
export const lessThan = (ref: number | Reference<number>, message: string = `This field must be less than ${ref}`) =>
  (r: yup.NumberSchema, key: string, dependencies: any) => {
    if (typeof ref !== 'number') {
      dependencies.push([key, ref])
    }
    return r.lessThan(maybeRef(ref), message)
  }
export const moreThan = (ref: number | Reference<number>, message: string = `This field must be more than ${ref}`) =>
  (r: yup.NumberSchema, key: string, dependencies: any) => {
    if (typeof ref !== 'number') {
      dependencies.push([key, ref])
    }
    return r.moreThan(maybeRef(ref), message)
  }

//array
export const length = (ref: number | Reference<number>, message: string = `The size of this collection must be ${ref}`) => (r: yup.ArraySchema<yup.AnySchema>) => r.length(maybeRef(ref), message)

//file
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

export const maxSize = (ref: number | Reference<number>, message: string = `size is excedeed ${ref}`) => (r: yup.ObjectSchema<any, any, any, any>) => {
  return r.test('fileSize', message, (value) => {
    if (!value.length) return true
    return value[0].size <= maybeRef(ref)
  })
}

//mixed
export const nullable  = () => (r: yup.AnySchema) => r.nullable()
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
export const oneOf = (arrayOfValues: any[], message: string = `This value must be one of ${arrayOfValues.join(', ')}`) => (r: yup.AnySchema) => r.oneOf(arrayOfValues.map(maybeRef), message)

export const ref = (ref: string): Reference => yup.ref(ref)
const maybeRef = (x: any) => x?.ref ? ref(x.ref) : x



//### JSON method ###
export const jsonConstraints = {
  required: ({ message = "Value required" }) => required(message),
  url: ({ message = "That is not a valid url" }) => url(message),
  email: ({ message = "That is not a valid email" }) => email(message),
  uuid: ({ message = "That is not a valid uuid" }) => uuid(message),
  matches: ({ regexp = /.*/, message = "This field does not match the pattern" }) => matches(regexp, message),
  min: ({ ref, message = "Min value is required" }: NumberReference) => min(ref, message),
  max: ({ ref, message = "Max value is required" }: NumberReference) => max(ref, message),
  positive: ({ message = "Positive value is required" }) => positive(message),
  negative: ({ message = "Negative value is required" }) => negative(message),
  integer: ({ message = "an integer please" }) => integer(message),
  lessThan: ({ ref, message = `This field must be less than ${ref}` }: NumberReference) => lessThan(ref, message),
  moreThan: ({ ref, message = `This field must be more than ${ref}` }: NumberReference) => moreThan(ref, message),
  length: ({ ref, message = `The size of this collection must be ${ref}` }: NumberReference) => length(ref, message),
  supportedFormat: ({ arrayOfValues, message = 'Unsupported File Format' }: ArrayOfStringConstraint) => supportedFormat(arrayOfValues, message),
  unsupportedFormat: ({ arrayOfValues, message = 'Unsupported File Format' }: ArrayOfStringConstraint) => unsupportedFormat(arrayOfValues, message),
  maxSize: ({ ref, message = `size is excedeed ${ref}` }: NumberReference) => maxSize(ref, message),
  test: (c: TestConstraint) => test(c.name, c.message, c.test),
  when: ({ ref, test, then = [], otherwise = [] }: WhenConstraint) => when(ref, test, then, otherwise),
  oneOf: ({ arrayOfValues, message = `This value must be one of ${arrayOfValues.join(', ')}` }: ArrayOfAnyConstraint) => oneOf(arrayOfValues, message),
  ref: (val: Ref): Reference => ref(val.ref),
  nullable: () => nullable()
}