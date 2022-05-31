import React, { useContext } from 'react';
import classNames from 'classnames';

export const BooleanInput = React.forwardRef(({ onChange, value, readOnly }, ref) => {

  const handleClick = (value) => {
    if (!readOnly) {
      onChange(value)
    }
  }
  return (
    <div className={classNames({ ['cursor_pointer']: !readOnly, ['cursor_not_allowed']: readOnly })}>
      {!!value && <div className={classNames('content_switch_button_on')} onClick={() => handleClick(false)}><div className={classNames('switch_button_on')} /></div>}
      {!value && value !== null && <div className={classNames('content_switch_button_off')} onClick={() => handleClick(true)}><div className={classNames('switch_button_off')} /></div>}
      {value === null && <div className={classNames('content_switch_button_null')} onClick={() => handleClick(true)}><div className={classNames('switch_button_null')} /></div>}
    </div>
  );
})
