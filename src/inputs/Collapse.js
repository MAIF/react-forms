import classNames from 'classnames';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'react-feather';
import { useCustomStyle } from '../styleContext'

export const Collapse = (props) => {
  const [collapsed, setCollapsed] = useState(props.initCollapsed || props.collapsed)
  const [expandedAll, setExpandedAll] = useState(false)
  const classes = useCustomStyle()

  const toggle = (e) => {
    if (e && e.preventDefault) e.stopPropagation()
    setCollapsed(!collapsed)
  };

  const childrenWithProps = React.Children.map(props.children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { collapsed: expandedAll });
    }
    return child;
  });

  return (
    <div>
      <hr className={classNames({ [classes.collapse_error]: props.errored })} />
      <div className={`${classes.cursor_pointer} ${classes.flex} ${classes.jc_between}`} onClick={toggle}>
        <span className={classNames(classes.collapse_label, { [classes.collapse_error]: props.errored })}>{props.label}</span>
        <div style={{ marginLeft: 'auto' }} className={classNames(classes.flex)}>
          <button
            type="button"
            className={classNames(classes.btn, classes.btn_sm, { [classes.collapse_error]: props.errored })}
            onClick={e => {
              if (e)
                e.stopPropagation()
              setExpandedAll(!expandedAll)
            }}>
            {expandedAll ? 'Expand all' : 'Collapse all'}
          </button>
          <button
            type="button"
            className={classNames(classes.btn, classes.btn_sm, classes.ml_5, { [classes.collapse_error]: props.errored })}
            onClick={toggle}>
            {!!collapsed && <Eye size={16} />}
            {!collapsed && <EyeOff size={16} />}
          </button>
        </div>
      </div>
      <div className={classNames(`${classes.ml_10}`, {
        [classes.display__none]: !!collapsed,
        [classes.flex]: !!props.inline,
        [classes.collapse__inline]: !!props.inline,
      })}>
        {childrenWithProps}
      </div>
      {props.lineEnd && <hr />}
    </div>
  );
}
