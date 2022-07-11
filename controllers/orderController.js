const axios = require('axios')
const sha512 = require('js-sha512')
const mongoose = require('mongoose')
const User = require('../models/usersModel')
const Order = require('../models/orderModel')
const Course = require('../models/courseModel')
const env = require('../env')
const sendMail = require('../services/mail')
const moment = require('moment')
const mail_template = require('../mail_content/mail_payment_waiting')
const mail_berhasil = require('../mail_content/mail_payment_success')

exports.index = async (req, res) => {
   Order.find({}).populate({ path: 'items', model: 'courses'}).then(resData => {
      res.json(resData)
   }).catch(e => {
      res.status(500).send('Data tidak ditemukan')
   })
}

exports.getOrderByCourse = async (req, res) => {
   try {
      const resData = await Order.find({
         items: {
            $elemMatch: {
               $in: [
                  mongoose.Types.ObjectId(`${ req.params.course_id}`)
               ]
            }
         }
      }).populate({ path: 'customer', model: 'customers' })
      
      res.json(resData)
   } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error')
   }
}

exports.getOrderById = async (req, res) => {
   Order.findOne({ order_id: req.params.order_id })
      .populate({ path: 'items', model: 'courses' })
      .populate({ path: 'customer', model: 'customers' })
      .then(resData => {
         const result = {
            order_id: resData.order_id,
            payment_type: resData.payment_type,
            payment_status: resData.payment_status,
            bank: resData.bank,
            va_number: resData.va_number,
            created: resData.createdAt,
            custumer: {
               id: resData.customer._id,
               fullName: resData.customer.fullName,
               email: resData.customer.email,
               phone_number: resData.customer.phone_number
            },
            items: resData.items.map(data => {
               return {
                  id: data._id,
                  course_id: data.course_id,
                  course_price: data.course_price
               }
            }),
            gross_amount: resData.gross_amount
         }

         res.status(200).json(result)
      }).catch(e => {
         res.status(500).send('Data tidak ditemukan')
      })
}

exports.create = async (req, res) => {
   try {
      const {
         email,
         first_name,
         last_name,
         phone_number,
         institution,
         profession,
         order_details
      } = req.body

      const { payment_type, items, bank } = order_details

      const order_id = `aws-${Math.floor(Math.random() * 100000 + 1)}`
      const unik = Math.floor(Math.random() * 1000 + 1)
      const courseData = await Course.find({
         '_id': { $in: items.map(id => mongoose.Types.ObjectId(`${id}`)) }
      })
      if ((courseData.length > 0) && (items.length == courseData.length)) {
         const gross_amount = courseData.reduce((sum, { course_price }) => sum + course_price, 0)

         const session = await mongoose.startSession()
         session.startTransaction()

         item_details = courseData.map(cData => {
            return {
               id: cData.course_id,
               price: cData.course_price,
               quantity: 1,
               name: cData.course_title
            }
         })

         const midtransReq = {
            payment_type,
            transaction_details: { order_id, gross_amount },
            bank_transfer: { bank },
            custom_expiry: {
               expiry_duration: 12,
               unit: "hour"
            },
            item_details,
            customer_details: {
               first_name,
               last_name,
               email
            }
         }

         try {
            let mitrans_res = null
            if (payment_type == 'bank_transfer') {
               const mitrans_result = await axios.post(`${env.midtrans_uri}/charge`, midtransReq ,{
                  auth: {
                     username: env.midtrans_server_key,
                     password: ""
                  }
               })
               mitrans_res = mitrans_result
            }

            if (mitrans_res != null && mitrans_res.data.status_code > 205) throw new Error(mitrans_res.data.status_message)
            
            const orderData = {
               order_id,
               payment_type,
               payment_status: 0,
               items: items.map(id => mongoose.Types.ObjectId(`${id}`)),
               bank,
               va_number: payment_type == 'bank_transfer' ? mitrans_res.data.va_numbers[0].va_number : '',
               gross_amount: payment_type == 'bank_transfer' ? gross_amount : gross_amount + unik
            }
            
            const customerData = {
               email,
               fullName : `${first_name} ${last_name}`,
               phone_number,
               profession,
               institution
            }
            
            const customerRes = await User.create(customerData)
            const orderRes = await Order.create({
               ...orderData,
               customer: customerRes._id
            }),
            courseCondition = items.map(ids => {
               return {
                  _id: mongoose.Types.ObjectId(`${ids}`)
               }
            })
            
            await Course.updateMany({ courseCondition }, { $push: { course_participant: { participant_id: customerRes._id, order_id: orderRes._id, completion: 0, certificate: null } }})
            
            if (payment_type != 'bank_transfer') {
               let content = mail_template(order_id, `${first_name} ${last_name}`, `${item_details[0].name}`, item_details[0].price, unik, orderData.gross_amount, moment().locale('id').format('LL'))
               await sendMail(email, `Menunggu Pembayaran - ${item_details[0].name}`, content)
            }
            
            await session.commitTransaction()
            session.endSession()
            res.json(orderRes)
         } catch (error) {
            console.log('Order error', error.response ? error.response : error)
            await session.abortTransaction()
            res.status(400).send('Order Failed!')
         }
      } else {
         res.send('Course Tidak ditemukan.')
      }
   } catch (error) {
      console.log(error)
      res.status(500).send('Internal Server Error')
   }
}

