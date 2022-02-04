const { Validator } = require('express-json-validator-middleware')
const { validate }  = new Validator()

const orderSchema = {
    type: "object",
    required: ["payment_type", "customer_details", "item_details"],
    properties: {
        payment_type: {
            type: "string",
            enum: ["bca", "bni", "bri", "mandiri"],
        },
        customer_details: {
            type: "object",
            required: ["first_name", "last_name", "email","phoneNumber"],
            properties: {
                first_name: {
                    type: "string",
                },
                last_name: {
                    type: "string",
                },
                email: {
                    type: "string",
                },
                phoneNumber: {
                    type: "string",
                    pattern: "^[0-9]{10,12}$"
                }
            }
        },
        item_details: {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                required: ["id", "price", "quantity", "name"],
                properties: {
                    id: {
                        type: "string"
                    },
                    price: {
                        type: "number"
                    },
                    quantity: {
                        type: "number"
                    },
                    name: {
                        type: "string"
                    }
                }
            }
        },
    },
}

const orderValidation = validate({ body: orderSchema })

module.exports = { orderValidation }