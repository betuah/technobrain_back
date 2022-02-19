const {mongoConn} = require('../config/database/mongoose')
const mongoose    = require('mongoose')
const Schema      = mongoose.Schema

const feedbackSchema = new Schema({ 
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'courses',
        required: true
    },
    paymentStats: {
        type: Number,
        enum: [0,1,2],
        trim: true,
    },
    paymentPics: {
        type: String,
        trim: true
    },
    completion: {
        type: Number,
        enum: [0,1]
    },
}, { 
    timestamps: true, 
    collection : 'participants',
    versionKey: false 
})

const rulesData = mongoConn.model('participants', feedbackSchema)

module.exports = rulesData