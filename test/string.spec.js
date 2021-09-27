import * as constraints from '../src/constraints';
import { testBasicConstraints } from './testUtils';

describe('String resolver', () => {
  it('should resolve string constraints', () => {

    const errorMessage = "test must be a `string` type, but the final value was: `42`.";
    const testConstraints = []

    const right = { test: 'fifou' }
    const wrong = { test: 42 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'string')
  })
  it('should resolve min constraints', () => { 
    
    const errorMessage = "not here";
    const testConstraints = [
      constraints.min(5, errorMessage)
    ]
    
    const right = {test: "fifou"}
    const wrong = {test: "foo"}

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'string')
  })

  it('should resolve max constraints', () => { 
    const errorMessage = "too long";
    const testConstraints = [
      constraints.max(5, errorMessage)
    ]

    const right = {test: "foo"}
    const wrong = {test: "fifou"}

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'string')
  })

  it('should resolve url constraints', () => { 
    const errorMessage = "not an url";
    const testConstraints = [
      constraints.url(errorMessage)
    ]

    const right = {test: "http://fifou.io"}
    const wrong = {test: "fifou"}

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'string')
  })

  it('should resolve email constraints', () => { 
    const errorMessage = "not an email";
    const testConstraints = [
      constraints.email(errorMessage)
    ]

    const right = {test: "fifou@foo.bar"}
    const wrong = {test: "fifou"}

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'string')
  })

  it('should resolve uuid constraints', () => { 
    const errorMessage = "not an uuid";
    const testConstraints = [
      constraints.uuid(errorMessage)
    ]

    const right = {test: "12345678-1234-1234-1234-1234567890123"}
    const wrong = {test: "fifou"}

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'string')
  })

  it('should resolve matches constraints', () => { 
    const errorMessage = "no matche";
    const testConstraints = [
      constraints.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,1000}$/, errorMessage)
    ]

    const right = {test: "F1f0u!"}
    const wrong = {test: "fifou"}

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'string')
  })
})