# @MAIF/react-forms

**@MAIF/react-forms** is a React form builder with batteries included. You just have to define a form flow and a JSON schema to render stylish, highly customizable and fully managed forms.

**@MAIF/react-forms** use [yup](https://github.com/jquense/yup) and [react-hook-form](https://react-hook-form.com/) to build its forms

# Install

```bash
npm install @MAIF/react-forms
```
or
```bash
yarn add @MAIF/react-forms
```

# Usage
You must define a form flow (this is just a javascript array which that represent the rendering order of the form fields) and a schema (that is define all field of your form with type or constraints for example)

## example

```javascript
import { Form, Types, constraints } from 'react-form'

export const Example = () => { 
  const schema = {
    age: {
      type: Types.number,
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
      type: Types.string,
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
  - `select`: display a react-select field with provided options
  - `markdown`: if the type is `string`, display a markdown input
  - `text`: if the type is `string`, display a textarea
  - `password`: if the type is `string`, display a password input
  - `hidden`: if the type is `string`, add an hidden input in your form
- **isMulti**: if `select` format is choosen, `isMulti` property is to render a multiselect component
- **defaultKeyValue**: if the format is setup to object, this default key/value is set for all added entries
- **disabled**: A boolean option to enable/disable form field
- **label**: The label of form field
- **placeholder**: the placeholder of form field
- **defaultValue**: A default value to fill field y default
- **help**: the text display hover a help button
- **className**: you can customize classnames of field,
- **style**: to styling a field, you can provide a json object with css
- **render**: a function to completely custom the rendering of form field 
  ```javascript
  ({value, onChange}) => <input type="text" className="is-invalid" value={props.value} onChange={e => props.onChange(e.target.value)} />
  ```
- **props**: a json object merged with default props
- **options**: An array of options for the select field (if format `select` is setup)
- **optionsFrom**: A url to fetch array of options for the select field (if format `select` is setup)
- **schema**: a sub schema for the object value. this schema can contains constraints
- **constraints**: a JSON array of constraints. see [constraints section](#constraints)

## constraints
Possible constraints are provided by import `constraints` from **@MAIF/recat-form**

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
  Whitelist a set of values and display an error under field if the provided value in not contains in this set.

  ```javascript
  constraints.oneOf(['foo', 'bar'], 'not foo or bar :(')
  ```

### string

### string or number

### number

### array

### date

### file