const {mongoConn} = require('../config/database/mongoose')
const mongoose    = require('mongoose')
const Schema      = mongoose.Schema

const rulesDataSchema = new Schema({ 
    courseCode : {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    courseType : { 
        type: String, 
        enum: ['Webinar', 'Course'],
        required: true
    },
    webinar_details: {
        type: webinarSchema
    },
    title : {
        type: String,
        trim: true,
        required: true
    },
    desc : {
        type: String,
        trim: true,
        required: true
    },
    level : {
        type: String,
        trim: true,
        required: true
    },
    publish : {
        type: Number,
        enum: [1,0],
        trim: true
    },
    price : {
        type: Number,
        trim: true,
        required: true
    },
    mentors: [ instructorSchema ],
    language : {
        type: String,
        trim: true
    },
    modules: [ moduleSchema ],
    certificate: {
        type: certificateSchema,
    }
}, { 
    timestamps: true, 
    collection : 'courses',
    versionKey: false 
})

const webinarSchema = new Schema({
    startRegis: {
        type: Date,
        required: true
    },
    endRegis: {
        type: Date,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    quota: {
        type: Number,
        required: true
    }
})

const instructorSchema = new Schema({
    mentorId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    mentor_name: {
        type: String,
        trim: true
    }
})

const moduleSchema = new Schema({
    moduleId: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    title: {
        type: String,
        unique: true,
        required: true
    },
    submodule: [ submoduleSchema ]
})

const submoduleSchema = new Schema({
    submoduleId: {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['text','video'],
        required: true,
    },
    video: {
        type: String,
        trim: true
    },
    doc: {
        type: String,
        trim: true
    },
    text: {
        type: String
    }
})

const certificateSchema = new Schema({
    front: {
        type: String,
        trim: true,
        required: true
    },
    back: {
        type: String,
        trim: true,
        required: true
    },
    name: {
        fontColor: {
            type: String,
            trim: true,
            required: true
        },
        align: {
            type: String,
            enum: ["center","left","right"],
            trim: true,
            required: true
        },
        fontSize: {
            type: Number,
            required: true
        },
        x: {
            type: Number,
            required: true
        },
        y: {
            type: Number,
            required: true
        }
    },
    certificateNumber : {
        align: {
            type: String,
            enum: ["center","left","right"],
            trim: true,
            required: true
        },
        fontSize: {
            type: Number,
            required: true
        },
        x: {
            type: Number,
            required: true
        },
        y: {
            type: Number,
            required: true
        }
    },
    qrcode : {
        align: {
            type: String,
            enum: ["center","left","right"],
            trim: true,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        x: {
            type: Number,
            required: true
        },
        y: {
            type: Number,
            required: true
        }
    }
})

const rulesData = mongoConn.model('courses', rulesDataSchema)

module.exports = rulesData