# @maif/react-forms

**@maif/react-forms** is a React form builder with batteries included. You just have to define a form flow and a JSON schema to render stylish, highly customizable and fully managed forms.

**@maif/react-forms** use [yup](https://github.com/jquense/yup) and [react-hook-form](https://react-hook-form.com/) to build its forms

# Playground
If you think that an example will explain it better, you can go right now to our [react-forms playground](https://maif.github.io/react-forms/) to discover a couple of examples with an inline editor. 

# Install

```bash
npm install @maif/react-forms
```
or
```bash
yarn add @maif/react-forms
```

# Usage
You must define a form flow (this is just a javascript array which represents the rendering order of the form fields) and a schema (that defines all fields of your form with types or constraints for example)
You can import the default stylesheet or use your own style by using default classname or passing a classname in your schema.

## example

```javascript
import { Form, type, format, constraints } from '@maif/react-forms'
import '@maif/react-forms/lib/index.css'

export const Example = () => { 
  const schema = {
    age: {
      type: type.number,
      label: 'age',
      placeholder: 'Your age',
      help: "Just your age",
      className: "input-number",
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
        onSubmit={item => console.log({ item })}
      />
    )
}
```

## schema properties

- **type** (required): the type of value. It provided by the imported object `type`. It could be just string like `string`, `number`, `bool`, `object`, `date` or `file`
- **format**: Over the type you can display a special format for the field. It is provided by the imported object `format` or just a string
  - `select`: display a [react-select](https://react-select.com/home) field with provided options
  - `buttonsSelect`: display a buttons group, drawn with the same options than the format `select`. You can add the property `isClearable` as boolean to `props` to add the ability to unselect value. This format also works to display two buttons instead of a switch for `type.bool` (add props `truelabel` & `falseLabel` to customize buttons display).
  - `code`: if the type is `string`, display a code input (draw with [react-ace](https://github.com/securingsincity/react-ace)) (add a props.setRef to get ace editor ref)
  - `singleLineCode`: renders text input with syntax highlighting (draw with [react-ace](https://github.com/securingsincity/react-ace)) (add a props.setRef to get ace editor ref)
  - `markdown`: if the type is `string`, display a markdown input. You can add buttons into toolbar by inject a JSX.element thanks to the `actions` property from `props` taking on params the insert function.
    ```javascript
      {
        text: {
          type: type.string,
          format: format.markdown,
          props: {
            actions: (insert) => <button type="button" onClick={() => insert("foo")}>inject foo</button>
          }
        }
      }
    ```
  - `textarea`: if the type is `string`, display a textarea
  - `email`: if the type is `string`, display an email input
  - `password`: if the type is `string`, display a password input
  - `hidden`: if the type is `string`, add an hidden input in your form
  - `form`: if the type is `object`, display a form in your form draw with given schema and flow. The form drawn is `collapsable`, you can choose which field will be visble or not by setting up the `visibleOnCollapse` props on subschema element properties. `collapsable` can be a boolean or a function to render JSX (with `rawValues`, `value` & `getValue` params)
    ```javascript
      {
        collapsable: ({rawValue, value, getValue}) => <span>{value.firstname} {value.name}</span>
      }
    ```
- **array**: boolean value to display multiple fields with "add" and "remove" buttons (`false` by default). You can define `addabledefaultvalue` to ensure the default value for the new input.
- **createOption**: if `select` format is choosen, `createOption` property is to render a Creatable component
- **onCreateOption**: if `select` format is choosen, `onCreateOption` property is a function called before new option creation
  ```javascript
  {
    onCreateOption: (option) => myFunction(option)
  }
  ```
- **isMulti**: if `select` format is choosen, `isMulti` property is to render a multiselect component
- **defaultKeyValue**: if `object` format is choosen, this default key/value is set for all added entries
- **visible**: a boolean or [functional boolean](#functional-properties) option to hide/display form field.
- **disabled**: A boolean or [functional boolean](#functional-properties) option to enable/disable form field
- **label**: A string or [functional string](#functional-properties) to labelize of form field (you can pass `null` to not render a label)
- **placeholder**: the placeholder of form field
- **defaultValue**: A default value to fill field by default
- **help**: the text display hover a help button
- **className**: you can customize classnames of field,
- **style**: to styling a field, you can provide a json object with css
- **onChange**: a callback function to the value change. 
  ```javascript
  ({rawValues, value, setValue}) => if (value.length) { setValue('entry', false) }
  ```
- **onAfterChange**: a callback function to the value change.
  ```javascript
  ({entry, value, rawValues, previousValue, getValue, setValue, onChange, informations}) => {
    const otherEntryVal = getValue('otherEntry')
    console.debug({entry, value, rawValues, otherEntryVal})
    setValue('anotherEntry', v + 1)
    const {path, parent, index} = informations
    console.debug({path, parent, index})
  }
  ```
  where :
  - entry [string] is the updated entry of schema
  - value [any] is the actual value of your entry
  - previousValue [any] is the previous value of your entry
  - rawValues [any] is the actual value of entire form
  - getValue [function] is a function to get value of a form entry
  - setValue [function] is a function to set value of a form entry
  - onSave [function] is a function to update actual entry
  - informations [Information] is an object to get informations about the actual entry (path, index and parent informations)

- **render**: a function to completely custom the rendering of form field 
  ```javascript
  ({rawValues, value, onChange, error, setValue, parent}) => <input type="text" className="is-invalid" value={value} onChange={e => onChange(e.target.value)} />
  ```
  You can use the `parent` field, to change a field of the current element (very useful when you have a list of forms, and you want to change a field different from your current element)

  ```javascript
  ({ setValue, parent }) => <input onChange={e => setValue(`${parent}.anotherField`, e.target.value)}>
  ```

- **itemRender**: a function to completely custom the rendering of form field items (Just in case of `array` is true)
  ```javascript
  ({rawValues, value, onChange, error}) => <input type="text" className="is-invalid" value={value} onChange={e => onChange(e.target.value)} />
  ```
- **props**: a json object merged with default props. For exemple, if format `select` is setup, you can add all [props](https://react-select.com/props) to customize react-select
- **options**: An array of options for the select field (if format `select` is setup)
- **optionsFrom**: this property is setup to get options with a promise (if format `select` is selected). It offer multiple possibility to get its:
   - A url to fetch array of options for the select field. The array can be transform by the `transformer` provided
   - A promise returning an array, which can be transform by the `transformer` provided
   - a function returning a promise (see up) or directly an array of value
- **transformer**: A function to transform options to a valid format for react select, by default the code try to do it himself.
  ```javascript
  {
    transformer: (value) => ({label: value.name, value: value.age})
  }
  ```
- **schema**: a sub schema for the object value. this schema can contains constraints
- **conditionalSchema**: an object to conditionnaly render an object value. Contains a `ref` to test as string and a `switch` as an array of object which contains `default` for a boolean options to set default value, `condition` as a function to run or just a value to test against ref value and `schema` and `flow` to draw the object value.
  ```javascript
  {
    type: {
      type: type.string,
      format: format.select,
      defaultValue: "mammal",
      options: ["mammal", "fish"]
    },
    place: {
      type: type.object,
      format: format.form,
      conditionalSchema: {
        ref: 'type',
        switch: [
          {
            default: true,
            condition: ({rawValues, ref}) => ref === "mammal",
            schema: {
              continent: {
                type: type.string,
              },
              country: {
                type: type.string,
              }
            }
          },
          {
            condition: "fish",
            schema: {
              ocean: {
                type: type.string,
              },
              deepness: {
                type: type.number,
              }
            }
          },
        ]
      }
    }
  }
  ```
- **constraints**: a JSON array of constraints. see [constraints section](#constraints)
- **arrayConstraints**: a JSON array of constraints apply to the entire array (use constraints to apply constraints to inner fileds of array). see [constraints section](#constraints)
- **deps**: In case of the entry need some form values, thestepwill be re-render after all change. To avoid some perf issues, it would be nice to declare a deps array to listen. The array must contains the root path
  ```javascript
  const schema = {
    one: { type: type.string },
    foo: {
      type: type.object,
      format:format.form,
      schema: {
        foo: { type: type.string },
        bar: { type: type.string },
      }
    },
    two: { type: type.string },
    three: {
      type: type.string,
      deps: ['one', 'foo.bar'],
      visible: ({ rawValues }) => rawValues.one === '1' || rawValues.foo.bar === 'foo'
    },
  }

  ```
- **item**: In case of the entry is an array, some properties will be applied to the array step but not to the sub-items. In this particular case, you can use `item` property to add following properties (with same signature than the schema properties) to sub-items:
  - **disabled**
  - **visible**
  - **label**
  - **onChange**
  - **onAfterChange**
  - **render**
  - **array**

### Functional properties
Some schema properties can be basic value or function which return basic value. This function has an object as param with these following properties :
- **rawValues**: the actual value of antire form
- **value**: the actual value of the actual entry
- **error**: the error of the entry (undefined if there is no error)
- **informations**: an object to get informations about the actual entry (path, key, index and parent informations)
- **getValue**: a function to get value of a form entry


## Form properties
- **schema** (required): the form schema
- **flow** (optional): the flow. The order of the schema fields by key (Just a javascript array of strings). Fields can be group on collapsable item, in this case, you can add an object with `label`, `flow` and a boolean `collapse` property. Collapse item can draw inline form thanks to boolean `inline` property
- **onSubmit** (required): a function run on the form submission (in case if the form is valid )
- **value** (optional): default value
- **inputWrapper** (optional): A custom component to wrap all input of the form
- **className** (optional): A custom class name for the form
- **footer** (optional):  a component to override the footer provided
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
- **options** (optional):  an object to put some options for your form. see [Form options](#form-options) for more informations.

## Form options
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
- **watch**: a boolean to activate the automatic log of form value. A function can be set up to override the default logger.
- **autosubmit**: a boolean to activate the automatic run of the `onSubmit` form properties on every change of values.
- **showErrorsOnStart**: a boolean to display constraints messages, not in error color,  when starting the form.
- **actions**: an object to parameter footer buttons key. By default just `submit` button is displayed. Allow to change button label for the following actions:
  - reset
  - cancel
  - submit
  - add
```javascript
<Form 
  options={
    autosubmit: true,
    showErrorsOnStart: true,
    actions={
        reset: {
          display: false (value by default)
          label: 'reset' (value by default)
        },
        submit: {
          display: true (value by default)
          label: "save" (value by default)
        }
      }
  }
/>
```
## constraints
Possible constraints are provided by import `constraints` from **@maif/react-form** or can be wrotes on json
By default all fields of the form are nullable (they can accept `null` or `undefined` value). 

  - [mixed](#mixed)
    - [`constraints.required(message?:string)`](#constraintsrequiredmessagestring)
    - [`constraints.test(name: string, message?:string, test: (val: any) => boolean | Promise<boolean>)`](#constraintstestname-string-messagestring-test-val-any--boolean--promiseboolean)
    - [`constraints.when(ref: string, test: (val: any) => boolean, then: any = [], otherwise: any = [])`](#constraintswhenref-string-test-val-any--boolean-then-any---otherwise-any--)
    - [`constraints.oneOf(arrayOfValues: any[], message?:string)`](#constraintsoneofarrayofvalues-any-messagestring)
    - [`constraints.ref(ref: any)`](#constraintsrefrefany)
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
  ```javascript
  {type: 'required', message: "this field is required"}
  ```

#### `constraints.test(name: string, message?:string, test: (val: any) => boolean | Promise<boolean>)`
  Adds a test function to the validation chain. The test must provide a `name`, an error `message` and a validation function that takes in entry the current value and must return a boolean result. The test can return a promise that resolve a boolean result

  ```javascript
  constraints.test("name", 'not fifou', value => value === 'fifou')
  ```
  ```javascript
  {type: 'test', name: "name", message: 'not fifou', test: value => value === 'fifou'}
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
  ```javascript
  {
    type: 'when', 
    ref: 'isBig', 
    test: (isBig) => !!isBig,
    then: [constraint.count(5)],
    otherwise: [constraint.count(1)],
  }
  ```

#### `constraints.oneOf(arrayOfValues: any[], message?:string)`
  Whitelist a set of values and display an error under field if the provided value is not contains in this set.
  Values can also be a [`reference`](#constraintsrefrefany) of value

  ```javascript
  constraints.oneOf(['foo', 'bar'], 'not foo or bar :(')
  ```
  ```javascript
  {type: 'oneOf', arrayOfValues: ['foo', 'bar'], message: 'not foo or bar :('}
  ```

#### `constraints.ref(ref:any)`
  Some constraints accepts reference as property. This methods create a reference to another field.
  Refs are evaluated in the proper order so that the ref value is resolved before the field using the ref (be careful of circular dependencies!).

   ```javascript
    const schema = {
      dad_age: { type: type.number},
      son_age: {
          type: type.number,
          constraints: [
            constraints.lessThan(constraints.ref('dad_age'), 'too old')
          ]
        }
    }
  ```
  ```javascript
const schema = {
      dad_age: { type: 'number'},
      son_age: {
          type: 'number',
          constraints: [
            {type: 'lessThan', ref: { ref: 'dad_age' }, message: 'too old !'}
          ]
        }
    }
  ```

### string
the following methods works for string values. All methods for [mixed](#mixed) are available.

#### `constraints.url(message?:string)`
Validate that the provided value matches an url pattern via regexp and display an error if the result id false.
 ```javascript
  constraints.oneOf(['foo', 'bar'], 'not foo or bar :(')
  ```
  ```javascript
  {type: 'oneOf', arrayOfValues: ['foo', 'bar'], message: 'not foo or bar :('}
  ```

#### `constraints.email(message?:string)`
Validate that the provided value matches an email pattern via regexp and display an error if the result id false.
```javascript
{type: 'email', message: 'not an email'}
```
#### `constraints.uuid(message?:string)`
Validate that the provided value matches an uuid pattern via regexp and display an error if the result id false.
```javascript
{type: 'uuid', message: 'not an uuid'}
```
#### `constraints.matches(regexp: RegExp, message?:string)`
Test if value matche the provided regexp and display an error if the result id false.

```javascript
constraints.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,1000}$/, errorMessage)
```
```javascript
{type: 'matches', regexp: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,1000}$/, message: 'error'}
```

### string or number
the following methods works for string or number values. All methods for [mixed](#mixed) are available.


#### `constraints.min(ref: number | Reference<number>, message: string)`
Set the minimum value allowed and display an error if the provided value (for a number) or the length of the string is bigger. Provided value can be a number or a [`reference`](#constraintsrefrefany) to a number
```javascript
{type: 'min', ref: 1, message: 'too small'}
```

#### `constraints.max(ref: number | Reference<number>, message: string)`
Set the maximun value allowed and display an error if provided value (for a number) or the length of the string is smaller. value can be a number or a [`reference`](#constraintsrefrefany) to a number
```javascript
{type: 'max', ref: 5, message: 'too high'}
```

### number
The following methods works for number values. All methods for [mixed](#mixed) are available.

#### `constraints.positive(message?:string)`
The value must be a positive number and display an error if it's not.
```javascript
{type: 'positive', message: 'positive please'}
```
#### `constraints.negative(message?:string)`
The value must be a negative number and display an error if it's not.
```javascript
{type: 'negative', message: 'negative please'}
```

#### `constraints.integer(message?:string)`
The value must be aa integer number and display an error if it's not.
```javascript
{type: 'integer', message: 'integer please'}
```

#### `constraints.lessThan(ref: number | Reference<number>, message: string)`
Set the maximun value allowed and display an error if provided value (for a number) or the length of the string is smaller. value can be a number or a [`reference`](#constraintsrefrefany) to a number
```javascript
{type: 'lessThan', ref: 5, message: 'less please'}
```

#### `constraints.moreThan(ref: number | Reference<number>, message: string)`
Set the minimum value allowed and display an error if provided value (for a number) or the length of the string is bigger. value can be a number or a [`reference`](#constraintsrefrefany) to a number
```javascript
{type: 'moreThan', ref: 5, message: 'more please'}
```

### array
the following methods works for basic types if the format is define to `array`. All methods for [mixed](#mixed) are available.

#### `constraints.length(value: number | Reference<number>, message?:string)`
Set the length of the array and display an error if it's different. value can be a number or a [`reference`](#constraintsrefrefany) to a number
```javascript
{type: 'length', ref: 5, message: 'this array must have 5 elements'}
```

### date
the following methods works for date values. All methods for [mixed](#mixed) are available.

### file
the following methods works for file values. All methods for [mixed](#mixed) are available.

#### `constraints.supportedFormat(arrayOfValues: string[], message?:string)`
Whitelist a set of supported format for the provided file and display an error under field if the format is not contains in this set.
```javascript
{type: 'supportedFormat', arrayOfValues: ['jpg', 'jpeg', 'png'], message: 'unsupported format'}
```


#### `constraints.unsupportedFormat(arrayOfValues: string[], message?:string)`
Whitelist a set of unsupported format for the provided file and display an error under field if the format is contains in this set.
```javascript
{type: 'unsupportedFormat', arrayOfValues: ['jpg', 'jpeg', 'png'], message: 'unsupported format'}
```

#### `constraints.maxSize(value: number, message?:string)`
Set the maximun value allowed for the file size and display an error if the size of provided file is bigger.
```javascript
{type: 'maxSize', message: 'file size too big'}
```
