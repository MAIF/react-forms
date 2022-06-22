import React from "react";
import classNames from "classnames";

interface PropType {
  onChange?: (v: boolean) => void;
  value?: boolean;
  readOnly?: boolean;
}

export const BooleanInput = React.forwardRef<HTMLInputElement, PropType>(
  ({ onChange, value, readOnly }, ref) => {
    const handleClick = (value: boolean) => {
      if (!readOnly) {
        onChange?.(value);
      }
    };

    let className = classNames("mrf-content_switch", {
      "mrf-content_switch_button_on": !!value,
      "mrf-content_switch_button_off": !value && value !== null,
      "mrf-content_switch_button_null": value === null,
      "mrf-cursor_pointer": !readOnly,
      "mrf-cursor_not_allowed": readOnly,
    });
    let callback = () => handleClick(true);
    if (!!value) {
      callback = () => handleClick(false);
    }

    return <input type="checkbox" className={className} onChange={callback} />;
  }
);
