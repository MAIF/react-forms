# @maif/react-forms

**@maif/react-forms** is a React form builder with batteries included. You just have to define a form flow and a JSON schema to render stylish, highly customizable and fully managed forms.

**@maif/react-forms** use [yup](https://github.com/jquense/yup) and [react-hook-form](https://react-hook-form.com/) to build its forms

# Install

```bash
npm install @maif/react-forms
```
or
```bash
yarn add @maif/react-forms
```

# Usage
You must define a form flow (this is just a javascript array which that represent the rendering order of the form fields) and a schema (that is define all field of your form with type or constraints for example)

## example

```javascript
import { Form, type, constraints } from 'react-form'

export const Example = () => { 
  const schema = {
    age: {
      type: type.number,
      label: 'age',
      placeholder: 'Your age',
      help: "Just your age",
      constraints: [
        constraints.required("your age is required"),
        constraints.min(18, 'You must be an adult'),
        constraints.integer('half years are not accepted'),
      ]
    }, 
    name: {
      type: type.string,
      disabled: true,
      label: 'name',
      placeholder: 'your name',
      constraints: [
        constraints.required('Your name is required')
      ],
    }
  }

  const flow = ['name', 'age']

  return (
    <Form
        schema={schema}
        flow={flow}
        onChange={item => console.log({ item })}
      />
    )
}
```

## schema properties

- **type** : the type of value. It provided by the imported object `Type` and could be `string`, `number`, `bool`, `object`, `date` or `file`
- **format**: Over the type you can display a special format for the field. 
  - `array`: if the value is an array of basic type, display multiple fields with "add" and "remove" buttons
  - `select`: display a [react-select](https://react-select.com/home) field with provided options
  - `code`: if the type is `string`, display a code input (draw with [react-ace](https://github.com/securingsincity/react-ace))
  - `markdown`: if the type is `string`, display a markdown input
  - `text`: if the type is `string`, display a textarea
  - `email`: if the type is `string`, display an email input
  - `password`: if the type is `string`, display a password input
  - `hidden`: if the type is `string`, add an hidden input in your form
  - `form`: if the type is `object`, display a form in your form draw with given schema and flow.
- **isMulti**: if `select` format is choosen, `isMulti` property is to render a multiselect component
- **defaultKeyValue**: if the format is setup to object, this default key/value is set for all added entries
- **visible**: a boolean option to hide/display form field. It can be an object with `ref` property to get a value by reference an a key `test` as a function to test it. if there is no `test` key, it's base just on boolean value of the reference.
- **disabled**: A boolean option to enable/disable form field
- **label**: The label of form field
- **placeholder**: the placeholder of form field
- **defaultValue**: A default value to fill field y default
- **help**: the text display hover a help button
- **className**: you can customize classnames of field,
- **style**: to styling a field, you can provide a json object with css
- **render**: a function to completely custom the rendering of form field 
  ```javascript
  ({rawValues, value, onChange, error}) => <input type="text" className="is-invalid" value={value} onChange={e => onChange(e.target.value)} />
  ```
- **props**: a json object merged with default props
- **options**: An array of options for the select field (if format `select` is setup)
- **optionsFrom**: A url to fetch array of options for the select field (if format `select` is setup)
- **transformer**: A function to transform options to a valid format for react select, by default the code try to do it himself.
  ```javascript
  {
    transformer: (value) => ({label: value.name, value: value.age})
  }
  ```
- **schema**: a sub schema for the object value. this schema can contains constraints
- **constraints**: a JSON array of constraints. see [constraints section](#constraints)







## Form properties
- **schema**: the form schema
- **flow**: the flow
- **onChange**: a function run on the form submission (in case if the form is valid )
- **value**: default value
- **inputWrapper**: A custom component to wrap all input of the form
- **footer**: a component to override the footer provided
```javascripts
{({ reset, valid }) => {
            return (
              <div className="d-flex justify-content-end">
                <button className="btn btn-primary m-3" onClick={reset}>reset</button>
                <button className="btn btn-success m-3" onClick={valid}>accept</button>
              </div>
            )
          }}
```
- **httpClient**: a function to override the basic fetch used by react-forms to get async values (for optionsFrom)
```javascript
httpClient = {(url, method) => fetch(url, {
  method,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-foo': 'bar'
  }
})} 
```

## constraints
Possible constraints are provided by import `constraints` from **@maif/react-form**

  - [mixed](#mixed)
    - [`constraints.required(message?:string)`](#constraintsrequiredmessagestring)
    - [`constraints.test(name: string, message?:string, test: (val: any) => boolean | Promise<boolean>)`](#constraintstestname-string-messagestring-test-val-any--boolean--promiseboolean)
    - [`constraints.when(ref: string, test: (val: any) => boolean, then: any = [], otherwise: any = [])`](#constraintswhenref-string-test-val-any--boolean-then-any---otherwise-any--)
    - [`constraints.oneOf(arrayOfValues: any[], message?:string)`](#constraintsoneofarrayofvalues-any-messagestring)
  - [string](#string)
  - [string or number](#string-or-number)
  - [number](#number)
  - [array](#array)
  - [date](#date)
  - [file](#file)

### mixed
the following methods works for all type types of value.

#### `constraints.required(message?:string)`
  Mark the value as required, which will not allow `undefined` or `null` as a value.
  The provided message (or default message) will be display under form field as an error if the value is missing.

   ```javascript
  constraints.required("this field is required")
  ```

#### `constraints.test(name: string, message?:string, test: (val: any) => boolean | Promise<boolean>)`
  Adds a test function to the validation chain. The test must provide a `name`, an error `message` and a validation function that takes in entry the current value and must return a boolean result. The test can return a promise that resolve a boolean result

  ```javascript
  constraints.test("name", 'not fifou', value => value === 'fifou')
  ```

#### `constraints.when(ref: string, test: (val: any) => boolean, then: any = [], otherwise: any = [])`
  Adjust field constraints based on a sibling fileds given by `ref`. You can provide a matcher function with `test`. `Then` provides the true constraints and `otherwise` the constraints for failure condition

  ```javascript
  constraints.when(
    'isBig', 
    (isBig) => !!isBig, 
    [constraint.count(5)],
    [constraint.count(1)],)
  ```

#### `constraints.oneOf(arrayOfValues: any[], message?:string)`
  Whitelist a set of values and display an error under field if the provided value is not contains in this set.

  ```javascript
  constraints.oneOf(['foo', 'bar'], 'not foo or bar :(')
  ```

### string
the following methods works for string values. All methods for [mixed](#mixed) are available.

#### `constraints.url(message?:string)`
Validate that the provided value matches an url pattern via regexp and display an error if the result id false.

#### `constraints.email(message?:string)`
Validate that the provided value matches an email pattern via regexp and display an error if the result id false.

#### `constraints.uuid(message?:string)`
Validate that the provided value matches an uuid pattern via regexp and display an error if the result id false.

#### `constraints.matches(regexp: RegExp, message?:string)`
Test if value matche the provided regexp and display an error if the result id false.

```javascript
constraints.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,1000}$/, errorMessage)
```

### string or number
the following methods works for string or number values. All methods for [mixed](#mixed) are available.


#### `constraints.min(ref: number | Reference<number>, message: string)`
Set the minimum value allowed and display an error if the provided value (for a number) or the length of the string is bigger.

#### `constraints.max(ref: number | Reference<number>, message: string)`
Set the maximun value allowed and display an error if provided value (for a number) or the length of the string is smaller.

### number
The following methods works for number values. All methods for [mixed](#mixed) are available.

#### `constraints.positive(message?:string)`
The value must be a positive number and display an error if it's not.

#### `constraints.negative(message?:string)`
The value must be a negative number and display an error if it's not.

#### `constraints.integer(message?:string)`
The value must be aa integer number and display an error if it's not.

#### `constraints.lessThan(ref: number | Reference<number>, message: string)`
Set the maximun value allowed and display an error if provided value (for a number) or the length of the string is smaller.

#### `constraints.moreThan(ref: number | Reference<number>, message: string)`
Set the minimum value allowed and display an error if provided value (for a number) or the length of the string is bigger.

### array
the following methods works for basic types if the format is define to `array`. All methods for [mixed](#mixed) are available.

#### `constraints.length(value: number, message?:string)`
Set the length of the array and display an error if it's different.

### date
the following methods works for date values. All methods for [mixed](#mixed) are available.

### file
the following methods works for file values. All methods for [mixed](#mixed) are available.

#### `constraints.supportedFormat(arrayOfValues: string[], message?:string)`
Whitelist a set of supported format for the provided file and display an error under field if the format is not contains in this set.


#### `constraints.unsupportedFormat(arrayOfValues: string[], message?:string)`
Whitelist a set of unsupported format for the provided file and display an error under field if the format is contains in this set.

#### `constraints.maxSize(value: number, message?:string)`
Set the maximun value allowed for the file size and display an error if the size of provided file is bigger.