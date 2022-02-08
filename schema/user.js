const { Validator } = require('express-json-validator-middleware')
const { validate }  = new Validator()

const signUpSchema = {
    type: "object",
    required: ["fullName", "email", "password"],
    properties: {
        signInAs: {
            type: "string",
            enum: ["mentor","user"]
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

const signUp = validate({ body: signUpSchema })

module.exports = { signUp }