import React from "react";

export const Footer = (props: { actions?: { submit?: { display?: boolean, label?: React.ReactNode }, cancel?: { display?: boolean, action: () => void, label?: React.ReactNode }, reset?: { display?: boolean, label?: React.ReactNode } }, render?: ({ reset, valid }: { reset: () => void, valid: () => void }) => JSX.Element, reset: () => void, valid: () => void }) => {
  if (props.render) {
    return props.render({ reset: props.reset, valid: props.valid })
  }

  const isSubmitDisplayed = props.actions?.submit?.display === undefined ? true : !!props.actions?.submit?.display

  return (
    <div className='mrf-flex mrf-jc_end mrf-mt_5'>
      {props.actions?.cancel?.display && <button className='mrf-btn mrf-btn_red' type="button" onClick={() => props.actions?.cancel?.action()}>{props.actions?.cancel?.label || 'Cancel'}</button>}
      {props.actions?.reset?.display && <button className='mrf-btn mrf-btn_red' type="button" onClick={props.reset}>{props.actions?.reset?.label || 'Reset'}</button>}
      {isSubmitDisplayed && <button className='mrf-btn mrf-btn_green mrf-ml_10' type="submit">{props.actions?.submit?.label || 'Save'}</button>}
    </div>
  )
}