exports.createMany = async (req, res) => {
   try {
      const { courseId, data } = req.body
      const courseData = await Course.find({
         '_id': mongoose.Types.ObjectId(`${courseId}`)
      })

      if (courseData.length > 0) {
         const gross_amount = courseData.reduce((sum, { course_price }) => sum + course_price, 0)
         const session = await mongoose.startSession()
         session.startTransaction()

         await Promise.all(data.map(async resData => {
            try {
               const orderData = {
                  order_id: `${Math.floor(Math.random() * 100000 + 1)}`,
                  payment_type: resData.order_details.payment_type,
                  payment_status: resData.order_details.payment_status,
                  items: [mongoose.Types.ObjectId(`${courseId}`)],
                  bank: resData.order_details.bank,
                  va_number: '',
                  gross_amount: gross_amount
               }
               
               const customerData = {
                  email: resData.email,
                  fullName: resData.fullName,
                  phone_number: resData.phone_number,
                  profession: resData.profession,
                  institution: resData.institution
               }
               
               const customerRes = await User.create(customerData)
               const orderRes = await Order.create({
                  ...orderData,
                  customer: customerRes._id
               }),
                  courseCondition = mongoose.Types.ObjectId(courseId)
               
               await Course.updateMany({ courseCondition }, { $push: { course_participant: { participant_id: customerRes._id, order_id: orderRes._id, completion: 0, certificate: null } } })
            } catch (error) {
               throw (error)
            }
         })).catch(async error => {
            console.log('Order error', error.response ? error.response : error)
            await session.abortTransaction()
            res.status(400).send('Order Failed!')
         })

         await session.commitTransaction()
         session.endSession()

         res.status(200).send('Import success!')
      } else {
         res.send('Course Tidak ditemukan.')
      }
   } catch (error) {
      console.log(error)
      res.status(500).send('Internal Server Error')
   }
}

exports.paid = async (req, res) => {
   try {
      const { order_id, paid } = req.body
      const paidResult = paid == 1 ? 0 : 1
      const orderData = await Order.findOne({ _id: mongoose.Types.ObjectId(order_id) })
      .populate({ path: 'items', model: 'courses' })
         .populate({ path: 'customer', model: 'customers' })
      
      if (orderData == null || orderData.length == 0) {
         throw 'data order tidak di temukan'
      }
      
      await Order.updateOne({ _id: mongoose.Types.ObjectId(`${order_id}`) }, { $set: { payment_status: paidResult} })

      let content = mail_berhasil(`${orderData.order_id}`,`${orderData.customer.fullName}`, `${orderData.items[0].course_title}`, `${orderData.gross_amount}`, moment().locale('id').format('LL'))
      if (paidResult == 1) await sendMail(orderData.customer.email, `Pembayaran Berhasil - Technobrain Systema`, content)
      res.status(200).send('success')
   } catch (error) {
      console.log(error)
      res.status(500).send('Gagal Update data!')
   }
}

