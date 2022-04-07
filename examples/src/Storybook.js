import { Form, type as types, constraints } from "@maif/react-forms";
import React, { useState } from "react";
import WrapperError from "./WrapperError";
import schema from "./schema/storybook.json";

const Storybook = () => {
  const [filter, setFilter] = useState(types.string);
  return (
    <div className="container" style={{ marginTop: "70px" }}>
      <div className="d-flex">
        <div className="col-3" style={{ marginRight: "10px" }}>
          <div
            style={{
              backgroundColor: "#ececec",
              marginTop: "25px",
              marginRight: "15px",
              padding: "15px"
            }}
          >
            <b>Filter</b>
            <ul>
              {Object.keys(types).map((type) => (
                <li
                  key={`filter-${type}`}
                  onClick={() => setFilter(type)}
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: type === filter ? "bold" : "normal"
                  }}
                >
                  {type}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-9" style={{ marginRight: "10px" }}>
            {Object.keys(schema)
              .map((item) => ({ key: item, ...schema[item] }))
              .filter(({ type }) => filter === type)
              .map(({ key, ...item }, index) => (
                <WrapperError key={`form-${key}-${index}`}>
                  <label style={{ fontWeight: "bold" }}>
                    Input type {item.type}
                    {item.format && ` (format: ${item.format})`}
                  </label>
                  <div
                    style={{
                      backgroundColor: "#ececec",
                      padding: "10px 15px",
                      marginBottom: "15px"
                    }}
                  >
                    <Form
                      schema={{
                        [key]: {
                          constraints: [
                            constraints.required(`${key} is required`)
                          ],
                          ...item
                        }
                      }}
                      flow={[key]}
                      onSubmit={(d) => alert(JSON.stringify(d, null, 2))}
                      options={{actions:{submit:{label:"Show It!"}}}}
                    />
                  </div>
                </WrapperError>
              ))}
        </div>
      </div>
    </div>
  );
};
export default Storybook;
