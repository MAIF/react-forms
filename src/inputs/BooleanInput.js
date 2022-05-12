import React from 'react';
import classNames from 'classnames';
import { useCustomStyle } from '../styleContext';

export const BooleanInput = React.forwardRef(({ onChange, value, readOnly, ...props }, ref) => {
  const style = useCustomStyle()
  const classes = props.classes || style || {}

  const handleClick = (value) => {
    if (!readOnly) {
      onChange(value)
    }
  }
  return (
    <div className={classNames({ [classes.cursor_pointer]: !readOnly, [classes.cursor_not_allowed]: readOnly })}>
      {!!value && <div className={classNames(classes.content_switch_button_on)} onClick={() => handleClick(false)}><div className={classNames(classes.switch_button_on)} /></div>}
      {!value && value !== null && <div className={classNames(classes.content_switch_button_off)} onClick={() => handleClick(true)}><div className={classNames(classes.switch_button_off)} /></div>}
      {value === null && <div className={classNames(classes.content_switch_button_null)} onClick={() => handleClick(true)}><div className={classNames(classes.switch_button_null)} /></div>}
    </div>
  );
})
