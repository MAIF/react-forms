export const format = {
  array: "array",
  select: "select",
  code: "code",
  markdown: "markdown",
  text: "textarea",
  textarea: "textarea",
  email: "email",
  password: "password",
  hidden: "hidden",
  form: "form",
  buttonsSelect: "buttons",
  singleLineCode: "singleLineCode",
  datetime: "datetime-local",
  time: "time"
} as const


function stringTuple<T extends [string] | string[]>(...data: T): T {
  return data;
}

let formatValues = stringTuple(...Object.values(format))

export type Format = typeof formatValues[number]