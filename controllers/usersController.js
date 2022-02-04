const firebaseAdmin = require('../config/firebaseAdminConfig')
const db            = firebaseAdmin.firestore()
const User          = require('../models/usersModel')
const { isValidId } = require('../config/database/mongoose')

exports.index = async (req, res) => {
    try {
        const userData = await User.findById(req.userId).select('-password').select('-__v')
        res.status(200).json(userData)
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.create = async (req, res) => {
    try {
        const rules = db.doc(`rules/${4}`)

        const usersData = {
            email       : req.body.email,
            fullName    : req.body.fullName,
            phone       : req.body.phone,
            profilePics : req.body.profilePics,
            profession  : req.body.profession,
            institution : req.body.institution,
            rules       : rules
        }

        const resData = await db.collection('users').add(usersData)

        delete usersData.rules

        res.status(200).json({
            code: 'OK',
            message: 'Your data has been saved.',
            data: {
                userId: resData.id,
                ...usersData
            }
        })
    } catch (error) {
        console.log(new Error(error.message ? error.message : error))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Please check your request data. Data cannot be null. Please read API Documentation.'}`
        })
    }
    
}