import React, { useState, useEffect, useRef } from 'react';
import { Form, CodeInput, SelectInput } from '@maif/react-forms'

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'

import basic from './schema/basic.json';
import largeForm from './schema/largeForm.json';
import formArray from './schema/formArray';
import constrainedBasic from './schema/constrainedBasic.json';
import constraintsWithRef from './schema/constraintsWithRef.json';
import simpleSelector from './schema/selector.json';
import formInForm from './schema/formInForm.json';
import dynamicForm from './schema/dynamicForm.json';
import * as babel from 'babel-standalone'
import WrapperError from './WrapperError';

const examples = {
  basic,
  largeForm,
  formArray,
  constrainedBasic,
  constraintsWithRef,
  simpleSelector,
  formInForm,
  dynamicForm
}

export const Playground = () => {
  const [schema, setSchema] = useState(JSON.stringify(largeForm, 0, 2))
  const [realSchema, setRealSchema] = useState(largeForm)
  const [error, setError] = useState(undefined)
  const [value, setValue] = useState()
  const [selectedSchema, setSelectedSchema] = useState({ value: largeForm, label: "largeForm" })

  const ref = useRef()
  const childRef = useRef()
  const formRef = useRef()

  useEffect(() => {
    if (childRef.current)
      childRef.current.reset()
    babelize(schema)
  }, [schema])

  useEffect(() => {
    setError(undefined)
  }, [realSchema])

  const babelize = e => {
    try {
      const code = `() => { try { return ${(typeof e === 'object' ? JSON.stringify(e, null, 2) : e)} } catch(err) {} }`
      const babelCode = babel.transform(code, { presets: ['react', 'es2015'] }).code;

      const generatedCode = babelCode.replace('"use strict";', "").trim()
      const func = new Function("React", `return ${generatedCode}`);
      const res = func(React)()
      if (res)
        setRealSchema(res)
    } catch (_) {

    }
  }

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
              possibleValues={Object.entries(examples)}
              transformer={([key, value]) => ({ label: key, value })}
              value={selectedSchema}
              onChange={e => {
                setSelectedSchema(e)
                setSchema(e)
              }}
            />
            <CodeInput
              mode="javascript"
              onChange={e => {
                try {
                  setSchema(e)
                } catch (error) {
                  console.log(error)
                }
              }}
              value={typeof schema === 'object' ? JSON.stringify(schema, null, 2) : schema}
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
              <WrapperError ref={childRef}>
                <Form
                  ref={formRef}
                  schema={realSchema}
                  value={value}
                  flow={Object.keys(realSchema)}
                  onSubmit={d => alert(JSON.stringify(d, null, 2))}
                  options={{
                    watch: unsaved => {
                      ref?.current?.dispatch({
                        changes: {
                          from: 0,
                          to: ref.current.state.doc.length,
                          insert: JSON.stringify(unsaved, null, 2)
                        }
                      })
                    },
                    actions: {
                      submit: {
                        label: 'Try it'
                      }
                    }
                  }}
                />
              </WrapperError>
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
