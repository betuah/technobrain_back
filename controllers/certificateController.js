const pdf           = require('../services/PDFGenerator')
const moment        = require('moment-timezone')

const mongoose = require('mongoose')
const Certificate = require('../models/certificateModel')
const Course = require('../models/courseModel')

exports.index = async (req, res) => {
    try {
        const certData = await Certificate.find({})
            .populate({ path: 'customer', model: 'customers' })
            .populate({ path: 'course', model: 'courses' })
        console.log(certData)
        res.status(200).json(certData)
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
            .populate({ path: 'course_participant.certificate', model: 'certificates' })
        
        if (courseData == null || courseData.course_participant.length == 0) throw {
            code: 404,
            status: 'ERR_NOT_FOUND',
            messages: 'Course not found or no participant'
        }
        
        const course_participant = courseData.course_participant.map(item => item).filter(item => (item.completion == 1 && item.order_id.payment_status == 1))
        
        res.json({
            ...courseData._doc,
            course_participant
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
                        _id: mongoose.Types.ObjectId(participantId)
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

exports.checkCertificate = async (req, res) => {
    try {
        const certificateData = await Certificate.findOne({ _id: mongoose.Types.ObjectId(`${req.params.certificateId}`) })
            .populate({ path: 'customer', model: 'customers' })
            .populate({ path: 'course', model: 'courses' })
        
        res.status(200).json(certificateData)
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}
