import * as  React from "react";
import { ChangeEvent, ReactNode } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { ConditionnalSchema, SchemaEntry } from "./form";
import { option } from './Option';
import { type } from './type';
import { isDefined, cleanHash } from './utils';

const CustomizableInput = React.memo(
    (props: {
        field: {value: any, [x: string]: any},
        step: SchemaEntry,
        error: any, errorDisplayed: boolean,
        render?: ((props:{error: any, value: any, [x: string]: any}) => JSX.Element),
        children: JSX.Element,
        conditionalSchema?: ConditionnalSchema
    }) => {
        if (props.render) {
            return (
                props.render({ ...props.field, error: props.error })
            )
        }
        return props.children
    }, (prev, next) => {
        if (next.render || next.conditionalSchema) {
            return false
        }
        return (prev.field.value === next.field.value && next.errorDisplayed === prev.errorDisplayed  && cleanHash(next.step) === cleanHash(prev.step))
    }
)

interface BaseProps {
    step: SchemaEntry,
    entry: string,
    errorDisplayed?: boolean,
    component?: (field: {value: any, onChange: (e: ChangeEvent<HTMLInputElement>) => void}, props: object) => JSX.Element,
    children?: JSX.Element
}

interface ComponentProps extends BaseProps {
    component: (field: {value: any, onChange: (e: ChangeEvent<HTMLInputElement>) => void}, props: object) => JSX.Element,
}

interface ChildrenProps extends BaseProps {
    children: JSX.Element,
}

type Props = ComponentProps | ChildrenProps

export const ControlledInput = (inputProps: Props) => {
    const { step, entry, children, component, errorDisplayed = false } = inputProps;
    const { field } = useController({
        defaultValue: isDefined(step.defaultValue) ? step.defaultValue : null,
        name: entry
    })
    
    const { getValues, setValue, formState: { errors } } = useFormContext();

    const functionalProperty = (entry: string, prop: any) => {
        if (typeof prop === 'function') {
            return prop({ rawValues: getValues(), value: getValues(entry) });
        } else {
            return prop;
        }
    }

    const props = {
        ...field,
        ...step.props,
        id: entry,
        readOnly: functionalProperty(entry, step.disabled) ? 'readOnly' : null,
        placeholder: step.placeholder,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
            const value = (() => {
                if (!e) {
                    if (step.type === type.bool ||
                        (step.type === type.number && field.value === 0)) {
                        return e;
                    } else {
                        return null;
                    }
                } else if (e.target) {
                    return e.target.value || null;
                } else {
                    return e;
                }
            })()
            field.onChange(value)
            option(step.onChange)
                .map(onChange => onChange({ rawValues: getValues(), value, setValue }))
        },
        value: field.value
    }

    const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], errors)

    return <CustomizableInput
        render={step.render} step={step}
        field={{ parent, setValue: (key: string, value: any) => setValue(key, value), rawValues: getValues(), ...field }}
        error={error} errorDisplayed={errorDisplayed}>
        {component ? component(field, props) : React.cloneElement(children!, { ...props })}
    </CustomizableInput>
}