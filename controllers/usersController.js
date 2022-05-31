const User = require('../models/usersModel')

exports.index = async (req, res) => {
    try {
        User.find().then(data => {
            if (data.length > 0) {
                res.status(200).json(data)
            } else {
                res.status(404).json('Tidak ada user.')
            }
        })
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
        const { email, first_name, last_name, phone_number, institution, profession } = req.body

        const userData = {
            email,
            fullName : `${first_name} ${last_name}`,
            phone_number,
            profession,
            institution
        }

        User.create(userData).then(data => {
            res.status(200).json(data)
        }).catch(e => {
            res.status(400).send('Penambahan user gagal!')
        })
    } catch (error) {
        console.log(new Error(error.message ? error.message : error))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Please check your request data. Data cannot be null. Please read API Documentation.'}`
        })
    }
    
}