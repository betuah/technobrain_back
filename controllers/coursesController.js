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
            "certificate": req.body.certificate,
            "title": req.body.title,
            "desc": req.body.desc,
            "level": req.body.level,
            "price": req.body.price,
            "quota": req.body.quota,
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

exports.getEnrollUsers = async (req, res) => {
    try {
        const courseId  = req.params.courseId
        const courseRef = db.doc(`courses/${courseId}`)

        const enrollData = await db.collection("participant").where('course', '==', courseRef).get()

        if (enrollData.size === 0) throw { status: 404, code: 'ERR_DATA_EMPTY', messages: "Your course doest'n have participant!" }

        const participant = await Promise.all(enrollData.docs.map(async doc => {
            const coursesData = await (await (doc.data().course).get()).data()
            const coursesId   = await (await (doc.data().course).get()).id
            const usersData   = await (await (doc.data().user).get()).data()
            const userId      = await (await (doc.data().user).get()).id

            return bodyData = {
                courseId: coursesId,
                title: coursesData.title,
                type: coursesData.courseType,
                userId: userId,
                fullName: usersData.fullName ? usersData.fullName : null,
                email: usersData.email ? usersData.email : null,
                participantId: doc.id,
                completion: doc.data().completion,
                paymentPics: doc.data().paymentPics,
                paymentStats: doc.data().paymentStats
            }
        }))

        res.status(200).json({
            code: "OK",
            message: "Success retrieve all data.",
            data: participant
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.enroll = async (req, res) => {
    try {
        const { courseId, userId, paymentPics }   = req.body
        const courseRef  = db.doc(`courses/${courseId}`)
        const userRef    = db.doc(`users/${userId}`)

        if (courseId === undefined || userId === undefined || paymentPics === undefined) throw { status: 422, code: 'ERR_UNPROCESABLE_ENTITY', messages: 'Your data cannot be process!'}

        const courses = await (await courseRef.get()).data()

        if (courses === undefined) throw { status: 404, code: 'ERR_NOT_FOUND', messages: 'Your courses not found!' }

        if (courses.price > 0 && req.body.paymentPics === undefined) {
            throw { status: 400, code: 'ERR_BAD_REQUEST', messages: 'paymentPics attribut!' }
        }

        const quota       = courses.quota
        const userExist   = (await db.collection("participant").where('course', '==', courseRef).where('user', '==', userRef).get()).size
        const enrollCount = (await db.collection("participant").where('course', '==', courseRef).where('paymentStats', '!=', 0).get()).size

        if (userExist == 1) throw { status: 409, code: 'ERR_DATA_EXIST', messages: "User already enroll to this course!" }
        if ((quota != 0) && (enrollCount >= quota)) throw { status: 429, code: 'ERR_DATA_LIMIT', messages: "Enroll in the course has reached the limit" }

        const enrollData = {
            course: courseRef,
            user: userRef,
            paymentStats: courses.price === 0 ? 2 : 1,
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

exports.payment = async (req, res) => {
    try {
        const resDel = await db.collection('participant').doc(`${req.body.participantId}`).update({ 
            paymentStats: req.body.paymentStats 
        })

        if (resDel) return res.status(200).json({
            code: "OK",
            message: "Data updated!",
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.delOnceParticipant = async (req, res) => {
    try {
        const resDel = await db.collection('participant').doc(`${req.params.participantId}`).delete()

        if (resDel) return res.status(200).json({
            code: "OK",
            message: "Unenroll user success!",
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.delCourse = async (req, res) => {
    try {
        const courseId  = req.params.courseId
        const courseRef = db.doc(`courses/${courseId}`)
        const enrolled  = await db.collection("participant").where('course', '==', courseRef).get()

        if (enrolled.size > 0) throw { status: 400, code: 'ERR_DEL_PARTICIPANT_EXIST', messages: "This course has participant!" }

        const resDel = await db.collection('courses').doc(`${courseId}`).delete()

        if (resDel) return res.status(200).json({
            code: "OK",
            message: "Course has been delete!",
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