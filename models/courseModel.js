const { ISO_8601 } = require('moment')
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
   },
   completion: {
      type: Number,
      default: 0,
   },
   certificate: {
      type: String,
   }
})

const certificateSchema = new Schema({
   backBackground: {
      type: String,
      trim: true
   },
   frontBackground: {
      type: String,
      trim: true
   },
   certificateNumberPage1: {
      show: {
         type: Boolean,
      },
      align: {
         type: String,
         trim: true
      },
      fontSize: {
         type: Number
      },
      fontColor: {
         type: String,
         trim: true
      },
      x: {
         type: Number
      },
      y: {
         type: Number
      },
   },
   certificateNumberPage2: {
      show: {
         type: Boolean,
      },
      align: {
         type: String,
         trim: true
      },
      fontSize: {
         type: Number
      },
      fontColor: {
         type: String,
         trim: true
      },
      x: {
         type: Number
      },
      y: {
         type: Number
      },
   },
   name: {
      align: {
         type: String,
         trim: true
      },
      fontColor: {
         type: String,
         trim: true,
      },
      fontSize: {
         type: Number
      },
      x: {
         type: Number
      },
      y: {
         type: Number
      },
   },
   qrcodePage1: {
      show: {
         type: Boolean,
      },
      url: {
         type: String,
         trim: true
      },
      align: {
         type: String,
         trim: true
      },
      size: {
         type: Number
      },
      x: {
         type: Number
      },
      y: {
         type: Number
      },
   },
   qrcodePage2: {
      show: {
         type: Boolean,
      },
      url: {
         type: String,
         trim: true
      },
      align: {
         type: String,
         trim: true
      },
      size: {
         type: Number
      },
      x: {
         type: Number
      },
      y: {
         type: Number
      },
   },
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
   course_start: {
      type: Date,
      trim: true,
   },
   course_end: {
      type: Date,
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
   course_participant: [participantSchema],
   certificate_template: certificateSchema
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

certificateSchema.set('toJSON', {
   virtuals: true,
   versionKey: false,
   transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
   }
});

const coursesData = mongoose.model('courses', courseSchema)

module.exports = coursesData