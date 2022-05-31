const mongoose = require('mongoose')
const Schema = mongoose.Schema

const participantSchema = new Schema({
   participant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'customers'
   },
   order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'orders'
   }
})

const courseSchema = new Schema({
   course_id: {
      type: String,
      trim: true,
      require: true
   },
   course_title: {
      type: String,
      trim: true,
      require: true
   },
   course_desc: {
      type: String,
      trim: true
   },
   course_category: {
      type: String,
      trim: true,
   },
   course_price: {
      type: Number,
      trim: true,
      required: true
   },
   course_participant: [participantSchema]
}, { 
   timestamps: true, 
   collection : 'courses' 
})

courseSchema.set('toJSON', {
   virtuals: true,
   versionKey: false,
   transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
   }
});

participantSchema.set('toJSON', {
   virtuals: true,
   versionKey: false,
   transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
   }
});

const coursesData = mongoose.model('courses', courseSchema)

module.exports = coursesData