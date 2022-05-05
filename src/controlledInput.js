import React from 'react'
import classNames from 'classnames';

import { option } from './Option'
import { type } from './type'

const Error = ({ error, errorDisplayed, children, classes }) =>
    <>
        {children}
        {errorDisplayed && <span className={classNames(classes.txt_red, classes.error_txt)}>{error}</span>}
    </>

class ControlledClass extends React.Component {
    render() {
        const {
            value, onChange, step, entry, children, component,
            errorDisplayed, error,
            functionalProperty, getField, classes
        } = this.props;

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
                        if (e.target.type === 'number') {
                            if (e.target.value.length === 0)
                                return null
                            else if (isNaN(Number(e.target.value)))
                                return null
                            return Number(e.target.value)
                        }
                        return e.target.value || null;
                    } else {
                        return e;
                    }
                })()
                onChange(value)
                option(step.onChange)
                    .map(onChange => onChange({
                        value,
                        setValue: onChange
                    }))
            },
            value
        }

        if (step.render) {
            return step.render({
                ...this.props,
                ...props
            })
        } else {
            return <Error error={error} errorDisplayed={errorDisplayed} classes={classes}>
                {component ? component(props) : React.cloneElement(children, { ...props })}
            </Error>
        }
    }
}


export const ControlledInput = React.memo(ControlledClass,
    (prevProps, nextProps) => prevProps.value === nextProps.value && prevProps.errorDisplayed === nextProps.errorDisplayed
)
