const mongoose = require('mongoose')
const Schema = mongoose.Schema

const certificateSchema = new Schema({
   certificateId: {
      type: String,
      require: true,
   },
   course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'courses',
   },
   customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'customers',
   },
   participant: {
      type: String,
      trim: true
   },
}, { 
   timestamps: true, 
   collection : 'certificates' 
})

certificateSchema.set('toJSON', {
   virtuals: true,
   versionKey: false,
   transform: function (doc, ret) {
       // remove these props when object is serialized
      delete ret._id;
   }
});

const ordersData = mongoose.model('certificates', certificateSchema)

module.exports = ordersData