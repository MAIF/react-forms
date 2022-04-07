const schema = `{
    "users": {
        type: "object",
        format: "form",
        array: true,
        schema: {
            fullname: {
                type: "string",
                render: (props) => {
                    const { setValues, setValue, value, onChange } = props
                    return <input
                        type="text"
                        onChange={e => onChange(e.target.value)}
                        value={value}
                    />
                }

            },
            firstname: {
                type: "string"
            },
            lastname: {
                type: "string"
            }
        }
    }
}`

export default schema