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
      <hr className={classNames({ ['collapse_error']: props.errored })} />
      <div className='cursor_pointer flex jc_between' onClick={toggle}>
        <span className={classNames('collapse_label', { ['collapse_error']: props.errored })}>{props.label}</span>
        <button
          type="button"
          className={classNames('btn', 'btn_sm', 'ml_5', { ['collapse_error']: props.errored })}
          onClick={toggle}>
          {!!collapsed && <Eye size={16} />}
          {!collapsed && <EyeOff size={16} />}
        </button>
      </div>
      <div className={classNames('ml_10', {
        ['display__none']: !!collapsed,
        ['flex']: !!props.inline,
        ['collapse__inline']: !!props.inline,
      })}>
        {props.children}
      </div>
      {props.lineEnd && <hr />}
    </div>
  );
}
