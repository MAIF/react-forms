import classNames from 'classnames';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'react-feather';
import { useCustomStyle } from '../styleContext'

export const Collapse = (props) => {
  const [collapsed, setCollapsed] = useState(props.initCollapsed || props.collapsed)
  const classes = useCustomStyle()

  const toggle = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCollapsed(!collapsed)
  };

  return (
    <div>
      <hr className={classNames({ [classes.collapse_error]: props.errored })} />
      <div className={`${classes.cursor_pointer} ${classes.flex} ${classes.justifyContentBetween}`} onClick={toggle}>
        <span className={classNames(classes.collapse_label, { [classes.collapse_error]: props.errored })}>{props.label}</span>
        <button
          type="button"
          className={classNames(classes.btn, { [classes.collapse_error]: props.errored })}
          onClick={toggle}>
          {!!collapsed && <Eye />}
          {!collapsed && <EyeOff />}
        </button>
      </div>
      <div className={classNames(classes.ml_10, {
        [classes.display__none]: !!collapsed,
        [classes.flex]: !!props.inline
      })}>
        {props.children}
      </div>
      {props.lineEnd && <hr />}
    </div>
  );
}
