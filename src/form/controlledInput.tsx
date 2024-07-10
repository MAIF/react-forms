import * as  React from "react";
import { ChangeEvent } from 'react';
import classNames from "classnames";
// @ts-ignore 
import Trash2 from 'react-feather/dist/icons/trash-2.js';
import { useController, useFormContext } from 'react-hook-form';
import { BasicWrapper } from "./basicWrapper";
import { option } from '../Option';
import { type } from '../type';
import { cleanHash, isDefined } from '../utils';
import { ConditionnalSchema, Informations, SchemaEntry, SchemaRenderType } from "./types";

const CustomizableInput = React.memo(
    (props: {
        field: { rawValues?: any, value?: any, onChange?: (param: object) => void, error?: boolean, getValue: (entry: string) => any, setValue?: (key: string, data: any) => void },
        step: SchemaEntry,
        error: any, errorDisplayed: boolean,
        render?: SchemaRenderType,
        children: JSX.Element,
        conditionalSchema?: ConditionnalSchema,
        informations?: Informations,
        deactivateReactMemo: boolean
    }) => {
        if (props.render) {
            return (
                props.render({ ...props.field, error: props.error, informations: props.informations, defaultValue: props.step.defaultValue })
            )
        }
        return props.children
    }, (prev, next) => {
        if (next.deactivateReactMemo) {
            return false;
        }
        return (prev.field.value === next.field.value && next.errorDisplayed === prev.errorDisplayed && cleanHash(next.step) === cleanHash(prev.step))
    }
)

interface BaseProps {
    step: SchemaEntry,
    entry: string,
    realEntry?: string,
    errorDisplayed?: boolean,
    component?: (field: { value: any, onChange: (e: ChangeEvent<HTMLInputElement>) => void }, props: object) => JSX.Element,
    children?: JSX.Element,
    informations: Informations,
    deactivateReactMemo: boolean,
    inputWrapper?: (props: object) => JSX.Element,
    defaultFormValue: any
}

interface ComponentProps extends BaseProps {
    component: (field: { value: any, onChange: (e: ChangeEvent<HTMLInputElement>) => void }, props: object) => JSX.Element,
}

interface ChildrenProps extends BaseProps {
    children: JSX.Element,
}

type Props = ComponentProps | ChildrenProps

export const ControlledInput = (inputProps: Props) => {
    const { step, entry, realEntry, children, component, errorDisplayed = false, informations, deactivateReactMemo, inputWrapper, defaultFormValue } = inputProps;
    const { field } = useController({
        defaultValue: isDefined(step.defaultValue) ? step.defaultValue : null,
        name: entry
    })
    const { getValues, setValue, formState: { errors } } = useFormContext();
    const [isAdded, setIsAdded] = React.useState<boolean>(!!field.value)

    //@ts-ignore
    const error: { [x: string]: any } = entry.split('.').reduce((acc, curr) => acc && acc[curr], errors)


    const functionalProperty = (entry: string, prop: any) => {
        if (typeof prop === 'function') {
            return prop({ rawValues: getValues(), value: getValues(entry), defaultFormValue, informations, error, getValue: (key: string) => getValues(key) });
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

    if (step.optional && isAdded) {
        return (
            <div className='mrf-ai_center mrf-mt_5' style={{ position: 'relative' }}>
                <div style={{ width: '95%' }}>
                    <BasicWrapper key={`collapse-${entry}`} entry={entry} realEntry={realEntry} functionalProperty={functionalProperty} step={step} render={inputWrapper} informations={informations}>
                        <CustomizableInput
                            render={step.render}
                            step={step}
                            field={{ setValue: (key: string, value: any) => setValue(key, value), rawValues: getValues(), getValue: (key: string) => getValues(key), ...field }}
                            error={error} errorDisplayed={errorDisplayed}
                            informations={informations}
                            deactivateReactMemo={deactivateReactMemo}>
                            {component ? component(field, props) : React.cloneElement(children!, { ...props })}
                        </CustomizableInput>
                    </BasicWrapper>
                </div>
                <button type="button"
                    style={{ position: 'absolute', top: '2px', right: 0 }}
                    className='mrf-btn mrf-btn_red mrf-btn_sm mrf-ml_5'
                    onClick={() => {
                        setIsAdded(false)
                        setValue(entry, null)
                    }}>
                    <Trash2 size={16} />
                </button>
            </div>
        )
    } else if (step.optional) {
        return (
            <BasicWrapper key={`collapse-${entry}`} entry={entry} realEntry={realEntry} functionalProperty={functionalProperty} step={step} render={inputWrapper} informations={informations}>
                <div className='mrf-flex mrf-jc_flex_end'>
                    <button type="button"
                        className={classNames('mrf-btn', 'mrf-btn_blue', 'mrf-btn_sm', 'mrf-mt_5')}
                        onClick={() => {
                            setIsAdded(true)
                            //todo: setup la valeur par defaut ??
                        }}>Add</button>
                </div>
            </BasicWrapper>
        )
    }

    return <BasicWrapper key={`collapse-${entry}`} entry={entry} realEntry={realEntry} functionalProperty={functionalProperty} step={step} render={inputWrapper} informations={informations}>
        <CustomizableInput
            render={step.render}
            step={step}
            field={{ setValue: (key: string, value: any) => setValue(key, value), rawValues: getValues(), getValue: (key: string) => getValues(key), ...field }}
            error={error} errorDisplayed={errorDisplayed}
            informations={informations}
            deactivateReactMemo={deactivateReactMemo}>
            {component ? component(field, props) : React.cloneElement(children!, { ...props })}
        </CustomizableInput>
    </BasicWrapper>
}