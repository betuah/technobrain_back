const mongoose  = require('../config/database/mongoose')
const Schema = mongoose.Schema

const paymentSchema = new Schema({
   payment_type: {
      type: String,
      enum: ['bank_transfer', 'echannel'],
      default: 'bank_transfer',
      require: true,
   },
   order_id: {
      type: String,
      trim: true,
      require: true
   },
   gross_amount: {
      type: Number,
      require: true
   },
   bank: {
      type: String,
      enum: ['bca', 'bni','bri','mandiri']
   },
   customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
   }
})

paymentSchema.set('toJSON', {
   virtuals: true,
   versionKey: false,
   transform: function (doc, ret) {
       // remove these props when object is serialized
      delete ret._id;
   }
});

const usersData = mongoConnLms.model('orders', paymentSchema)

module.exports = usersData