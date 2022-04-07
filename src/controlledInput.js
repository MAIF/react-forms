import React from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { option } from './Option'

const CustomizableInput = props => {
    if (props.render) {
        return (
            props.render({ ...props.field, error: props.error })
        )
    }
    return props.children
}

export const ControlledInput = ({ defaultValue, step, entry, children, component }) => {

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
            field.onChange(!e ? null : e.target ? e.target.value || null : e)
            option(step.onChange)
                .map(onChange => onChange({ rawValues: getValues(), value: e.target.value, setValue }))
        },
        value: field.value || ''
    }

    const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], errors)

    return (
        <CustomizableInput
            render={step.render}
            field={{ parent, setValue: (key, value) => setValue(key, value), rawValues: getValues(), ...field }}
            error={error}>
            {component ? component(field, props) : React.cloneElement(children, { ...props })}
        </CustomizableInput>
    )
}