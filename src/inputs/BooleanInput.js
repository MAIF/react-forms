import React from 'react';
import { ToggleLeft, ToggleRight } from 'react-feather';
import { useCustomStyle } from '../styleContext';

export const BooleanInput = ({ onChange, value }) => {
  const classes = useCustomStyle();
  return (
    <div className={classes.cursor_pointer}>
      {!!value && <ToggleRight className={classes.input__boolean__on} onClick={() => onChange(false)} />}
      {!value && <ToggleLeft className={classes.input__boolean__off} onClick={() => onChange(true)} />}
    </div>
  );

}
