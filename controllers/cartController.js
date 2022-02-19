const midtransClient = require('midtrans-client')
const env            = require('../env')

let midtransApi = new midtransClient.CoreApi({
    isProduction : env.node_env === 'production',
    serverKey : env.midtrans.serverKey,
    clientKey : env.midtrans.clientKey
})

exports.index = async (req, res) => {
    try {
        let apiClient = new midtransClient.Snap({
            isProduction : env.node_env === 'production',
            serverKey : env.midtrans.serverKey,
            clientKey : env.midtrans.clientKey
        })

        let parameter = {
            order_id : 'order-001',
            grooss_amount: '',
            
        }

        console.log(apiClient)

        res.status(200).json({
            code: 'OK',
            message: 'Recieved all data success.',
            // data: participantData
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.order = async (req, res) => {
    try {
        const {payment_type, customer_details, item_details} = req.body
        let paymentMethod = {}
        const gross_amount = item_details.reduce((sum, { price, quantity }) => sum + price * quantity, 0)

        if (payment_type == 'mandiri') {
            paymentMethod = {
                "payment_type": "echannel",
                "echannel" : {
                    "bill_info1" : "Payment:",
                    "bill_info2" : "Online purchase"
                }
            }
        } else {
            paymentMethod = {
                "payment_type": "bank_transfer",
                "bank_transfer": {
                    "bank": `${payment_type}`,
                    "va_number": `${customer_details.phoneNumber}`
                },
            }
        }

        const orderDetails = {
            ...paymentMethod,
            transaction_details: {
                order_id: "aws-003",
                gross_amount
            },
            custom_expiry: {
                expiry_duration: 12,
                unit: "hour"
            },
            item_details,
            customer_details
        }

        const chargeResponse = await midtransApi.charge(orderDetails)

        res.status(200).json(chargeResponse)
    } catch (error) {
        if (error.ApiResponse) return res.status(error.ApiResponse.status_code).json(error.ApiResponse)
        // console.log(new Error(error.status_message ? error.status_message : error.message))
        res.status(`${error.status_code ? error.status_code : 500}`).json({
            status_code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            status_message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}