exports.paids = async (req, res) => {
   try {
      const { courses } = req.body

      courseCondition = courses.map(ids => {
         return {
            _id: mongoose.Types.ObjectId(`${ids}`)
         }
      })

      await Order.updateMany({ _id: mongoose.Types.ObjectId(`${req.params.order_id}`) }, { $set: { payment_status: 1 }})
      res.status(200).send('success')
   } catch (error) {
      res.status(500).send('Gagal Update data!')
   }
}

exports.resendPayment = async (req, res) => {
   try {
      const { order_id } = req.body
      
      if (Array.isArray(order_id)) {
         const orderData = await Order.find({
            '_id': {
               $in: order_id.map(i => mongoose.Types.ObjectId(`${i}`))
            }
         })
         .populate({ path: 'items', model: 'courses' })
         .populate({ path: 'customer', model: 'customers' })
         
         if (orderData.length > 0) {
            const promises = orderData.map(async i => {
               if (i.payment_status == 1) {
                  let content = mail_berhasil(`${i.order_id}`, `${i.customer.fullName}`, `${i.items[0].course_title}`, `${i.gross_amount}`, moment().locale('id').format('LL'))
                  await sendMail(i.customer.email, `Pembayaran Berhasil - Technobrain Systema`, content)
               } else {
               const unik = i.gross_amount - i.items[0].course_price
                  let content = mail_template(i.order_id, `${i.customer.fullName}`, `${i.items[0].course_title}`, i.items[0].course_price, unik, i.gross_amount, moment().locale('id').format('LL'))
                  await sendMail(i.customer.email, `Menunggu Pembayaran - Technobrain Systema}`, content)
               }
            });
            
            await Promise.all(promises);
            
            res.status(200).send('Mail Sended!')
         } else {
            res.status(404).send('Order Not Found!')
         }
      } else {
         res.status(400).send('order_id must be array')
      }
   } catch (error) {
      new Error(console.log(error))
      res.status(500).send('Internal Server Error!')
   }
}

exports.notif = async (req, res) => {
   const {
      signature_key,
      status_code,
      gross_amount,
      order_id,
   } = req.body

   const verify = sha512(`${order_id + status_code + gross_amount + env.midtrans_server_key}`)
   
   if (signature_key === verify) {
      axios.get(`${env.midtrans_uri}/${order_id}/status`, {
         auth: {
            username: env.midtrans_server_key,
            password: ""
         }
      }).then(response => {
         const resData = response.data
         Order.findOneAndUpdate({ order_id }, { $set: { payment_status: resData.transaction_status == 'capture' || resData.transaction_status == 'settlement' ? 1 : 0 } })
            .populate({ path: 'items', model: 'courses' })
            .then(resData => {
               res.status(200).send('Data Verified!')
            }).catch(e => {
               console.log(e)
               res.send('Internal Server Error')
            })
      }).catch(async e =>{
         console.log(e, 'Verification Failed')
         res.send('Verification Failed.')
      })
   } else {
      res.send('Your data is not valid!')
   }
}

exports.testMail = async (req, res) => {
   try {
      let content = mail_berhasil('123123123','Betuah Anugerah', 'AWS - Technical Fundamental', '50.000', moment().locale('id').format('LL'))

      await sendMail('betuah@seamolec.org', 'Pembayaran Berhasil - Technobrain Sistema', content)
      res.send('mail sent!')
   } catch (error) {
      console.log(error)
      res.status(500).send('error')
   }
}
