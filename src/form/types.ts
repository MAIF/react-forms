import { Constraint, TConstraintType } from "../constraints";
import { SelectOption } from "../inputs";
import { Type } from '../type';
import { Format } from '../format';

export interface OptionActionItem {
  display?: boolean;
  label?: string;
}

export interface OptionActions {
  reset?: OptionActionItem;
  cancel?: OptionActionItem & { action: () => void };
  submit?: OptionActionItem;
  add?: OptionActionItem
}

export type HttpClient = (url: string, method: string) => Promise<Response>;

export interface Option {
  httpClient?: HttpClient;
  watch?: boolean | ((param: any) => void);
  autosubmit?: boolean;
  actions?: OptionActions;
  showErrorsOnStart?: boolean;
}


export interface Schema {
  [key: string]: SchemaEntry;
}

export type SchemaRenderType = ({ rawValues, value, onChange, error, setValue, getValue, informations, defaultValue }: 
  { 
    rawValues?: any, 
    value?: any, 
    onChange?: (param: any) => void, 
    error?: boolean, 
    getValue: (entry: string) => any, 
    informations?: Informations, 
    setValue?: (key: string, data: any) => void,
    defaultValue?: any }) => JSX.Element
    

export interface ConditionnalSchemaElement {
  default?: boolean;
  condition?: ({ rawValues, ref }: { rawValues: { [x: string]: any }, ref: any }) => boolean | any;
  schema: Schema;
  flow: Array<FlowObject | string>
}


export interface ConditionnalSchema {
  ref: string;
  switch: ConditionnalSchemaElement[];
}

export interface SchemaEntry {
  schema?: Schema;
  type: Type;
  format?: Format;
  array?: boolean;
  optional?: boolean
  createOption?: boolean;
  onCreateOption?: (option: string) => any; // TODO specify option style
  isMulti?: boolean;
  defaultKeyValue?: object;
  visible?: boolean | ((prop: { rawValues: { [x: string]: any }, value: any, informations?: Informations }) => boolean);
  disabled?: boolean | ((prop: { rawValues: { [x: string]: any }, value: any, informations?: Informations }) => boolean);
  label?: React.ReactNode | ((prop: { rawValues: { [x: string]: any }, value: any, informations?: Informations }) => React.ReactNode);
  placeholder?: string;
  defaultValue?: any;
  help?: string;
  className?: string;
  style?: object;
  onChange?: (params: { rawValues: object, setValue: (entry: string, value: any) => void, value: any}) => void;
  render?: SchemaRenderType;
  itemRender?: SchemaRenderType;
  props?: object;
  options?: Array<any | { label: string, value: any }>;
  optionsFrom?: string | ((param: { rawValues: object, value: any }) => Promise<any[]> | string) | Promise<any[]>;
  transformer?: ((v: any) => SelectOption) | { label: string, value: string };
  conditionalSchema?: ConditionnalSchema;
  constraints?: Array<Constraint | { type: TConstraintType, message?: string }>;
  arrayConstraints?: Array<Constraint | { type: TConstraintType, message?: string }>;
  flow?: Array<string | FlowObject>;
  onAfterChange?: (obj: { entry: string, value: object, rawValues: object, previousValue?: object, getValue: (entry: string) => any, setValue: (entry: string, value: any) => void, onChange: (v: any) => void, reset: (v: any) => void, informations?: Informations }) => void;
  visibleOnCollapse?: boolean;
  addableDefaultValue?: any; /* TODO doc : possible only with array, used to give default value to dynamically added elements */
  collapsed?: boolean; // TODO doc : indicate wether form is closed or not, only for objects with form
  collapsable?: boolean | ((param: { rawValues: { [x: string]: any }, value: any, getValue: (key: string) => any }) => JSX.Element); // TODO doc : indicate wether schema can be collapsed, only for objects with form
  deps?: string | Array<string> | ((informations: Informations) => string | Array<string>);
  item?: ({
    disabled?: boolean | ((prop: { rawValues: { [x: string]: any }, value: any, informations?: Informations }) => boolean);
    visible?: boolean | ((prop: { rawValues: { [x: string]: any }, value: any, informations?: Informations }) => boolean);
    label?: React.ReactNode | ((prop: { rawValues: { [x: string]: any }, value: any, informations?: Informations }) => React.ReactNode);
    onChange?: (param: object) => void;
    onAfterChange?: (obj: { entry: string, value: object, rawValues: object, previousValue?: object, getValue: (entry: string) => any, setValue: (entry: string, value: any) => void, onChange: (v: any) => void, informations?: Informations }) => void;
    render?: SchemaRenderType;
    array?: boolean;
    deps?: string | Array<string> | ((informations: Informations) => string | Array<string>);
    // constraints?: Array<Constraint | { type: TConstraintType, message?: string }>;
  });
}

export interface FlowObject {
  label: string;
  flow: Flow;
  collapsed: boolean;
}

export type Flow = Array<string | FlowObject>

export type TFunctionalProperty = <T, >(entry: string, prop: T | ((param: { rawValues: { [x: string]: any }, value: any, informations?: Informations, error?: { [x: string]: any } }) => T), informations?: Informations, error?: { [x: string]: any }) => T

export interface Informations {
  path: string,
  key?: string,
  parent?: Informations,
  index?: number
}

export interface StepsOptions {
  addLabel?: string
}

export type TBaseObject = {[key: string]: any}