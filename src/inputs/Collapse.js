import classNames from 'classnames';
import React, { useContext, useState } from 'react';
import { Eye, EyeOff } from 'react-feather';

export const Collapse = (props) => {
  const [collapsed, setCollapsed] = useState(props.initCollapsed || props.collapsed)

  const toggle = (e) => {
    if (e && e.preventDefault) e.stopPropagation()
    setCollapsed(!collapsed)
  };

  return (
    <div>
      <hr className={classNames({ ['mrf-collapse_error']: props.errored })} />
      <div className='mrf-cursor_pointer mrf-flex mrf-jc_between' onClick={toggle}>
        <span className={classNames('mrf-collapse_label', { ['mrf-collapse_error']: props.errored })}>{props.label}</span>
        <button
          type="button"
          className={classNames('mrf-btn', 'mrf-btn_sm', 'mrf-ml_5', { ['mrf-collapse_error']: props.errored })}
          onClick={toggle}>
          {!!collapsed && <Eye size={16} />}
          {!collapsed && <EyeOff size={16} />}
        </button>
      </div>
      <div className={classNames('mrf-ml_10', {
        ['mrf-display__none']: !!collapsed,
        ['mrf-flex']: !!props.inline,
        ['mrf-collapse__inline']: !!props.inline,
      })}>
        {props.children}
      </div>
      {props.lineEnd && <hr />}
    </div>
  );
}
