const axios = require('axios')
const sha512 = require('js-sha512')
const mongoose = require('mongoose')
const User = require('../models/usersModel')
const Order = require('../models/orderModel')
const Course = require('../models/courseModel')
const env = require('../env')

exports.index = async (req, res) => {
   Order.find({}).populate({ path: 'items', model: 'courses'}).then(resData => {
      res.json(resData)
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
      const courseData = await Course.find({
         '_id': { $in: items.map(id => mongoose.Types.ObjectId(`${id}`)) }
      })
      const gross_amount = courseData.reduce((sum, { course_price }) => sum + course_price, 0)

      const orderData = {
         order_id,
         payment_type,
         payment_status: 0,
         items: items.map(id => mongoose.Types.ObjectId(`${id}`)),
         bank,
         gross_amount
      }

      const customerData = {
         email,
         fullName : `${first_name} ${last_name}`,
         phone_number,
         profession,
         institution
      }

      const session = await mongoose.startSession()
      session.startTransaction()

      try {
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

         axios.post(`${env.midtrans_uri}/charge`, midtransReq ,{
            auth: {
               username: env.midtrans_server_key,
               password: ""
            }
         }).then(response => {
            session.endSession()
            res.json(response.data)
         }).catch(async e =>{
            console.log(e, 'Order error')
            await session.abortTransaction()
            res.send('Order Failed!')
         })
      } catch (error) {
         console.error(error, 'abort transaction')
         res.send('Transaction Error')
         await session.abortTransaction()
      }
   } catch (error) {
      console.log(error)
      res.status(500).send('Internal Server Error')
   }
}

exports.notif = async (req, res) => {
   const {
      transaction_id,
      transaction_status,
      transaction_time,
      signature_key,
      order_id,
   } = req.body

   axios.get(`${env.midtrans_uri}/${order_id}/status`, {
      auth: {
         username: env.midtrans_server_key,
         password: ""
      }
   }).then(response => {
      const { order_id, status_code, gross_amount } = response.data
      const verify = sha512(`${order_id + status_code + gross_amount + env.midtrans_server_key}`)
      
      if (signature_key === verify) {
         Order.findOneAndUpdate({ order_id }, { $set: { payment_status: transaction_status == 'capture' || transaction_status == 'settlement' ? 1 : 0 } })
            .populate({ path: 'items', model: 'courses' })
            .then(resData => {
               res.status(200).send('Data Verified!')
            }).catch(e => {
               console.log(e)
               res.send('Internal Server Error')
            })
      } else {
         res.send('Your data is not valid!')
      }
   }).catch(async e =>{
      console.log(e, 'Verification Failed')
      res.send('Verification Failed.')
   })
}