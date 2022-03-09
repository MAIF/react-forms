import React from 'react';
import classNames from 'classnames';
import { ToggleLeft, ToggleRight } from 'react-feather';
import { useCustomStyle } from '../styleContext';

export const BooleanInput = ({ onChange, value, readOnly }) => {
  const classes = useCustomStyle();
  const handleClick = (value) => {
    if (!readOnly) {
      onChange(value)
    }
  }
  return (
    <div className={classNames({ [classes.cursor_pointer]: !readOnly, [classes.cursor_not_allowed]: readOnly})}>
      {!!value && <ToggleRight className={classNames(classes.input__boolean__on)} onClick={() => handleClick(false)} />}
      {!value && <ToggleLeft className={classNames(classes.input__boolean__off)} onClick={() => handleClick(true)} />}
    </div>
  );

}
