import React from 'react';
import classNames from 'classnames';
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
      {!!value && <div className={classNames(classes.content_switch_button_on)} onClick={() => handleClick(false)}><div className={classNames(classes.switch_button_on)} /></div>}
      {!value && <div className={classNames(classes.content_switch_button_off)} onClick={() => handleClick(true)}><div className={classNames(classes.switch_button_off)} /></div>}
    </div>
  );

}
