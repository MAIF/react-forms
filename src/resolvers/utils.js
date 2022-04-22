import * as yup from 'yup';
import { type } from '../type';
import { option } from '../Option'
import { jsonConstraints } from '../constraints';

const resolvers = {
  [type.string]: (typeErrorMessage) => yup.string().nullable().optional().typeError(typeErrorMessage || 'Value must be a string'),
  [type.number]: (typeErrorMessage) => yup.number().nullable().optional()
    .transform(v => { return isNaN(v) ? null : v})
    .typeError(typeErrorMessage || 'Value must be a number'),
  [type.bool]: () => yup.bool().nullable().optional(),
  [type.object]: () => yup.object().nullable().optional(),
  [type.date]: (typeErrorMessage) => yup.date().nullable().optional().typeError(typeErrorMessage || 'Value must be a date'),
  [type.file]: () => yup.mixed(),
  [type.json]: () => yup.mixed()
}

export const buildSubResolver = (props, key, dependencies, rawData) => {
  const { constraints = [] } = props;
  if (props.array || props.isMulti) {
    let subResolver;
    let arrayResolver = yup.array()

    if (props.schema && props.schema.type) {
      subResolver = buildSubResolver(props.schema, key, dependencies, rawData)
      arrayResolver = arrayResolver.of(subResolver)
    } else if (props.schema) {
      const deps = [];
      subResolver = yup.object().shape(getShapeAndDependencies(props.flow || Object.keys(props.schema), props.schema, deps, rawData).shape, deps);
      arrayResolver = arrayResolver.of(yup.object().shape({ value: subResolver }))
    }
    return constraints.reduce((resolver, constraint) => {
      return jsonOrFunctionConstraint(constraint, resolver, key, dependencies)
    }, arrayResolver)
  } else if (props.type === type.object && props.schema) {
    if (!Object.keys(props.schema).length) {
      return yup.object()
    }
    const subResolver = getShapeAndDependencies(props.flow || Object.keys(props.schema), props.schema, dependencies, rawData);
    return constraints.reduce((resolver, constraint) => {
      return jsonOrFunctionConstraint(constraint, resolver, key, dependencies)
    }, yup.object().shape(subResolver.shape, dependencies))
  } else if (props.type === type.object && props.conditionalSchema) {
    const { schema, flow } = option(props.conditionalSchema)
      .map(condiSchema => {
        const ref = option(condiSchema.ref).map(ref => rawData[ref]).getOrNull();

        const filterSwitch = condiSchema.switch.find(s => {
          if (typeof s.condition === 'function') {
            return s.condition({ rawData, ref })
          } else {
            return s.condition === ref
          }
        })

        return option(filterSwitch).getOrElse(condiSchema.switch.find(s => s.default))
      }).getOrElse({})
    const subResolver = getShapeAndDependencies(flow || Object.keys(schema), schema, dependencies, rawData);
    return constraints.reduce((resolver, constraint) => {
      return jsonOrFunctionConstraint(constraint, resolver, key, dependencies)
    }, yup.object().shape(subResolver.shape, dependencies))

  } else {
    return constraints.reduce((resolver, constraint) => {
      return jsonOrFunctionConstraint(constraint, resolver, key, dependencies)
    }, resolvers[props.type]())
  }
}

const jsonOrFunctionConstraint = (constraint, resolver, key, dependencies) => {
  if (typeof constraint === 'function') {
    return constraint(resolver, key, dependencies)
  } else {
    return jsonConstraints[constraint.type](constraint)(resolver, key, dependencies)
  }
}

export const getShapeAndDependencies = (flow, schema, dependencies = [], rawData) => {
  if (!Object.keys(schema).length) {
    return { shape: yup.object().shape({}), dependencies }
  }
  const shape = (flow || Object.keys(schema))
    .reduce((resolvers, key) => {

      if (typeof key === 'object') {
        return { ...resolvers, ...getShapeAndDependencies(key.flow, schema, dependencies, rawData).shape }
      }

      if (!schema[key]) {
        return resolvers
      }

      const resolver = buildSubResolver(schema[key], key, dependencies, rawData);
      return { ...resolvers, [key]: resolver }
    }, {})

  return { shape, dependencies }
}