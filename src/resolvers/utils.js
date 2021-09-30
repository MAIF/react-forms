import * as yup from 'yup';
import { types } from '../types';

const resolvers = {
  [types.string]: () => yup.string(),
  [types.number]: (typeErrorMessage) => yup.number().typeError(typeErrorMessage || 'Value must be a number'),
  [types.bool]: () => yup.bool(),
  [types.object]: () => yup.object(),
  [types.date]: (typeErrorMessage) => yup.date().typeError(typeErrorMessage || 'Value must be a date'),
  [types.file]: () => yup.mixed()
}

export const buildSubResolver = (props, key, dependencies) => {
  const { type, constraints = [] } = props;
  if (props.format === 'array' || props.format === 'forms' || props.isMulti) {
    let subResolver;
    let arrayResolver = yup.array()

    if (props.schema && props.schema.type) {
      subResolver = buildSubResolver(props.schema, key, dependencies) //todo: ca peut pas marcher non ?
      arrayResolver = arrayResolver.of(subResolver)
    } else if (props.schema) {
      const deps = [];
      subResolver = yup.object().shape(getShapeAndDependencies(props.flow || Object.keys(props.schema), props.schema, deps).shape, deps);
      arrayResolver = arrayResolver.of(subResolver)
    }
    return constraints.reduce((resolver, constraint) => {
      return constraint(resolver, key, dependencies)
    }, arrayResolver)
  } else if (props.type === types.object && props.schema) {
    const subResolver = getShapeAndDependencies(props.flow || Object.keys(props.schema), props.schema, dependencies);
    return constraints.reduce((resolver, constraint) => {
      return constraint(resolver, key, dependencies)
    }, yup.object().shape(subResolver.shape, dependencies))
  } else {
    return constraints.reduce((resolver, constraint) => {
      return constraint(resolver, key, dependencies)
    }, resolvers[type]())
  }
}

export const getShapeAndDependencies = (flow, schema, dependencies = []) => {
  const shape = (flow || Object.keys(schema))
    .reduce((resolvers, key) => {
      // if (typeof schema[key].type === 'object') {
      //   return { ...resolvers, ...getShapeAndDependencies(key.flow || Object.keys(key.schema), key.schema, dependencies).shape }
      // }
      const resolver = buildSubResolver(schema[key], key, dependencies);
      return { ...resolvers, [key]: resolver }
    }, {})

  return { shape, dependencies }
}