import React from 'react'
import classNames from 'classnames';

import { option } from './Option'
import { type } from './type'
import debounce from 'lodash.debounce';

const Error = ({ error, errorDisplayed, children, classes }) =>
    <>
        {children}
        {errorDisplayed && <span className={classNames(classes.txt_red, classes.error_txt)}>{error}</span>}
    </>

class ControlledClass extends React.Component {
    state = {
        value: this.props.value
    }

    componentDidUpdate(prevProps) {
        if (this.props.value !== prevProps.value)
            this.setState({
                value: this.props.value
            })
    }

    onChange = (e, target) => {
        const { step, getField } = this.props;
        const value = (() => {
            if (!e) {
                if (step.type === type.bool ||
                    (step.type === type.number && getField(entry) === 0)) {
                    return e;
                } else {
                    return null;
                }
            } else if (target) {
                if (target.type === 'number') {
                    if (target.value.length === 0)
                        return null
                    else if (isNaN(Number(target.value)))
                        return null
                    return Number(target.value)
                }
                return target.value || null;
            } else {
                return e;
            }
        })()
        this.setState({
            value
        })

        this.propagate(value)
    }

    propagate = debounce(value => {
        const { step, getField, onChange } = this.props;
        onChange(value)
        option(step.onChange)
            .map(onChange => onChange({
                value,
                setValue: onChange
            }))
    }, 125)

    render() {
        const {
            step, entry, children, component,
            errorDisplayed, error,
            functionalProperty, classes
        } = this.props;

        const props = {
            ...step.props,
            classes,
            id: entry,
            readOnly: functionalProperty(entry, step.disabled) ? 'readOnly' : null,
            placeholder: step.placeholder,
            onChange: e => this.onChange(e, e.target ? ({ type: e.target.type, value: e.target.value }) : undefined),
            value: this.state.value
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

export const ControlledInput = ControlledClass