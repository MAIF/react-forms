import * as yup from 'yup';
import { type } from '../type';
import { option } from '../Option'
import { Constraint, jsonConstraints, TConstraintType } from '../constraints';
import { Flow, Schema, SchemaEntry } from '../form/types';
import { ObjectShape } from 'yup/lib/object';

const resolvers = {
  [type.string]: (typeErrorMessage?: string) => yup.string().nullable().optional().typeError(typeErrorMessage || 'Value must be a string'),
  [type.number]: (typeErrorMessage?: string) => yup.number().nullable().optional()
    .transform(v => { return isNaN(v) ? null : v })
    .typeError(typeErrorMessage || 'Value must be a number'),
  [type.bool]: () => yup.bool().nullable().optional(),
  [type.object]: () => yup.object().nullable().optional(),
  [type.date]: (typeErrorMessage?: string) => yup.date().nullable().optional().typeError(typeErrorMessage || 'Value must be a date'),
  [type.file]: () => yup.mixed(),
  [type.json]: () => yup.mixed()
}

export const buildSubResolver = (props: SchemaEntry, key: string, dependencies: Array<[string, string]>, rawValues: { [x: string]: any }): yup.AnySchema => {
  const { constraints = [] } = props;
  if (props.array || props.isMulti) {
    let subResolver;
    let arrayResolver = yup.array().nullable().optional()

    if (props.schema) {
      const deps: Array<[string, string]> = [];
      subResolver = yup.object().shape(getShapeAndDependencies(props.flow || Object.keys(props.schema), props.schema, deps, rawValues).shape, deps);
      arrayResolver = arrayResolver.of(yup.object().shape({ value: subResolver }))
    } else if (props.constraints?.length) {
      subResolver = props.constraints.reduce((resolver, constraint) => {
        return jsonOrFunctionConstraint(constraint, resolver, key, dependencies)
      }, resolvers[props.type]())

      arrayResolver = arrayResolver.of(yup.object().shape({value: subResolver}))
    }

    if (props.arrayConstraints?.length) {
      arrayResolver = props.arrayConstraints.reduce((resolver, constraint) => {
        return jsonOrFunctionConstraint(constraint, resolver, key, dependencies)
      }, arrayResolver)
    }

    return arrayResolver
  } else if (props.type === type.object && props.schema) {
    if (!Object.keys(props.schema).length) {
      return yup.object().nullable().optional()
    }
    const subResolver = getShapeAndDependencies(props.flow || Object.keys(props.schema), props.schema, dependencies, rawValues);
    return constraints.reduce((resolver, constraint) => {
      return jsonOrFunctionConstraint(constraint, resolver, key, dependencies)
    }, yup.object().nullable().optional().shape(subResolver.shape, dependencies))
  } else if (props.type === type.object && props.conditionalSchema) {
    const { schema, flow } = option(props.conditionalSchema)
      .map(condiSchema => {
        const ref = option(condiSchema.ref).map(ref => rawValues[ref]).getOrNull();

        const filterSwitch = condiSchema.switch.find(s => {
          if (typeof s.condition === 'function') {
            return s.condition({ rawValues, ref }) /* FIXME rawData vs rowValue */
          } else {
            return s.condition === ref
          }
        })

        return option(filterSwitch)
          .orElse(condiSchema.switch.find(s => s.default))
          .getOrElse({ schema: {}, flow: [] })

      })
      .getOrElse({ schema: {}, flow: [] })

    const realFlow = flow || Object.keys(schema)
    const subResolver = getShapeAndDependencies(flow || Object.keys(schema), schema, dependencies, rawValues);
    return constraints.reduce((resolver, constraint) => {
      return jsonOrFunctionConstraint(constraint, resolver, key, dependencies)
    }, yup.object().nullable().optional().shape(subResolver.shape, dependencies))
  } else {
    return constraints.reduce((resolver, constraint) => {
      return jsonOrFunctionConstraint(constraint, resolver, key, dependencies)
    }, resolvers[props.type]())
  }
}

const jsonOrFunctionConstraint = (constraint: Constraint | { type: TConstraintType }, resolver: yup.AnySchema, key: string, dependencies: Array<[string, string]>) => {
  if (typeof constraint === 'function') {
    return constraint(resolver, key, dependencies)
  } else {
    // TODO
    return (jsonConstraints[constraint.type])(constraint)(resolver, key, dependencies)
  }
}

export const getShapeAndDependencies = (flow: Flow, schema: Schema, dependencies: Array<[string, string]> = [], rawData: object = {}): { shape: ObjectShape, dependencies: Array<[string, string]> } => {
  if (!Object.keys(schema).length) {
    return { shape: {}, dependencies }
  }
  const shape: ObjectShape = (flow || Object.keys(schema))
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