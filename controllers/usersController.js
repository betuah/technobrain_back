const firebaseAdmin = require('../config/firebaseAdminConfig')
const db            = firebaseAdmin.firestore()

exports.index = async (req, res) => {
    try {
        const users     = await db.collection('users').get()
        const usersData = await Promise.all(users.docs.map(async doc => {
            const rules   = await (await doc.data().rules.get()).data()
            return {
                ...doc.data(),
                rules: rules,
                userId: doc.id
            }
        }))

        if (usersData.length < 1) throw { status: 404, code: 'ERR_NOT_FOUND', messages: 'No user data list.' }

        res.status(200).json({
            code: 'OK',
            message: 'Recieved all data success.',
            data: usersData
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
        const rules = db.doc(`rules/${req.body.rules}`)

        const usersData = {
            email       : req.body.email,
            fullName    : req.body.fullName,
            phone       : req.body.phone,
            profilePics : req.body.profilePics,
            profession  : req.body.profession,
            institution : req.body.institution,
            rules       : rules
        }

        await db.collection('users').add(usersData)

        res.status(200).json({
            code: 'OK',
            message: 'Your data has been saved.'
        })
    } catch (error) {
        console.log(new Error(error.message ? error.message : error))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Please check your request data. Data cannot be null. Please read API Documentation.'}`
        })
    }
    
}