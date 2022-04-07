const schema = `{
    "targets": {
        "label": "targets",
        "type": "object",
        "format": "form",
        // "array": true,
        "onAfterChange": ({ value, setValue, entry , getValue}) => {
            setValue(entry + '.hostname', getValue(entry + '.protocol'))
        },
        "schema": {
            "protocol": {
                "label": "protocol",
                "type": "string"
            },
            "hostname": {
                "label": "hostname",
                "type": "string"
            }
        },
        "flow": [
            "protocol",
            "hostname"
        ]
    }
}`

export default schema