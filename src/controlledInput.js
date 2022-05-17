import React from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { option } from './Option'
import { type } from './type'

const CustomizableInput = React.memo(
    props => {
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
        return (prev.field.value === next.field.value && next.errorDisplayed === prev.errorDisplayed)
    })

export const ControlledInput = ({ defaultValue, step, entry, children, component, errorDisplayed }) => {
    const { field } = useController({
        defaultValue: defaultValue || null,
        name: entry
    })

    const { getValues, setValue, formState: { errors } } = useFormContext();

    const functionalProperty = (entry, prop) => {
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
        onChange: e => {
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
        render={step.render}
        field={{ parent, setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }}
        error={error} errorDisplayed={errorDisplayed}>
        {component ? component(field, props) : React.cloneElement(children, { ...props })}
    </CustomizableInput>
}