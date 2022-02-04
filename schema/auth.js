const { Validator } = require('express-json-validator-middleware')
const { validate }  = new Validator()

const signinSchema = {
    type: "object",
    required: ["email", "password"],
    properties: {
        email: {
            type: "string",
            pattern: "^\\S+@\\S+\\.\\S+$"
        },
        password: {
            type: "string",
        }
    },
}

const signUpSchema = {
    type: "object",
    required: ["fullName", "email", "password"],
    properties: {
        methods: {
            type: "string",
            enum: ['local','google']
        },
        fullName: {
            type: "string",
        },
        email: {
            type: "string",
            pattern: "^\\S+@\\S+\\.\\S+$"
        },
        password: {
            type: "string",
        }
    },
}

const signUp        = validate({ body: signUpSchema })
const signinBody    = validate({ body: signinSchema })

module.exports = { signinBody, signUp }