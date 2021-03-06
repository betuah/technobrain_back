const pdf           = require('../services/PDFGenerator')
const firebaseAdmin = require('../config/firebaseAdminConfig')
const moment        = require('moment-timezone')
const db            = firebaseAdmin.firestore()

exports.index = async (req, res) => {
    try {
        const participant     = await db.collection('participant').where('completion', '==', 1).get()
        const participantData = await Promise.all(participant.docs.map(async doc => {
            const user        = await (await doc.data().user.get()).data()
            const userId      = await (await doc.data().user.get()).id
            const course      = await (await doc.data().course.get()).data()
            const courseId    = await (await doc.data().course.get()).id
            const data        = {
                id: doc.id,
                certificate: doc.data().certificate,
                completion: doc.data().completion,
                user: {
                    userId,
                    fullName : course === undefined ? '' : user.fullName,
                    email : course === undefined ? '' : user.email
                },
                course: {
                    courseId,
                    title : course === undefined ? '' : course.title,
                    courseType: course === undefined ? '' : course.courseType
                }
            }

            return data
        }))

        if (participantData.length < 1) throw { status: 404, code: 'ERR_NOT_FOUND', messages: 'No user data list.' }

        res.status(200).json({
            code: 'OK',
            message: 'Recieved all data success.',
            data: participantData
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.getDataCertificateByCourse = async (req, res) => {
    try {
        const courseRef       = db.doc(`courses/${req.params.courseId}`)
        const participant     = await db.collection('participant')
                                    .where('course', '==', courseRef)
                                    .where('completion', '==', 1)
                                    .get()
        const participantData = await Promise.all(participant.docs.map(async doc => {
            const user        = await (await doc.data().user.get()).data()
            const course      = await (await doc.data().course.get()).data()

            return {
                id: doc.id,
                certificate: doc.data().certificate,
                completion: doc.data().completion,
                user: {
                    fullName : user.fullName,
                    email : user.email
                },
                course: {
                    title : course.title,
                    courseType: course.courseType
                }

            }
        }))

        if (participantData.length < 1) throw { status: 404, code: 'ERR_NOT_FOUND', messages: 'No user data list.' }

        res.status(200).json({
            code: 'OK',
            message: 'Recieved all data success.',
            data: participantData
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.getCertificate = async (req, res) => {
    try {
        const participantId = req.params.participantId
        const participantDb = db.collection('participant').doc(participantId)
        const participant   = await (await participantDb.get()).data()

        if (participant === undefined) throw { status: 404, code: 'ERR_DATA_NOT_FOUND', messages: 'Participant not found!' } 

        const users       = await (await participant.user.get()).data()
        const courses     = await (await participant.course.get()).data()
        if (courses.certificate == undefined || courses.certificate == null) throw { status: 400, code: 'ERR_DATA_CERT_TEMPLATE', messages: 'Required certificate template!' } 

        if (participant.completion == 0) throw { status: 400, code: 'ERR_DATA_NOT_COMPLETE', messages: 'Participant not complete the course.' } 
    
        const data = {
            fullName: users.fullName,
            courseTitle: courses.title,
            certificateNumber: participant.certificate.number,
            participantId: `${participantId}`,
            template: courses.certificate
        }
    
        const stream = res.writeHead(200, {
            'Content-Type': 'application/pdf'
        })

        pdf.generate(
            data,
            (chunk) => stream.write(chunk),
            () => stream.end()
        )
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
        const year          = moment().tz("Asia/Jakarta").format("YYYY")
        const participantId = req.params.participantId
        const dbColletion   = db.collection('participant')
        const participant   = await dbColletion.doc(participantId).get()
        const courseData    = await (await (participant.data().course).get()).data()
        const userData      = await (await (participant.data().user).get()).data()
        const userId        = await (await (participant.data().user).get()).id

        if (participant.data() === undefined || courseData === undefined || userData === undefined) {
            throw { 
                status: 404, 
                code: 'ERR_NOT_FOUND', 
                messages: 'Participant Not Found.'
            }
        }

        const sDate     = moment.unix(courseData.startDate).locale('id').tz("Asia/Jakarta")
        const eDate     = moment.unix(courseData.endDate).locale('id').tz("Asia/Jakarta")

        let date
        if (sDate.year() !== eDate.year() || sDate.month() !== eDate.month()) {
            date = `${moment(sDate.toISOString()).format('DD MM YYYY')} - ${moment(eDate.toISOString()).format('DD MM YYYY')}`
        } else {
            date = `${moment(sDate.toISOString()).format('D')} - ${moment(eDate.toISOString()).format('DD MMMM YYYY')}`
        }

        const certificate   = {
            number: `${courseData.courseCode}/TB/${year}/${Math.floor(Math.random() * 1000)}`,
            signatureDate: moment().locale('id').unix(),
            title: `${courseData.title}`,
            userId: `${userId}`,
            date
        }

        await dbColletion.doc(participantId).update({
            completion: 1,
            certificate
        })

        res.status(200).json({
            code: 'OK',
            message: `Success creating certificate for ${userData.fullName}.`,
            data: {
                userId: userId,
                certificate
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

exports.createAny = async (req, res) => {
    try {
        const participantData = req.body.participantData
        const batch           = db.batch()
        const year            = moment().tz("Asia/Jakarta").format("YYYY")

        if (!Array.isArray(participantData)) throw { status: 400, code: 'ERR_BAD_REQUEST', messages: 'ParticipantData must be array!' }

        let errorData = []
        const bulkUpdate = await Promise.all(participantData.map(async participantId => {
            const doc         = db.collection("participant").doc(`${participantId}`)
            const participant = await doc.get()

            if (participant.data() === undefined) return errorData.push(participantId)

            const courseData  = await (await (participant.data().course).get()).data()
            const courseId    = await (await (participant.data().course).get()).id
            const userId      = await (await (participant.data().user).get()).id
            const sDate       = moment.unix(courseData.startDate).locale('id').tz("Asia/Jakarta")
            const eDate       = moment.unix(courseData.endDate).locale('id').tz("Asia/Jakarta")

            let date
            if (sDate.year() !== eDate.year() || sDate.month() !== eDate.month()) {
                date = `${moment(sDate.toISOString()).format('DD MM YYYY')} - ${moment(eDate.toISOString()).format('DD MM YYYY')}`
            } else {
                date = `${moment(sDate.toISOString()).format('D')} - ${moment(eDate.toISOString()).format('DD MMMM YYYY')}`
            }

            const certificate   = {
                number: `${courseData.courseCode}/TB/${year}/${Math.floor(Math.random() * 100000) + 1}`,
                signatureDate: moment().locale('id').unix(),
                title: `${courseData.title}`,
                courseId: courseId,
                userId: `${userId}`,
                date
            }
            
            return batch.update(doc, {
                completion: 1,
                certificate
            })
        }))

        if ((bulkUpdate.length > 0) && (errorData.length === 0)) {
            await batch.commit()

            res.status(200).json({
                code: 'OK',
                message: `Success creating certificate!`,
            })
        } else {
            throw {
                status: 400,
                code: 'ERR_GENERATE_CERTIFICATE',
                messages: 'Some participantId is not found!'
            }
        }
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.createAll = async (req, res) => {
    try {
        const year     = moment().tz("Asia/Jakarta").format("YYYY")
        const courseId = db.doc(`courses/${req.body.courseId}`)
        const participant = await db.collection("participant").where('course', '==', courseId).where('paymentStats', '==', 2).get()

        if (participant.size > 0) {
            const bulkUpdate = await Promise.all(participant.docs.map(async doc => {
                const courseData    = await (await (doc.data().course).get()).data()
                const courseId      = await (await (doc.data().course).get()).id
                const userId        = await (await (doc.data().user).get()).id

                const sDate     = moment.unix(courseData.startDate).locale('id').tz("Asia/Jakarta")
                const eDate     = moment.unix(courseData.endDate).locale('id').tz("Asia/Jakarta")
        
                let date
                if (sDate.year() !== eDate.year() || sDate.month() !== eDate.month()) {
                    date = `${moment(sDate.toISOString()).format('DD MM YYYY')} - ${moment(eDate.toISOString()).format('DD MM YYYY')}`
                } else {
                    date = `${moment(sDate.toISOString()).format('D')} - ${moment(eDate.toISOString()).format('DD MMMM YYYY')}`
                }
        
                const certificate   = {
                    number: `${courseData.courseCode}/TB/${year}/${Math.floor(Math.random() * 100000)}`,
                    signatureDate: moment().locale('id').unix(),
                    title: `${courseData.title}`,
                    courseId: courseId,
                    userId: `${userId}`,
                    date
                }

                await doc.ref.update({
                    completion: 1,
                    certificate
                })

                return certificate
            }))

            if (bulkUpdate.length > 0) {
                res.status(200).json({
                    code: 'OK',
                    message: `Success creating certificate for courseId ${req.body.courseId}.`,
                })
            }
        }

    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}