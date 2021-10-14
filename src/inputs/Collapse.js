import classNames from 'classnames';
import React, { useState } from 'react';
import {Eye, EyeOff} from 'react-feather';

export const Collapse = (props) => {
  const [collapsed, setCollapsed] = useState(props.initCollapsed || props.collapsed)

  const toggle = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCollapsed(!collapsed)
  };

  return (
    <div className={classNames('form__collapse', { errored: props.errored })}>
      <hr />
      <div>
        <div className={`${props.classes.collapse}`} onClick={toggle}>
          <span className={`${props.classes.collapse_label}`}>{props.label}</span>
          <button
            type="button"
            className={`${props.classes.btn} ${props.classes.btn_sm}`}
            style={{ float: 'right' }}
            onClick={toggle}>
              {!!collapsed && <Eye />}
              {!collapsed && <EyeOff />}
          </button>
        </div>
      </div>
      {!collapsed && props.children}
      {props.lineEnd && <hr />}
    </div>
  );
}

export const Panel = (props) => {

  const [collapsed, setCollapsed] = useState(props.initCollapsed || props.collapsed)

  const toggle = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCollapsed(!collapsed)
  };

  return (
    <div className="col-xs-12 col-sm-3">
      <div className="panel panel-primary" style={{ marginBottom: 0 }}>
        <div className="panel-heading" style={{ cursor: 'pointer' }} onClick={toggle}>
          {props.title}
        </div>
        {!collapsed && <div className="panel-body">{props.children}</div>}
      </div>
    </div>
  );
}
