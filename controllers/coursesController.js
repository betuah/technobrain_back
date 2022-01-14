const firebaseAdmin = require('../config/firebaseAdminConfig')
const db            = firebaseAdmin.firestore()
const moment        = require('moment')

exports.index = async (req, res) => {
    try {
        const courses     = await db.collection('courses').get()
        const coursesData = await Promise.all(courses.docs.map(doc => {
            return {
                ...doc.data(),
                courseId: doc.id
            }
        }))

        if (coursesData.length < 1) throw { status: 404, code: 'ERR_NOT_FOUND', messages: 'No course data list.' }

        res.status(200).json({
            code: 'OK',
            message: 'Recieved all data success.',
            data: coursesData
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
        const courseData = {
            "courseCode": req.body.courseCode,
            "courseType": req.body.courseType,
            "title": req.body.title,
            "desc": req.body.desc,
            "level": req.body.level,
            "price": req.body.price,
            "startRegisDate": req.body.startRegisDate,
            "endRegisDate": req.body.endRegisDate,
            "startDate": req.body.startDate,
            "endDate": req.body.endDate,
            "quota": req.body.quota,
            "publish": req.body.publish,
            "language": req.body.language,
            "modules": req.body.modules,
            "instructor": req.body.instructor,
            "feedback": null,
            "dateCreated": moment().locale('id').unix()
        }

        await db.collection('courses').doc().set(courseData)

        res.status(200).json({
            code: 'OK',
            message: 'Your data has been saved.',
        })
    } catch (error) {
        console.log(new Error(error.message ? error.message : error))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Please check your request data. Data cannot be null. Please read API Documentation.'}`
        })
    }
    
}

exports.enroll = async (req, res) => {
    try {
        const courseRef = db.doc(`courses/${req.body.courseId}`)
        const userRef   = db.doc(`users/${req.body.userId}`)

        const courses = await (await courseRef.get()).data()
        if (courses.price > 0 && (req.body.paymentStats === undefined || req.body.paymentPics) === undefined) {
            throw { status: 400, code: 'ERR_BAD_REQUEST', messages: 'Required PaymentStats and paymentPics attribut!' }
        }

        const enrollData = {
            course: courseRef,
            user: userRef,
            paymentStats: courses.price > 0 ? req.body.paymentStats : null,
            paymentPics: courses.price > 0 ? req.body.paymentPics : null,
            completion: 0
        }

        await db.collection('participant').doc().set(enrollData)

        res.status(200).json({
            code: "OK",
            message: "Data has been saved!",
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.feedback = async (req, res) => {
    try {
        const courseRef = db.doc(`courses/${req.body.courseId}`)
        const userRef   = db.doc(`users/${req.body.userId}`)

        const feedbackData = {
            courseId: courseRef,
            userId: userRef,
            comment: req.body.comment,
            vote: req.body.vote
        }

        await db.collection('feedback').doc().set(feedbackData)

        res.status(200).json({
            code: "OK",
            message: "Data has been saved!",
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}