const pdf           = require('../services/PDFGenerator')
const firebaseAdmin = require('../config/firebaseAdminConfig')
const moment        = require('moment')
const db            = firebaseAdmin.firestore()

exports.index = async (req, res) => {
    try {
        const participant     = await db.collection('participant').where('completion', '==', 1).get()
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
        const stream = res.writeHead(200, {
            'Content-Type': 'application/pdf'
        })
    
        const participantId = req.params.participantId
        const participantDb = db.collection('participant').doc(participantId)
        const participant   = await (await participantDb.get()).data()
    
        if (participant.completion == 0) throw { status: 404, code: 'ERR_NOT_FOUND', messages: 'No certificate.' } 
    
        const data = {
            ...participant.certificate,
            participantId: `${participant.id}`,
            signatureDate: '05012022',
            frontCertificate: 'front001001.png',
            backCertificate: 'back001001.jpg',
            fontCollor: '#504C69'
        }
    
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
        const year          = moment().locale('id').format("YYYY")
        const participantId = req.params.participantId
        const dbColletion   = db.collection('participant')
        const participant   = await dbColletion.doc(participantId).get()
        const courseData    = await (await (participant.data().course).get()).data()
        const courseId      = await (await (participant.data().course).get()).id
        const courseRef     = db.doc(`courses/${courseId}`)
        const userData      = await (await (participant.data().user).get()).data()
        const userId        = await (await (participant.data().user).get()).id
        const graduteCount  = await (await dbColletion.where('course', '==', courseRef).where('completion', '==', 1).get()).size

        if (participant.data() === undefined || courseData === undefined || userData === undefined) {
            throw { 
                status: 404, 
                code: 'ERR_NOT_FOUND', 
                messages: 'Participant Not Found.'
            }
        }

        const sDate     = moment.unix(courseData.startDate)
        const eDate     = moment.unix(courseData.endDate)

        let date
        if (sDate.year() !== eDate.year() || sDate.month() !== eDate.month()) {
            date = `${sDate.locale('id').format('DD MM YYYY')} - ${eDate.locale('id').format('DD MM YYYY')}`
        } else {
            date = `${sDate.locale('id').format('D')} - ${eDate.locale('id').format('DD MMMM YYYY')}`
        }

        const certificate   = {
            number: `${courseData.courseCode}/TB/${year}/${graduteCount + 1}`,
            signatureDate: moment().locale('id').unix(),
            title: `${courseData.title}`,
            name: `${userData.fullName}`,
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