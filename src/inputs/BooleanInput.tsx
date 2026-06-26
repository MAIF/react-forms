import React from "react";
import classNames from "classnames";
import { useFormActions } from '../form/context';

interface PropType {
  onChange?: (v: boolean) => void;
  value?: boolean;
  readOnly?: boolean;
  className?: string;
  errorDisplayed?: boolean;
  buttons?: boolean;
  trueLabel?: string;
  falseLabel?: string
}

export const BooleanInput = ({ onChange, value, readOnly, className, errorDisplayed, buttons, trueLabel, falseLabel }: PropType) => {
    const actions = useFormActions();
    const handleClick = (value: boolean) => {
      if (!readOnly) {
        onChange?.(value);
      }
    };

    let classes = classNames("mrf-content_switch", className, {
      "mrf-content_switch_button_on": !!value,
      "mrf-content_switch_button_off": !value && value !== null,
      "mrf-content_switch_button_null": value === null,
      "mrf-cursor_pointer": !readOnly,
      "mrf-cursor_not_allowed": readOnly,
      "mrf-input__invalid": !!errorDisplayed
    });
    let callback = () => handleClick(true);
    if (!!value) {
      callback = () => handleClick(false);
    }

    if (buttons) {
      return (
        <div className='d-flex'>
            <button type="button" className={classNames(actions.selectButton?.className, {active: !!value})} onClick={() => onChange!(true)}>{trueLabel || 'true'}</button>
            <button type="button" className={classNames(actions.selectButton?.className, {active: !value})} onClick={() => onChange!(false)}>{falseLabel || 'false'}</button>
          </div>
      )
    }

    return <input type="checkbox" className={classes} onChange={callback} />;
  }
