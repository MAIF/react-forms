import React from "react";
import { OptionActions } from "./types";

export const Footer = (props: { actions?: OptionActions, render?: ({ reset, valid }: { reset: () => void, valid: () => void }) => React.JSX.Element, reset: () => void, valid: () => void }) => {
  if (props.render) {
    return props.render({ reset: props.reset, valid: props.valid })
  }

  const isSubmitDisplayed = props.actions?.submit?.display === undefined ? true : !!props.actions?.submit?.display

  return (
    <div className='mrf-flex mrf-jc_end mrf-gap-1 mrf-mt_5'>
      {props.actions?.cancel?.display && <button className={props.actions.cancel.className} type="button" onClick={() => props.actions?.cancel?.action?.()}>{props.actions?.cancel?.label || 'Cancel'}</button>}
      {props.actions?.reset?.display && <button className={props.actions.reset.className} type="button" onClick={props.reset}>{props.actions?.reset?.label || 'Reset'}</button>}
      {isSubmitDisplayed && <button className={props.actions?.submit?.className} type="submit">{props.actions?.submit?.label || 'Save'}</button>}
    </div>
  )
}