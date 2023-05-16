
import * as constraints from '../src/constraints';
import * as yup from 'yup';
import { getShapeAndDependencies } from '../src/resolvers';

const testArrayConstraints = (arrayConstraints = [], message, right, wrong, type) => {
  const schema = {
    test: {
      type,
      array: true,
      arrayConstraints
    }
  }

  const flow = ['test']

  const { shape, dependencies } = getShapeAndDependencies(flow, schema);
  const resolver = yup.object().shape(shape, dependencies);

  return resolver.validate(right)
    .then(r => {
      console.log({r})
      return expect(r).to.equal(right)})
    .then(() => resolver.validate(wrong))
    .catch(e => {
      console.warn({e})
      expect(e.errors[0]).to.equal(message)})
};

describe('Array resolver', () => {
  it('should resolve array constraints', () => {

    const errorMessage = "test must be a `array` type, but the final value was: `null` (cast from the value `\"fifou\"`).\n If \"null\" is intended as an empty value be sure to mark the schema as `.nullable()`";
    const testConstraints = []

    const right = { test: [1, 2, 3] }
    const wrong = { test: 'fifou' }


    return testArrayConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve min constraints', () => {

    const errorMessage = "min";
    const testConstraints = [
      constraints.min(3, errorMessage)
    ]

    const right = { test: [1, 2, 3, 4] }
    const wrong = { test: [1, 2] }

    return testArrayConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve max constraints', () => {

    const errorMessage = "max";
    const testConstraints = [
      constraints.max(3, errorMessage)
    ]

    const right = { test: [1, 2] }
    const wrong = { test: [1, 2, 3, 4] }

    return testArrayConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
  it('should resolve length constraints', () => {

    const errorMessage = "length";
    const testConstraints = [
      constraints.length(2, errorMessage)
    ]

    const right = { test: [1, 2] }
    const wrong = { test: [1] }

    return testArrayConstraints(testConstraints, errorMessage, right, wrong, 'number')
  })
})