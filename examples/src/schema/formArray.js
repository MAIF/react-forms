const schema = `{
    "users": {
        type: "object",
        format: "form",
        array: true,
        onAfterChange: ({ getFieldValue, onChange }) => {
            const firstname = getFieldValue('firstname') || ''
            const lastname = getFieldValue('lastname') || ''
            onChange('fullname', firstname + ' ' + lastname)
        },
        schema: {
            fullname: {
                type: "string"
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