const mongoose  = require('../config/database/mongoose')
const Schema    = mongoose.Schema

const userDataSchema = new Schema({ 
    firstName : { 
        type: String, 
        trim: true,
        required: true,
    },
    lastName: {
        type: String, 
        trim: true,
        required: true,
    },
    email : { 
        type: String, 
        trim: true,
        required: true,
    },
    status : { 
        type: String, 
        trim: true
    },
    password : { 
        type: String, 
        trim: true,
        required: true,
    }
}, { 
    timestamps: true, 
    collection : 'users' 
})

userDataSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        delete ret.password;
    }
});

const usersData = mongoConnLms.model('users', userDataSchema)

module.exports = usersData