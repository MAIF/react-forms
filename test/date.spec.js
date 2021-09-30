import * as constraints from '../src/constraints';
import { testBasicConstraints } from './testUtils';



describe('Date resolver', () => {
  //todo: test with string instead of number
  it('should resolve date constraints', () => {

    const errorMessage = "Value must be a date";
    const testConstraints = []
    const right = { test: new Date('November 3, 1985 23:15:30') }
    const wrong = { test: 'fifou' }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'date')
  })
  it('should resolve min constraints', () => {

    const errorMessage = "not min";
    const testConstraints = [
      constraints.min(new Date('November 2, 1985 23:15:30'), errorMessage)
    ]

    const right = { test: new Date('November 3, 1985 23:15:30') }
    const wrong = { test: new Date('November 1, 1985 23:15:30') }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'date')
  })
  it('should resolve max constraints', () => {

    const errorMessage = "not max";
    const testConstraints = [
      constraints.max(new Date('November 2, 1985 23:15:30'), errorMessage)
    ]

    const right = { test: new Date('November 1, 1985 23:15:30') }
    const wrong = { foo: new Date('November 3, 1985 23:15:30') }

    return testBasicConstraints(testConstraints, errorMessage, right, wrong, 'date')
  })
})