import React from 'react'
import { option } from './Option'
import { type } from './type'

// const CustomizableInput = React.memo(
//     props => {
//         if (props.render) {
//             return (
//                 props.render({ ...props.field, error: props.error })
//             )
//         }
//         return props.children
//     }, (prev, next) => (prev.field.value === next.field.value && next.errorDisplayed === prev.errorDisplayed))

export class ControlledInput extends React.Component {
    render() {
        const { value, onChange, step, entry, children, component, errorDisplayed, functionalProperty, getField, render, classes } = this.props;

        const props = {
            ...step.props,
            classes,
            id: entry,
            readOnly: functionalProperty(entry, step.disabled) ? 'readOnly' : null,
            placeholder: step.placeholder,
            onChange: e => {
                const value = (() => {
                    if (!e) {
                        if (step.type === type.bool ||
                            (step.type === type.number && getField(entry) === 0)) {
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
                console.log("onChange component", value)
                onChange(value)
                option(step.onChange)
                    .map(onChange => onChange({
                        // rawValues: getValues(), TODO
                        value,
                        setValue: onChange
                    }))
            },
            value
        }

        // const error = entry.split('.').reduce((acc, curr) => acc && acc[curr], errors)

        if (render) {
            return render({
                parent,
                setValue: onChange,
                // rawValues: value, // TODO
                value,
                onChange,
                ...props,
                // error={error} errorDisplayed={errorDisplayed}
            })
        } else
            return component ? component(props) : React.cloneElement(children, { ...props })
    }
}