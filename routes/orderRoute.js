const order = require('../controllers/orderController') // Import Auth Controller

module.exports = (app) => {

   app.route('/api/v1/order/create')
      .post(order.create)
   
   app.route('/api/v1/order/notify')
      .post(order.notif)
   
   // app.route('/api/v1/order/finish')
   //    .post(order.finish)
   
   // app.route('/api/v1/order/unfinish')
   //    .post(order.unfinish)
   
   // app.route('/api/v1/order/error')
   //    .post(order.error)

}
