import React from "react";

interface Schema {
  [x: string]: SchemaEntry;
}

interface TInformation {
  path: string;
  index?: number;
  parent?: TInformation;
}

interface BaseSchema<OutputType> {
  array?: boolean;
  placeholder?: string /* FIXME not all fields... */;
  defaultValue?: any /* TODO could be more specific*/;
  help?: string;
  onChange?: (param: {
    rawValues: object;
    value: OutputType;
    setValue: (p1: any, p2: any, p3: any /*TODO*/) => void;
  }) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
  style?: object;
  visible?:
    | boolean
    | ((param: {
        rawValues: object;
        informations: TInformation;
        value: OutputType;
        error?: any;
        getValue: (x: string) => any;
      }) => boolean);
  render?: (props: {
    rawValues: object;
    value: OutputType;
    onChange: (newValue: OutputType) => void;
    error?: any;
    setValue?: (data: any) => /*TODO 2 params ?*/ void;
    parent: any;
  }) => JSX.Element;
}

interface DateTypeSchema extends BaseSchema<Date> {
  type: "date";
  format?: undefined;
  defaultValue?: Date | string;
}

interface FileTypeSchema extends BaseSchema<Array<File>> {
  type: "file";
  format?: undefined;
}

interface BooleanTypeSchema extends BaseSchema<boolean> {
  type: "bool";
  format?: undefined;
  defaultValue?: boolean;
}

interface StringTypeSchema extends BaseSchema<string> {
  type: "string";
  format?:
    | "select"
    | "buttons"
    | "markdown"
    | "code"
    | "singleLineCode"
    | "textarea"
    | "email"
    | "password"
    | "hidden";
  defaultValue?: string;
}

interface NumberTypeSchema extends BaseSchema<string> {
  type: "number";
  format?: "select" | "buttons";
  defaultValue?: number;
}

interface FormatSelectSchema<T> extends BaseSchema<T> {
  /* TODO object with select ? Need a transformer or label key */
  type: "string" | "number" | "object";
  format: "select" | "buttons";
  createOption?: boolean;
  onCreateOption?: (option: object) => void; // TODO specify option style
  isMulti?: boolean;
  options?: Array<any | { label: string; value: any }>;
  optionsFrom?: string;
  transformer?: (value: any) => { label: string; value: any };
  defaultValue?: T;
}

interface StringFormatSelectSchema extends FormatSelectSchema<string> {
  type: "string";
}

interface NumberFormatSelectSchema extends FormatSelectSchema<number> {
  type: "number";
}

interface ObjectTypeSchema extends BaseSchema<object> {
  type: "object";
  format: undefined;
  defaultKeyValue?: Array<{ key: string; value: any }>;
  defaultValue?: object;
}

interface ObjectFormSchema extends BaseSchema<object> {
  type: "object";
  format: "form";
  schema: Schema;
  defaultKeyValue?: Array<{ key: string; value: any }>;
  defaultValue?: object;
}

//type StringSelectSchema = StringTypeSchema & FormatSelectSchema
//type NumberSelectSchema = NumberTypeSchema & FormatSelectSchema

export type SchemaEntry =
  | StringTypeSchema
  | ObjectTypeSchema
  | ObjectFormSchema
  | DateTypeSchema
  | FileTypeSchema
  | BooleanTypeSchema
  | NumberTypeSchema
  | NumberFormatSelectSchema
  | StringFormatSelectSchema;
//| NumberSelectSchema
//| StringSelectSchema

/*const bar: SchemaEntry = {
  type: "number",
  format: "buttons",
  defaultValue: "1"
}

const baz: SchemaEntry = {
  type: "bool"
}*/
