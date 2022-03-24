import * as yup from 'yup';

export const required = (message = "Value required") => (r) => r.required(message)

//string
export const url = (message = "That is not a valid url") => (r) => r.url(message)
export const email = (message = "That is not a valid email") => (r) => r.email(message)
export const uuid = (message = "That is not a valid uuid") => (r) => r.uuid(message)
export const matches = (regexp = /.*/, message = "This field does not match the pattern") => (r) => r.matches(regexp, { message })

//string & number
export const min = (ref, message = "Min value is required") => (r) => r.min(maybeRef(ref), message)
export const max = (ref, message = "Max value is required") => (r) => r.max(maybeRef(ref), message)

//number
export const positive = (message = "Positive value is required") => (r) => r.positive(message)
export const negative = (message = "Negative value is required") => (r) => r.negative(message)
export const integer = (message = "an integer please") => (r) => r.integer(message)
export const lessThan = (ref, message = `This field must be less than ${ref}`) =>
  (r, key, dependencies) => {
    if (typeof ref !== 'number') {
      dependencies.push([key, ref])
    }
    return r.lessThan(maybeRef(ref), message)
  }
export const moreThan = (ref, message = `This field must be more than ${ref}`) =>
  (r, key, dependencies) => {
    if (typeof ref !== 'number') {
      dependencies.push([key, ref])
    }
    return r.moreThan(maybeRef(ref), message)
  }

//array
export const length = (ref, message = `The size of this collection must be ${ref}`) => (r) => r.length(maybeRef(ref), message)

//file
export const supportedFormat = (arrayOfValues, message = 'Unsupported File Format') => (r) => {
  const SUPPORTED_FORMATS = arrayOfValues.map(f => f.toLowerCase());
  return r.test('supportedFormat', message, (value) => {
    if (!value.length) return true
    return SUPPORTED_FORMATS.some(format => value[0].type.toLowerCase().includes(format))
  })
}
export const unsupportedFormat = (arrayOfValues, message = 'Unsupported File Format') => (r) => {
  const UNSUPPORTED_FORMATS = arrayOfValues.map(f => f.toLowerCase());
  return r.test('unsupportedFormat', message, (value) => {
    if (!value.length) return true
    return UNSUPPORTED_FORMATS.some(format => value[0].type.toLowerCase().includes(format))
  })
}

export const maxSize = (ref, message = `size is excedeed ${ref}`) => (r) => {
  return r.test('fileSize', message, (value) => {
    if (!value.length) return true
    return value[0].size <= maybeRef(ref)
  })
}

//mixed
export const nullable = () => (r) => r.nullable().optional()
export const test = (name, message = 'Test failed', test) => (r) => r.test(name, message, test)
export const when = (ref, test, then = [], otherwise = []) => (r, key, dependencies) => {
  // dependencies.push([key, ref])
  const thenReducer = then.reduce((resolver, constraint) => {
    return constraint(resolver, key, dependencies)
  }, r)
  const otherWiseReducer = otherwise.reduce((resolver, constraint) => {
    return constraint(resolver, key, dependencies)
  }, r)

  return r.when(ref, { is: test, then: thenReducer, otherwise: otherWiseReducer })
}
export const oneOf = (arrayOfValues, message = `This value must be one of ${arrayOfValues.join(', ')}`) => (r) => r.oneOf(arrayOfValues.map(maybeRef), message)

export const ref = (ref) => yup.ref(ref)
const maybeRef = (x) => x?.ref ? ref(x.ref) : x



//### JSON method ###
export const jsonConstraints = {
  required: ({ message = "Value required" }) => required(message),
  url: ({ message = "That is not a valid url" }) => url(message),
  email: ({ message = "That is not a valid email" }) => email(message),
  uuid: ({ message = "That is not a valid uuid" }) => uuid(message),
  matches: ({ regexp = /.*/, message = "This field does not match the pattern" }) => matches(regexp, message),
  min: ({ ref, message = "Min value is required" }) => min(ref, message),
  max: ({ ref, message = "Max value is required" }) => max(ref, message),
  positive: ({ message = "Positive value is required" }) => positive(message),
  negative: ({ message = "Negative value is required" }) => negative(message),
  integer: ({ message = "an integer please" }) => integer(message),
  lessThan: ({ ref, message = `This field must be less than ${ref}` }) => lessThan(ref, message),
  moreThan: ({ ref, message = `This field must be more than ${ref}` }) => moreThan(ref, message),
  length: ({ ref, message = `The size of this collection must be ${ref}` }) => length(ref, message),
  supportedFormat: ({ arrayOfValues, message = 'Unsupported File Format' }) => supportedFormat(arrayOfValues, message),
  unsupportedFormat: ({ arrayOfValues, message = 'Unsupported File Format' }) => unsupportedFormat(arrayOfValues, message),
  maxSize: ({ ref, message = `size is excedeed ${ref}` }) => maxSize(ref, message),
  test: (c) => test(c.name, c.message, c.test),
  when: ({ ref, test, then = [], otherwise = [] }) => when(ref, test, then, otherwise),
  oneOf: ({ arrayOfValues, message = `This value must be one of ${arrayOfValues.join(', ')}` }) => oneOf(arrayOfValues, message),
  ref: (val) => ref(val.ref),
  nullable: () => nullable()
}