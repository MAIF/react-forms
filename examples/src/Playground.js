import React, { useState, useEffect, useRef } from "react";
import { Form, CodeInput } from "@maif/react-forms";
import Select from "react-select";
import "./App.css";
import "@maif/react-forms/lib/index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import lzString from "lz-string";

import basic from "./schema/basic.json";
import formArray from "./schema/formArray";
import constrainedBasic from "./schema/constrainedBasic.json";
import constraintsWithRef from "./schema/constraintsWithRef.json";
import simpleSelector from "./schema/selector.json";
import formInForm from "./schema/formInForm.json";
import dynamicForm from "./schema/dynamicForm.json";
import * as babel from "babel-standalone";
import WrapperError from "./WrapperError";

const examples = {
  basic,
  formArray,
  constrainedBasic,
  constraintsWithRef,
  simpleSelector,
  formInForm,
  dynamicForm,
};

function setSearchParam(key, value) {
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set(key, lzString.compressToEncodedURIComponent(value));
  const newRelativePathQuery =
    window.location.pathname + "?" + searchParams.toString();
  window.history.pushState(null, "", newRelativePathQuery);
}

function clearSearchParam(key) {
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.delete(key);
  const newRelativePathQuery =
    window.location.pathname + "?" + searchParams.toString();
  window.history.pushState(null, "", newRelativePathQuery);
}

function readSearchparam(key) {
  let param = undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    param = lzString.decompressFromEncodedURIComponent(params.get(key));
  } catch (e) {}

  return param !== "null" ? param : undefined;
}

export const Playground = () => {
  let maybeSchema = readSearchparam("schema");
  try {
    maybeSchema = JSON.parse(maybeSchema);
  } catch (_) {}
  const maybeFlow = readSearchparam("flow");
  const [schema, setSchema] = useState(maybeSchema || basic);
  const [realSchema, setRealSchema] = useState(basic);
  const [error, setError] = useState(undefined);
  const [value, setValue] = useState();
  const [selectedSchema, setSelectedSchema] = useState({
    value: basic,
    label: maybeSchema || maybeFlow ? "loaded from url" : "basic",
  });
  const [flow, setFlow] = useState(
    maybeFlow ? JSON.parse(maybeFlow) : undefined
  );
  const ref = useRef();
  const childRef = useRef();
  const formRef = useRef();
  const codeInputRef = useRef();
  useEffect(() => {
    if (codeInputRef.current.hasFocus) {
      let maybeFormattedSchema = schema;
      try {
        maybeFormattedSchema = JSON.parse(schema);
      } catch (_) {}

      const strParam =
        typeof maybeFormattedSchema === "object"
          ? JSON.stringify(maybeFormattedSchema)
          : maybeFormattedSchema;

      setSearchParam("schema", strParam);
    }
  }, [schema]);

  useEffect(() => {
    if (childRef.current) childRef.current.reset();
    babelize(schema);
  }, [schema]);

  useEffect(() => {
    setError(undefined);
  }, [realSchema]);

  const babelize = (e) => {
    try {
      const code = `() => { try { return ${
        typeof e === "object" ? JSON.stringify(e, null, 2) : e
      } } catch(err) {} }`;
      const babelCode = babel.transform(code, {
        presets: ["react", "es2015"],
      }).code;

      const generatedCode = babelCode.replace('"use strict";', "").trim();
      const func = new Function("React", `return ${generatedCode}`);
      const res = func(React)();
      if (res) setRealSchema(res);
    } catch (_) {}
  };

  return (
    <div className="container" style={{ marginTop: "70px" }}>
      <em className="tagline px-0 py-2">
        Choose a JSON schema below and check the generated form. Check the{" "}
        <a href="https://github.com/MAIF/react-forms">documentation</a> for more
        details.
      </em>
      <div className="d-flex">
        <div className="col-8" style={{ marginRight: "10px" }}>
          <label htmlFor="selector">Try with a schema</label>
          <Select
            className="py-2"
            options={Object.entries(examples).map(([k, v]) => ({
              label: k,
              value: v,
            }))}
            value={selectedSchema}
            onChange={(e) => {
              clearSearchParam("schema");
              clearSearchParam("flow");
              setFlow(undefined);
              setSelectedSchema(e);
              setSchema(e.value);
            }}
          />
          <div id="schema-container">
            <CodeInput
              mode="javascript"
              onChange={(e) => {
                setSchema(e);
              }}
              value={
                typeof schema === "object"
                  ? JSON.stringify(schema, null, 2)
                  : schema
              }
              setRef={(ref) => (codeInputRef.current = ref)}
            />
          </div>
          <label>Flow</label>
          <CodeInput
            mode="json"
            onChange={(e) => {
              try {
                const maybeFlow = JSON.parse(e);
                if (childRef.current) childRef.current.reset();
                if (Array.isArray(maybeFlow)) {
                  setSearchParam("flow", JSON.stringify(maybeFlow));
                  setFlow(maybeFlow);
                } else {
                  clearSearchParam("flow");
                  setFlow(undefined);
                }
              } catch (err) {
                clearSearchParam("flow");
                setFlow(undefined);
              }
            }}
            value={JSON.stringify(flow)}
          />
          <label>Default value</label>
          <CodeInput
            mode="json"
            onChange={(e) => {
              try {
                setValue(JSON.parse(e));
              } catch (_) {}
            }}
            value={
              typeof value === "object" ? JSON.stringify(value, null, 2) : value
            }
          />
        </div>
        <div className="col-4 px-2">
          <label>Generated form</label>
          {error && <span style={{ color: "tomato" }}>{error}</span>}
          <div id="form-container" style={{ backgroundColor: "#ececec", padding: "10px 15px" }}>
            <WrapperError ref={childRef}>
              <Form
                ref={formRef}
                schema={realSchema}
                value={value}
                flow={flow || Object.keys(realSchema)}
                onSubmit={(d) => {
                  localStorage.setItem("value", JSON.stringify(d))
                  console.log(JSON.stringify(d, null, 4))}
                }
                options={{
                  watch: (unsaved) => {
                    ref?.current?.dispatch({
                      changes: {
                        from: 0,
                        to: ref.current.state.doc.length,
                        insert: JSON.stringify(unsaved, null, 2),
                      },
                    });
                  },
                  actions: {
                    submit: {
                      label: "Try it",
                    },
                  },
                }}
              />
            </WrapperError>
          </div>
          <div className="py-2">
            <label>Form state</label>
            <CodeInput
              setRef={(r) => (ref.current = r)}
              showGutter={false}
              mode="json"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
