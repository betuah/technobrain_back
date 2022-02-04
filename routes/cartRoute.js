const cart       = require('../controllers/cartController')
const validate   = require('../middlewares/validate')
const jsonSchema = require('../schema/cart')

module.exports = (app) => {

    app.route('/api/v1/cart/')
        .get(cart.index)

    app.route('/api/v1/cart/order')
        .post(jsonSchema.orderValidation, validate, cart.order)

}