const mongoose  = require('../config/database/mongoose')
const Schema = mongoose.Schema

const itemDetailSchema = new Schema({
   item_id: {
      type: String,
      trim: true,
      require: true
   },
   name: {
      type: String,
      trim: true,
      require: true
   },
   price: {
      type: Number,
      require: true
   },
   qty: {
      type: Number,
      require: true
   }
})

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
   item_details: [itemDetailSchema],
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

const ordersData = mongoConnLms.model('orders', paymentSchema)

module.exports = ordersData