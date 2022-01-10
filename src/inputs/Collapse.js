import classNames from 'classnames';
import React, { useState } from 'react';
import {Eye, EyeOff} from 'react-feather';
import { useCustomStyle } from '../styleContext'

export const Collapse = (props) => {
  const [collapsed, setCollapsed] = useState(props.initCollapsed || props.collapsed)
  const classes = useCustomStyle()

  const toggle = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCollapsed(!collapsed)
  };

  return (
    <div className={classNames('form__collapse', { errored: props.errored })}>
      <hr />
      <div className={`${classes.cursor_pointer} ${classes.flex} ${classes.justifyContentBetween}`} onClick={toggle}>
        <span className={classes.collapse_label}>{props.label}</span>
        <button
          type="button"
          className={classes.btn}
          onClick={toggle}>
            {!!collapsed && <Eye />}
            {!collapsed && <EyeOff />}
        </button>
      </div>
      {!collapsed && props.children}
      {props.lineEnd && <hr />}
    </div>
  );
}
