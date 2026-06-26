import React, { createContext, useContext } from 'react';
import { Option, OptionActions } from './types';

export const defaultActions: OptionActions = {
  submit: { className: 'mrf-btn mrf-btn_green mrf-ml_10' },
  cancel: { className: 'mrf-btn mrf-btn_red', action: () => {} },
  reset:  { className: 'mrf-btn mrf-btn_red' },
  add:         { className: 'mrf-btn mrf-btn_blue mrf-btn_sm mrf-mt_5' },
  remove:      { className: 'mrf-btn mrf-btn_red mrf-btn_sm mrf-ml_5' },
  addEntry:    { className: 'mrf-flex mrf-btn mrf-btn_blue mrf-btn_sm' },
  removeEntry: { className: 'mrf-flex mrf-ai_center mrf-btn mrf-btn_red mrf-btn_sm mrf-ml_10' },
};

const defaultOptions: Option = { actions: defaultActions };

// App-level provider: configure once for all forms
const ReactFormsContext = createContext<Option>(defaultOptions);

export const ReactFormsProvider = ({ options, children }: { options: Option, children: React.ReactNode }) => (
  <ReactFormsContext.Provider value={options}>
    {children}
  </ReactFormsContext.Provider>
);

export const useReactFormsContext = (): Option => useContext(ReactFormsContext);

// Form-level context: holds the merged actions (provider + form props)
const FormActionsContext = createContext<OptionActions>(defaultActions);

export const FormActionsProvider = ({ actions, children }: { actions: OptionActions, children: React.ReactNode }) => (
  <FormActionsContext.Provider value={actions}>
    {children}
  </FormActionsContext.Provider>
);

export const useFormActions = (): OptionActions => useContext(FormActionsContext);
