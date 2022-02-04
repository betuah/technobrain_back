const {mongoConn} = require('../config/database/mongoose')
const mongoose    = require('mongoose')
const Schema      = mongoose.Schema

const rulesDataSchema = new Schema({ 
    code : {
        type: Number,
        required: true
    },
    title : { 
        type: String, 
        trim: true,
        required: true
    }
}, { 
    timestamps: true, 
    collection : 'rules',
    versionKey: false 
})

const rulesData = mongoConn.model('rules', rulesDataSchema)

module.exports = rulesData