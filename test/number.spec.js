import * as constraints from '../src/constraints';
import { testBasicConstraints } from './testUtils';

describe('Number resolver', () => {
  it('should resolve number constraints', () => {

    const errorMessage = "Value must be a number";
    const testConstraints = []

    const right = { test: 1 }
    const wrong = { test: 'fifou' }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve integer constraints', () => {

    const errorMessage = "not integer";
    const testConstraints = [
      constraints.integer(errorMessage)
    ]

    const right = { test: 42 }
    const wrong = { test: 1.2 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve positive constraints', () => {

    const errorMessage = "not positive";
    const testConstraints = [
      constraints.positive(errorMessage)
    ]

    const right = { test: 42 }
    const wrong = { test: -42 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve negative constraints', () => {

    const errorMessage = "not negative";
    const testConstraints = [
      constraints.negative(errorMessage)
    ]

    const right = { test: -42 }
    const wrong = { test: 42 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve min constraints', () => {

    const errorMessage = "there is a min condition";
    const testConstraints = [
      constraints.min(40, errorMessage)
    ]

    const right = { test: 42 }
    const wrong = { test: 2 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve max constraints', () => {

    const errorMessage = "there is a max condition";
    const testConstraints = [
      constraints.max(44, errorMessage)
    ]

    const right = { test: 42 }
    const wrong = { test: 45 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve moreThan constraints with ref', () => {

    const errorMessage = "not more than value";
    const testConstraints = [
      constraints.moreThan(constraints.ref('value'), errorMessage)
    ]

    const right = { test: 42, value: 40 }
    const wrong = { test: 38, value: 40 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve moreThan constraints', () => {

    const errorMessage = "not more than value";
    const testConstraints = [
      constraints.moreThan(40, errorMessage)
    ]

    const right = { test: 42 }
    const wrong = { test: 38 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve lessThan constraints with ref', () => {

    const errorMessage = "not less than value";
    const testConstraints = [
      constraints.lessThan(constraints.ref('value'), errorMessage)
    ]

    const right = { test: 42, value: 44 }
    const wrong = { test: 46, value: 44 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve lessThan constraints', () => {

    const errorMessage = "not less than value";
    const testConstraints = [
      constraints.lessThan(44, errorMessage)
    ]

    const right = { test: 42 }
    const wrong = { test: 46 }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
})

