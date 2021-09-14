import React from 'react';
import { ToggleLeft, ToggleRight } from 'react-feather';

export const BooleanInput = ({ onChange, value }) => {
  return (
    <div>
      <div className="form-group row">
        <div className="col-sm-10">
          <div className="row">
            <div className="col-sm-6 cursor-pointer">
              {!!value && <ToggleRight className="input__boolean__on" onClick={() => onChange(false)} />}
              {!value && <ToggleLeft className="input__boolean__off" onClick={() => onChange(true)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
