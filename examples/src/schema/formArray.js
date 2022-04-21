const schema = `{
    "users": {
        type: "object",
        format: "form",
        array: true,
        onAfterChange: ({ setValue, entry, previousValue, value, getValue }) => {
            if (value && previousValue) {
                if (value.fullname !== previousValue.fullname) {
                    const parts = value.fullname.split(' ')
                    setValue(entry + '.firstname', parts[0])
                    setValue(entry + '.lastname', parts[1])
                }
                else if (value.firstname !== previousValue.firstname) {
                    const lastname = getValue(entry + '.lastname') || ''
                    setValue(entry + '.fullname', (value.firstname || '') + ' ' + lastname)
                }
                else if (value.lastname !== previousValue.lastname) {
                    console.log(value.lastname)
                    const firstname = getValue(entry + '.firstname') || ''
                    setValue(entry + '.fullname', firstname + ' ' + (value.lastname || ''))
                }
            }
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