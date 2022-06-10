const pdf           = require('../services/PDFGenerator')
const firebaseAdmin = require('../config/firebaseAdminConfig')
const moment        = require('moment-timezone')
const db = firebaseAdmin.firestore()

const mongoose = require('mongoose')
const User = require('../models/usersModel')
const Order = require('../models/orderModel')
const Course = require('../models/courseModel')

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
        const courseData = await Course.findOne({ _id: mongoose.Types.ObjectId(`${req.params.courseId}`) })
            .populate({ path: 'course_participant.participant_id', model: 'customers' })
            .populate({ path: 'course_participant.order_id', model: 'orders' })
        
        if (courseData == null || courseData.course_participant.length == 0) throw {
            code: 404,
            status: 'ERR_NOT_FOUND',
            messages: 'Course not found or no participant'
        }
        
        const course_participant = courseData.course_participant.map(item => item).filter(item => (item.completion == 1 && item.order_id.payment_status == 1))
        
        res.json({
            ...courseData._doc,
            course_participant
        });
        // const data = 
        // const courseData = await Course.aggregate([
        //     { $match: { _id: mongoose.Types.ObjectId(`${req.params.courseId}`) } },
        //     {
        //         $project: {
        //             course_id: 1,
        //             course_title: 1,
        //             participant: {
        //                 $filter: {
        //                     input: "$course_participant",
        //                     as: "course_participant",
        //                     cond: {
        //                         $eq: ['$$course_participant.completion', 0]
        //                     }
        //                 }
        //             },
        //         }
        //     },
            // {
            //     $lookup: {
            //         from: "customers",
            //         localField: "participant.participant_id",
            //         foreignField: "_id",
            //         as: "customers"
            //     }
            // },
            // {
            //     $lookup: {
            //         from: "orders",
            //         localField: "participant.order_id",
            //         foreignField: "_id",
            //         as: "orders"
            //     }
            // },
            // {
            //     $lookup: {
            //         from: "orders",
            //         let: { id: '$order_id' },
            //         pipeline: [
            //             {
            //                 $match: {
            //                     payment_status: 1,
            //                     $expr: {
            //                         $eq: ["$id", "$course_participant.order_id"]
            //                     }
            //                 }
            //             },
            //             { $project: { _id: 1, payment_status: 1} }
            //         ],
            //         as: "course_participant.order_info"
            //     }
            // }
        // ])
        // const courseData = await Course.aggregate([
        //     { $match: { _id: mongoose.Types.ObjectId(`${req.params.courseId}`) } },
        //     { $unwind: '$course_participant'},
        //     { "$lookup": {
        //         "from": "customers",
        //         "localField": "course_participant.participant_id",
        //         "foreignField": "_id",
        //         "as": "course_participant.participant_id"
        //     }},
        //     { "$lookup": {
        //         "from": "orders",
        //         "localField": "course_participant.order_id",
        //         "foreignField": "_id",
        //         "as": "course_participant.order_id"
        //     }},
        //     { $match: { 'course_participant.completion': 1 } },
        //     { $match: {"course_participant.order_id.payment_status" : 1}}
        // ])
        
        // res.json(courseData);
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
        const { courseId, participantId } = req.params
        const year = moment().tz("Asia/Jakarta").format("YYYY")

        const courseData = await Course.findOne(
            { _id: mongoose.Types.ObjectId(courseId) },
            { 
                course_id: 1,
                course_title: 1,
                course_start: 1,
                course_end: 1,
                certificate_template: 1,
                course_participant: {
                    $elemMatch: {
                        participant_id: mongoose.Types.ObjectId(participantId)
                    },
                }
            }
        )
        .populate({ path: 'course_participant.participant_id', model: 'customers' })
        .populate({ path: 'course_participant.order_id', model: 'orders' })
        
        if (courseData == null || courseData.course_participant.length == 0) throw {
            status: '404',
            code: 'ERR_NOT_FOUND',
            messages: 'Course or participant not found'
        }
        
        if (courseData.course_participant[0].completion == 0 || courseData.course_participant[0].order_id.payment_status == 0) {
            throw {
                status: '400',
                code: 'ERR_NOT_COMPLETE',
                messages: 'completion or payment not complete'
            }   
        } 
        
        const certificate = courseData.certificate_template
        const participant = courseData.course_participant[0]

        const sDate     = moment.unix(courseData.course_start).locale('id').tz("Asia/Jakarta")
        const eDate     = moment.unix(courseData.course_end).locale('id').tz("Asia/Jakarta")

        let date
        if (sDate.year() !== eDate.year() || sDate.month() !== eDate.month()) {
            date = `${moment(sDate.toISOString()).format('DD MM YYYY')} - ${moment(eDate.toISOString()).format('DD MM YYYY')}`
        } else {
            date = `${moment(sDate.toISOString()).format('D')} - ${moment(eDate.toISOString()).format('DD MMMM YYYY')}`
        }
    
        const data = {
            courseId: courseData._id,
            fullName: participant.participant_id.fullName,
            courseTitle: courseData.course_title,
            certificateNumber: `${courseData.course_id}/TB/${year}/${Math.floor(Math.random() * 9000)}`,
            participantId: `${participant.id}`,
            template: certificate
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
