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
    rating: {
        type: Number,
        trim: true,
        required: true
    },
    comment: {
        type: String,
        trim: true
    }
}, { 
    timestamps: true, 
    collection : 'feedbacks',
    versionKey: false 
})

const rulesData = mongoConn.model('feedbacks', feedbackSchema)

module.exports = rulesData