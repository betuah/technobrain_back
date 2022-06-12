const order = require('../controllers/orderController') // Import Auth Controller

module.exports = (app) => {

   app.route('/api/v1/test/email')
      .post(order.testMail)
   
   app.route('/api/v1/order')
      .get(order.index)

   app.route('/api/v1/order/:order_id')
      .get(order.getOrderById)
   
   app.route('/api/v1/order/course/:course_id')
      .get(order.getOrderByCourse)

   app.route('/api/v1/order/create')
      .post(order.create)
   
   app.route('/api/v1/order/paid')
      .post(order.paid)
   
   app.route('/api/v1/order/paids')
      .post(order.paids)
   
   app.route('/api/v1/order/notify')
      .post(order.notif)
   
   // app.route('/api/v1/order/finish')
   //    .post(order.finish)
   
   // app.route('/api/v1/order/unfinish')
   //    .post(order.unfinish)
   
   // app.route('/api/v1/order/error')
   //    .post(order.error)

}
