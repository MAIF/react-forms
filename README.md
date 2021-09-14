# @MAIF/react-forms

**@MAIF/react-forms** is a React form builder with validation included. You just have to define a form flow and a JSON schema to render stylish and fully managed forms.

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