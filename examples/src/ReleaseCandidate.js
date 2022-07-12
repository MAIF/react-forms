import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import {
    Controller,
    useForm,
    useController,
    FormProvider,
    useWatch
} from "react-hook-form";

import { Form } from "@maif/react-forms";

const Listener = ({ control, onDataChange }) => {
    const data = useWatch({ control });
    onDataChange(data);

    return null;
};

const ControlledInput = ({ entry }) => {
    console.log(`render-controlled ${entry}`);

    const { field } = useController({
        name: entry
    });

    return <Input field={field} />;
};

const Input = ({ field }) => {
    console.log(`render-input ${field.name}`);
    return <input type="text" {...field} />;
};

export default function App() {
    const [state, setState] = useState({
        firstname: null,
        lastname: "Foo",
        age: 26
    });

    console.log(state);

    const schema = {
        firstname: {
            type: "string"
        },
        lastname: {
            type: "string"
        },
        skills: {
            type: 'object',
            format: 'form',
            array: true,
            schema: {
                competence: {
                    type: 'string'
                }
            }
        }
    };

    console.log(state)

    return (
        <>
            <Form
                value={state}
                schema={schema}
                options={{
                    autosubmit: true
                }}
                onSubmit={data => {
                    console.log(data)
                    setState(data)
                }}
            />
            <Toto data={state} />
        </>
    );
}

const Toto = ({ data }) => {
    return <h1>{JSON.stringify(data, null, 4)}</h1>;
};

const FormInstance = ({ onDataChange, value }) => {
    const form = useForm({
        defaultValues: value
    });
    const { handleSubmit, control, reset } = form;

    return (
        <>
            <FormProvider {...form}>
                <form onSubmit={handleSubmit((data) => console.log(data))}>
                    <ControlledInput entry="firstname" />
                    <ControlledInput entry="lastname" />
                    <ControlledInput entry="age" />
                    <button type="submit">Submit</button>
                </form>
                <Listener control={control} onDataChange={onDataChange} />
            </FormProvider>

            <button
                onClick={() =>
                    reset(
                        {
                            //firstname: "Quentin"
                        },
                        {
                            keepDefaultValues: true
                        }
                    )
                }
            >
                RESET
            </button>
            {/*<SimpleInput entry="firstname" value={state.firstname} onChange={onChange} />
      <SimpleInput entry="lastname" value={state.lastname} onChange={onChange} />*/}
        </>
    );
};
