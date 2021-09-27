
import * as constraints from '../src/constraints';
import { testBasicConstraints } from './testUtils';


describe('Boolean resolver', () => {
  it('should resolve boolean constraints', () => {

    const errorMessage = "test must be a `boolean` type, but the final value was: `\"fifou\"`.";
    const testConstraints = []

    const right = { test: true }
    const wrong = { test: 'fifou' }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'bool')
  })
  it('should resolve required constraints', () => {

    const errorMessage = "required";
    const testConstraints = [
      constraints.required(errorMessage)
    ]

    const right = { test: true }
    const wrong = { foo: false }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'bool')
  })
})