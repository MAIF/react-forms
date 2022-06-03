export const type = {
  string: "string",
  number: "number",
  bool: "bool",
  date: "date",
  object: "object",
  file: "file",
  json: "json"
} as const

function stringTuple<T extends [string] | string[]>(...data: T): T {
  return data;
}

let typeValues = stringTuple(...Object.values(type))

export type Type = typeof typeValues[number]