import React, { useState, useEffect, useRef } from 'react';
import { Form, CodeInput, SelectInput } from '@maif/react-forms'

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'

import basic from './schema/basic.json';
import largeForm from './schema/largeForm';
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
  const [schema, setSchema] = useState(JSON.stringify(basic, 0, 2))
  const [realSchema, setRealSchema] = useState(basic)
  const [error, setError] = useState(undefined)
  const [value, setValue] = useState()
  const [selectedSchema, setSelectedSchema] = useState({ value: basic, label: "basic" })
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
      <div className="container" style={{ marginTop: '70px' }}>
        <em className='tagline px-0 py-2'>Choose a JSON schema below and check the generated form. Check the <a href='https://github.com/MAIF/react-forms'>documentation</a> for more details.</em>
        <div className="d-flex">
          <div className='col-8' style={{ marginRight: '10px' }}>
            <label htmlFor="selector">Try with a schema</label>
            <SelectInput
              className="py-2"
              possibleValues={Object.entries(examples)}
              transformer={([k, v]) => ({ label: k, value:v })}
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
                } catch (err) {
                  console.log(err)
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
                  // options={{
                  //   watch: unsaved => {
                  //     ref?.current?.dispatch({
                  //       changes: {
                  //         from: 0,
                  //         to: ref.current.state.doc.length,
                  //         insert: JSON.stringify(unsaved, null, 2)
                  //       }
                  //     })
                  //   },
                  //   actions: {
                  //     submit: {
                  //       label: 'Try it'
                  //     }
                  //   }
                  // }}
                />
              </WrapperError>
            </div>
            <div className='py-2'>
              <label>Form state</label>
              {/* <CodeInput
                setRef={r => ref.current = r}
                showGutter={false}
                mode="json"
              /> */}
            </div>
          </div>
        </div>
      </div>
  )
}

export default Playground;
