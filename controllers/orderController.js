const axios = require('axios')
const sha512 = require('js-sha512')
const mongoose = require('mongoose')
const User = require('../models/usersModel')
const Order = require('../models/orderModel')
const Course = require('../models/courseModel')
const env = require('../env')
const sendMail = require('../services/mail')
const moment = require('moment')
const mail_template = require('../config/mail_template')

exports.index = async (req, res) => {
   Order.find({}).populate({ path: 'items', model: 'courses'}).then(resData => {
      res.json(resData)
   }).catch(e => {
      res.status(500).send('Data tidak ditemukan')
   })
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

         const midtransReq = {
            payment_type,
            transaction_details: { order_id, gross_amount },
            bank_transfer: { bank },
            custom_expiry: {
               expiry_duration: 12,
               unit: "hour"
            },
            item_details: courseData.map(cData => {
               return {
                  id: cData.course_id,
                  price: cData.course_price,
                  quantity: 1,
                  name: cData.course_title
               }
            }),
            customer_details: {
               first_name,
               last_name,
               email
            }
         }

         // console.log(midtransReq, items, courseData.length)

         try {
         
            if (payment_type == 'bank_transfer') {
               await axios.post(`${env.midtrans_uri}/charge`, midtransReq ,{
                  auth: {
                     username: env.midtrans_server_key,
                     password: ""
                  }
               })
            }
            
            const orderData = {
               order_id,
               payment_type,
               payment_status: 0,
               items: items.map(id => mongoose.Types.ObjectId(`${id}`)),
               bank,
               va_number: response.data.va_numbers[0].va_number,
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
            
            await Course.updateMany({ courseCondition }, { $push: { course_participant: { participant_id: customerRes._id, order_id: orderRes._id, } }})
            await session.commitTransaction()

            if (payment_type != 'bank_transfer') {
               let content = mail_template(order_id, fullName, `${cData.course_title}`, cData.course_price, unik, gross_amount, '27 Mei 2022')
               await sendMail(email, `Menunggu Pembayaran - ${cData.course_title}`, content)
            }
         
            session.endSession()
            res.json(response.data)
         } catch (error) {
            console.log('Order error', error.response ? error.response : error)
            await session.abortTransaction()
            res.send('Order Failed!')
         }
      } else {
         res.send('Course Tidak ditemukan.')
      }
   } catch (error) {
      console.log(error)
      res.status(500).send('Internal Server Error')
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
      let content = mail_template('123123123','Betuah Anugerah', 'AWS - Technical Fundamental', '50.000', Math.floor(Math.random() * 1000 + 1), '50.000', moment().locale('id').format('LL'))

      await sendMail('betuah@seamolec.org', 'Menunggu Pembayaran Pelatihan - AWS Technical Fundamental', content)
      res.send('mail sent!')
   } catch (error) {
      console.log(error)
      res.status(500).send('error')
   }
}