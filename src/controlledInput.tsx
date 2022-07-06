import * as  React from "react";
import { ChangeEvent } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { ConditionnalSchema, Informations, SchemaEntry, SchemaRenderType } from "./form";
import { option } from './Option';
import { type } from './type';
import { isDefined, cleanHash } from './utils';

const CustomizableInput = React.memo(
    (props: {
        field: { rawValues?: any, value?: any, onChange?: (param: object) => void, error?: boolean, getValue: (entry: string) => any, setValue?: (key: string, data: any) => void},
        step: SchemaEntry,
        error: any, errorDisplayed: boolean,
        render?: SchemaRenderType,
        children: JSX.Element,
        conditionalSchema?: ConditionnalSchema,
        informations?: Informations
    }) => {
        if (props.render) {
            return (
                props.render({ ...props.field, error: props.error, informations: props.informations })
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
    children?: JSX.Element,
    informations?: Informations
}

interface ComponentProps extends BaseProps {
    component: (field: {value: any, onChange: (e: ChangeEvent<HTMLInputElement>) => void}, props: object) => JSX.Element,
}

interface ChildrenProps extends BaseProps {
    children: JSX.Element,
}

type Props = ComponentProps | ChildrenProps

export const ControlledInput = (inputProps: Props) => {
    const { step, entry, children, component, errorDisplayed = false, informations } = inputProps;
    const { field } = useController({
        defaultValue: isDefined(step.defaultValue) ? step.defaultValue : null,
        name: entry
    })
    
    const { getValues, setValue, formState: { errors } } = useFormContext();

    const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], errors)


    const functionalProperty = (entry: string, prop: any) => {
        if (typeof prop === 'function') {
            return prop({ rawValues: getValues(), value: getValues(entry), informations, error, getValue: (key:string) => getValues(key) });
        } else {
            return prop;
        }
    }

    const props = {
        name: field.name,
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
        value: field.value,
    }

    return <CustomizableInput
        render={step.render} step={step}
        field={{ setValue: (key: string, value: any) => setValue(key, value), rawValues: getValues(), getValue: (key:string) => getValues(key), ...field }}
        error={error} errorDisplayed={errorDisplayed} informations={informations}>
        {component ? component(field, props) : React.cloneElement(children!, { ...props })}
    </CustomizableInput>
}