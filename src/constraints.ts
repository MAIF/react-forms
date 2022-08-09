import * as yup from 'yup';
import { AnySchema, ArraySchema, NumberSchema, StringSchema, TestFunction } from 'yup';
import Reference from 'yup/lib/Reference';



/* FIXME precise */
export type Constraint = (resolver: any, key: string, dependencies: any[]) => AnySchema
type NumberRef = Reference<number> | number


export const required = (message = "Value required") => (r: AnySchema) => r.required(message)

//string
export const url = (message = "That is not a valid url") => (r: StringSchema) => r.url(message)
export const email = (message = "That is not a valid email") => (r: StringSchema) => r.email(message)
export const uuid = (message = "That is not a valid uuid") => (r: StringSchema) => r.uuid(message)
export const matches = (regexp = /.*/, message = "This field does not match the pattern") => (r: StringSchema) => r.matches(regexp, { message, excludeEmptyString: true })



//string & number
export const min = (ref: NumberRef, message = "Min value is required") => (r: StringSchema| NumberSchema) => r.min(maybeRef(ref), message)
export const max = (ref: NumberRef, message = "Max value is required") => (r: StringSchema| NumberSchema) => r.max(maybeRef(ref), message)

//number
export const positive = (message = "Positive value is required") => (r: NumberSchema) => r.positive(message)
export const negative = (message = "Negative value is required") => (r: NumberSchema) => r.negative(message)
export const integer = (message = "an integer please") => (r: NumberSchema) => r.integer(message)
export const lessThan = (ref: NumberRef, message = `This field must be less than ${ref}`) =>
  (r: NumberSchema, key: any/* FIXME */, dependencies: Array<[any, Reference]>) => {
    if (typeof ref !== 'number') {
      dependencies.push([key, ref])
    }
    return r.lessThan(maybeRef(ref), message)
  }
export const moreThan = (ref: NumberRef, message = `This field must be more than ${ref}`) =>
  (r: NumberSchema, key: any, dependencies: Array<[any, Reference]>) => {
    if (typeof ref !== 'number') {
      dependencies.push([key, ref])
    }
    return r.moreThan(maybeRef(ref), message)
  }

//array
export const length = (ref: NumberRef, message = `The size of this collection must be ${ref}`) => (r: ArraySchema<any>) => r.length(maybeRef(ref), message)

//file
export const supportedFormat = (arrayOfValues: string[], message = 'Unsupported File Format') => (r: AnySchema /* TODO check */) => {
  const SUPPORTED_FORMATS = arrayOfValues.map(f => f.toLowerCase());
  return r.test('supportedFormat', message, (value) => {
    if (!value.length) return true
    return SUPPORTED_FORMATS.some(format => value[0].type.toLowerCase().includes(format))
  })
}
export const unsupportedFormat = (arrayOfValues: string[], message = 'Unsupported File Format') => (r: AnySchema) => {
  const UNSUPPORTED_FORMATS = arrayOfValues.map(f => f.toLowerCase());
  return r.test('unsupportedFormat', message, (value) => {
    if (!value.length) return true
    return UNSUPPORTED_FORMATS.some(format => value[0].type.toLowerCase().includes(format))
  })
}

export const maxSize = (ref: Reference, message = `size is excedeed ${ref}`) => (r: AnySchema) => {
  return r.test('fileSize', message, (value) => {
    if (!value.length) return true
    return value[0].size <= maybeRef(ref)
  })
}

//mixed
export const test = (name: string, message = 'Test failed', test: TestFunction<any, object>) => (r: AnySchema) => r.test(name, message, test)
export const when = (ref: string, test: TestFunction<any, object>, then: Constraint[] = [], otherwise: Constraint[] = []) => (r: AnySchema, key: string, dependencies:any[]) => {
  // dependencies.push([key, ref])
  const thenReducer = then.reduce((resolver, constraint) => {
    return constraint(resolver, key, dependencies)
  }, r)
  const otherWiseReducer = otherwise.reduce((resolver, constraint) => {
    return constraint(resolver, key, dependencies)
  }, r)

  return r.when(ref, { is: test, then: thenReducer, otherwise: otherWiseReducer })
}
export const oneOf = (arrayOfValues: any[], message = `This value must be one of ${arrayOfValues.join(', ')}`) => (r: AnySchema) => r.oneOf(arrayOfValues.map(maybeRef), message)

//todo: rename by notOneOf
export const blacklist = (arrayOfValues: any[], message = `This value can't include the following values ${arrayOfValues.join(', ')}`) => (r: AnySchema) => r.test('blacklist', message, value => {
  return !arrayOfValues.some(f => (value || '').includes(f))
})

export const ref = <T>(ref: string) => yup.ref<T>(ref)
const maybeRef = <T,>(x: Reference<T> | any) => x?.ref ? ref(x.ref) : x



//### JSON method ###
export const jsonConstraints: Record<string, any> = {
  required: ({ message = "Value required" }) => required(message),
  url: ({ message = "That is not a valid url" }) => url(message),
  email: ({ message = "That is not a valid email" }) => email(message),
  uuid: ({ message = "That is not a valid uuid" }) => uuid(message),
  matches: ({ regexp = /.*/, message = "This field does not match the pattern" }) => matches(regexp, message),
  min: ({ ref, message = "Min value is required" }: {ref: NumberRef, message: string}) => min(ref, message),
  max: ({ ref, message = "Max value is required" }: {ref: NumberRef, message: string}) => max(ref, message),
  positive: ({ message = "Positive value is required" }) => positive(message),
  negative: ({ message = "Negative value is required" }) => negative(message),
  integer: ({ message = "an integer please" }) => integer(message),
  lessThan: ({ ref, message = `This field must be less than ${ref}` }:{ref: NumberRef, message: string}) => lessThan(ref, message),
  moreThan: ({ ref, message = `This field must be more than ${ref}` }:{ref: NumberRef, message: string}) => moreThan(ref, message),
  length: ({ ref, message = `The size of this collection must be ${ref}` }:{ref: NumberRef, message: string}) => length(ref, message),
  supportedFormat: ({ arrayOfValues, message = 'Unsupported File Format' }: { arrayOfValues: any[], message:string }) => supportedFormat(arrayOfValues, message),
  unsupportedFormat: ({ arrayOfValues, message = 'Unsupported File Format' }: { arrayOfValues: any[], message:string }) => unsupportedFormat(arrayOfValues, message),
  maxSize: ({ ref, message = `size is excedeed ${ref}` }: {ref: Reference, message: string}) => maxSize(ref, message),
  test: (c: {name: string, message: string, test:TestFunction<any, object>}) => test(c.name, c.message, c.test),
  when: ({ ref, test, then = [], otherwise = [] }: {ref: string, test:TestFunction<any, object>, then: Constraint[], otherwise: Constraint[]}) => when(ref, test, then, otherwise),
  oneOf: ({ arrayOfValues, message = `This value must be one of ${arrayOfValues.join(', ')}` }: { arrayOfValues: any[], message:string }) => oneOf(arrayOfValues, message),
  blacklist: ({ arrayOfValues, message = `This value can't include the following values ${arrayOfValues.join(', ')}` }: { arrayOfValues: any[], message:string }) => blacklist(arrayOfValues, message),
  ref: (val: {ref: string}) => ref(val.ref)
} as const

export type TConstraintType = keyof typeof jsonConstraints
