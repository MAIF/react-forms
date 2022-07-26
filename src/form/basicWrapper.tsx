import React from "react";
import { useFormContext, useFormState } from "react-hook-form";
import ReactToolTip from 'react-tooltip';
import classNames from 'classnames';
import { v4 as uuid } from 'uuid';
// @ts-ignore
import HelpCircle from 'react-feather/dist/icons/help-circle.js';
import { Informations, SchemaEntry, TFunctionalProperty } from "./types";

export const BasicWrapper = ({ entry, realEntry, children, render, functionalProperty, step, informations, className }:
  {
    entry: object | string,
    realEntry?: string,
    className?: string,
    children: JSX.Element,
    render?: ({ entry, label, error, help, children }: { entry: string, label: React.ReactNode, error: object, help: React.ReactNode, children: React.ReactNode }) => JSX.Element,
    functionalProperty: TFunctionalProperty,
    step?: SchemaEntry,
    informations: Informations
  }) => {
  const { formState } = useFormContext();

  if (typeof entry === 'object') {
    return children
  }

  // FIXME not sure it works as intended with more two or more parts
// @ts-ignore
  const error: {[x: string]: any} = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.errors)
  const isDirty = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.dirtyFields)
  const isTouched = entry.split('.').reduce((acc, curr) => acc && acc[curr], formState.touchedFields)
  const errorDisplayed = formState.isSubmitted || isDirty || isTouched

  const visibleStep = functionalProperty(entry, step?.visible === undefined ? true : step.visible, informations, error)
  
  if (!visibleStep) {
    return null;
  }

  const computedLabel = functionalProperty(entry, step?.label === null ? null : step?.label || realEntry || entry, informations)

  const id = uuid();

  if (render) {
    return render({ entry, label: computedLabel, error, help: step?.help, children })
  }

  return (
    <div className={`mrf-mt_10  ${className || ""}`} style={{ position: 'relative' }}>
      {computedLabel && <label className='mrf-flex mrf-ai_center mrf-mb_5' htmlFor={entry}>
        <span>{computedLabel}</span>
        {step?.help && <>
          <ReactToolTip html={true} place={'bottom'} id={id} />
          <span className='mrf-flex mrf-ai_center' data-html={true} data-tip={step?.help} data-for={id}>
            <HelpCircle style={{ color: 'gray', width: 17, marginLeft: '.5rem', cursor: 'help' }} />
          </span>
        </>}
      </label>}

      {children}
      {error && <div className={classNames('mrf-feedback', { ['mrf-txt_red']: !!errorDisplayed })}>{error.message}</div>}
    </div>
  )
}