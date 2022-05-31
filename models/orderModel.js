const mongoose = require('mongoose')
const Schema = mongoose.Schema

const paymentSchema = new Schema({
   payment_type: {
      type: String,
      enum: ['bank_transfer'],
      require: true,
   },
   order_id: {
      type: String,
      trim: true,
      require: true
   },
   items: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'courses',
   }],
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
      ref: 'customers'
   },
   payment_status: {
      type: Number,
      trim: true
   }
}, { 
   timestamps: true, 
   collection : 'orders' 
})

paymentSchema.set('toJSON', {
   virtuals: true,
   versionKey: false,
   transform: function (doc, ret) {
       // remove these props when object is serialized
      delete ret._id;
   }
});

const ordersData = mongoose.model('orders', paymentSchema)

module.exports = ordersData