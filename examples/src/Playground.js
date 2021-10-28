import React, { useState, useEffect } from 'react';
import { Form } from '@maif/react-forms'
import Select from 'react-select';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-html'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/mode-markdown'
import 'ace-builds/src-noconflict/theme-monokai'
import 'ace-builds/src-noconflict/ext-searchbox'
import 'ace-builds/src-noconflict/ext-language_tools'

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
    <div className="container-xxl my-md-4 bd-layout">
      <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">react-forms playground</span>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link active" aria-current="page" href="#">Home</a>
              </li>
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
      <div className="container" style={{marginTop: '70px'}}>
        <em className='tagline'>Choose a JSON schema below and check the generated form. Check the <a href='https://github.com/MAIF/react-forms'>documentation</a> for more details.</em>
        <div className="d-flex">
          <div className='col-6' style={{marginRight: '10px'}}>
            <label htmlFor="selector">try with a schema</label>
            <Select
              options={Object.keys(examples).map(value => ({ label: value, value }))}
              defaultValue={{ value: basic, label: "basic" }}
              onChange={e => setSchema(JSON.stringify(examples[e.value], null, 4))} />
            <AceEditor
              style={{ marginTop: '15px', zIndex: 0, isolation: 'isolate', width: '100%' }}
              mode="json"
              theme="monokai"
              onChange={setSchema}
              value={schema}
              name="scriptParam"
              editorProps={{ $blockScrolling: true }}
              showGutter={true}
              tabSize={2}
              highlightActiveLine={true}
              enableBasicAutocompletion={false}
              enableLiveAutocompletion={false}
            />
          </div>
          <div className='col-4'>
            <h2>Generated form</h2>
            {error && <span style={{ color: 'tomato' }}>{error}</span>}
            <div style={{backgroundColor: '#ececec', padding: '10px 15px'}}>
              <Form
                schema={realSchema}
                flow={Object.keys(realSchema)}
                onSubmit={d => alert(JSON.stringify(d, null, 4))}
                options={{
                  actions: {
                    submit: {
                      label: 'Try it'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default Playground;
