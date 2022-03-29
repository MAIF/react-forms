import React, { useState, useEffect, useRef } from 'react';
import { Form, CodeInput, SelectInput } from '@maif/react-forms'
import Select from 'react-select';
import AceEditor from 'react-ace';

import Beautify from 'brace/ext/beautify'
import 'brace/mode/json'
import 'brace/theme/monokai'
import 'brace/ext/searchbox'
import 'brace/ext/language_tools';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'

import basic from './schema/basic.json';
import constrainedBasic from './schema/constrainedBasic.json';
import constraintsWithRef from './schema/constraintsWithRef.json';
import simpleSelector from './schema/selector.json';
import formInForm from './schema/formInForm.json';
import dynamicForm from './schema/dynamicForm.json';

const examples = {
  basic,
  constrainedBasic,
  constraintsWithRef,
  simpleSelector,
  formInForm,
  dynamicForm
}

export const Playground = () => {
  const [schema, setSchema] = useState(JSON.stringify(basic, 0, 4))
  const [realSchema, setRealSchema] = useState(basic)
  const [error, setError] = useState(undefined)
  const [value, setValue] = useState({
    name: "foo"
  })
  const ref = useRef()

  useEffect(() => {
    try {
      setRealSchema(JSON.parse(schema))
    } catch (error) {
      setError(error.message)
    }
  }, [schema])

  useEffect(() => {
    setError(undefined)
  }, [realSchema])

  return (
    <div className="my-md-4 bd-layout">
      <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">react-forms playground</span>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="https://github.com/MAIF/react-forms#readme">Documentation</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="https://github.com/MAIF/react-forms">Project</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="container" style={{ marginTop: '70px' }}>
        <em className='tagline px-0 py-2'>Choose a JSON schema below and check the generated form. Check the <a href='https://github.com/MAIF/react-forms'>documentation</a> for more details.</em>
        <div className="d-flex">
          <div className='col-8' style={{ marginRight: '10px' }}>
            <label htmlFor="selector">Try with a schema</label>
            <SelectInput
              className="py-2"
              possibleValues={Object.keys(examples).map(value => ({ label: value, value }))}
              defaultValue={{ value: basic, label: "basic" }}
              onChange={e => setSchema(JSON.stringify(examples[e], null, 4))} />
            <CodeInput
              mode="json"
              onChange={setSchema}
              value={schema}
            />
            <label>Default value</label>
            <CodeInput
              mode="json"
              onChange={e => {
                try {
                  setValue(JSON.parse(e))
                } catch (_) { }
              }}
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            />
          </div>
          <div className='col-4 px-2'>
            <label>Generated form</label>
            {error && <span style={{ color: 'tomato' }}>{error}</span>}
            <div style={{ backgroundColor: '#ececec', padding: '10px 15px' }}>
              <Form
                schema={realSchema}
                value={value}
                flow={Object.keys(realSchema)}
                onSubmit={d => alert(JSON.stringify(d, null, 4))}
                options={{
                  watch: unsaved => ref?.current?.dispatch({
                    changes: {
                      from: 0,
                      to: ref.current.state.doc.length,
                      insert: JSON.stringify(unsaved, null, 4)
                    }
                  }),
                  actions: {
                    submit: {
                      label: 'Try it'
                    }
                  }
                }}
              />
            </div>
            <div className='py-2'>
              <label>Form state</label>
              <CodeInput
                setRef={r => ref.current = r}
                showGutter={false}
                mode="json"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Playground;
