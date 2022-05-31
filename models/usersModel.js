// const mongoose = require('mongoose')
const mongoose = require('mongoose')
const { Schema } = mongoose

const userDataSchema = new Schema({ 
    fullName : { 
        type: String, 
        trim: true,
        required: true,
    },
    email : { 
        type: String, 
        trim: true,
        required: true,
    },
    phone_number: {
        type: String,
        trim: true,
        required: true
    },
    institution: {
        type: String,
        trim: true,
    },
    profession: {
        type: String,
        trim: true
    }
}, { 
    timestamps: true, 
    collection : 'customers' 
})

userDataSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.password
    }
});

const usersData = mongoose.model('customers', userDataSchema)

module.exports = usersData