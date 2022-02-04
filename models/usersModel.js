const { mongoConn } = require('../config/database/mongoose')
const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const userDetailsSchema = new Schema({
    birthday : { 
        type: Date, 
        trim: true,
    },
    institution : { 
        type: String, 
        trim: true
    },
    profession : { 
        type: String, 
        trim: true
    },
    phone : { 
        type: String, 
        trim: true
    },
    profilePics : { 
        type: String, 
        trim: true
    },
    city: {
        type: String,
        trim: true
    }
})

const userDataSchema = new Schema({
    methods: {
        type: String,
        enum: ['local', 'google']
    },
    fullName : { 
        type: String, 
        trim: true,
        required: true
    },
    email : { 
        type: String, 
        trim: true,
        required: true,
        unique: true,
    },
    rule: {
        type: Schema.Types.ObjectId,
        ref: 'rules',
        required: true
    },
    password : { 
        type: String, 
        trim: true,
        required: true,
    },
    details: {
        type: userDetailsSchema
    }
}, { 
    timestamps: true, 
    collection : 'users',
    versionKey: false
})

const usersModel = mongoConn.model('users', userDataSchema)

module.exports = usersModel