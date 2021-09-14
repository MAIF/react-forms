import * as yup from 'yup';
import { Types } from '../types';

const resolvers = {
  [Types.string]: () => yup.string(),
  [Types.number]: () => yup.number(),
  [Types.bool]: () => yup.bool(),
  [Types.object]: () => yup.object(),
  [Types.date]: () => yup.date(),
  [Types.file]: () => yup.mixed()
}

export const buildSubResolver = (props, key, dependencies) => {
  const { type, constraints = [] } = props;
  if (props.format === 'array' || props.isMulti) {
    let subResolver;
    let arrayResolver = yup.array()

    if (props.schema && props.schema.type) {
      subResolver = buildSubResolver(props.schema, key, dependencies)
      arrayResolver = arrayResolver.of(subResolver)
    } else if (props.schema) {
      subResolver = yup.object().shape(getShapeAndDependencies(Object.keys(props.schema), props.schema, dependencies), dependencies);
      arrayResolver = arrayResolver.of(subResolver)
    }
    return constraints.reduce((resolver, constraint) => {
      return constraint(resolver, key, dependencies)
    }, arrayResolver)
  } else {
    return constraints.reduce((resolver, constraint) => {
      return constraint(resolver, key, dependencies)
    }, resolvers[type]())
  }
}

export const getShapeAndDependencies = (flow, schema, dependencies = []) => {
  const shape = flow.reduce((resolvers, key) => {
    if (typeof key === 'object') {
      return { ...resolvers, ...getShapeAndDependencies(key.flow, schema, dependencies).shape }
    }
    const resolver = buildSubResolver(schema[key], key, dependencies);
    return { ...resolvers, [key]: resolver }
  }, {})

  return { shape, dependencies }
}