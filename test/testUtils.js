import * as yup from 'yup';

import { getShapeAndDependencies } from '../src/resolvers';

export const testBasicConstraints = (constraints = [], message, right, wrong, type) => {
  const schema = {
    test: {
      type,
      constraints
    }
  }

  const flow = ['test']

  const { shape, dependencies } = getShapeAndDependencies(flow, schema);
  const resolver = yup.object().shape(shape, dependencies);

  // return Promise.all([
  //   resolver.isValid(right),
  //   resolver.isValid(wrong),
  // ]).then(([rR, rW]) => {
  //   expect(rR).to.equal(true)
  //   expect(rW).to.equal(false)
  // })

  return resolver.validate(right)
    .then(r => expect(r).to.equal(right))
    .then(() => resolver.validate(wrong))
    .catch(e => expect(e.errors[0]).to.equal(message))
};