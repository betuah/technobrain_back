const pdfTemplate   = require('../services/PDFTemplate')
const pdf           = require('../services/PDFGenerator')
const mongoose      = require('mongoose')
const Certificate   = require('../models/certificateModel')
const Course        = require('../models/courseModel')

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
        const { courseId, participantId, certificateId } = req.body

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
    
        // const data = {
        //     courseId: courseData._id,
        //     fullName: participant.participant_id.fullName,
        //     courseTitle: courseData.course_title,
        //     certificateNumber: `${courseData.course_id}/${Math.floor(Math.random() * 9000)}`,
        //     participantId: `${participant.id}`,
        //     template: certificate
        // }

        const data = {
            name : participant.participant_id.fullName,
            courseTitle: courseData.course_title,
            certificateId,
            certificateNumber : `${courseData.course_id}/${Math.floor(Math.random() * 9000)}`,
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

exports.editCertificateTemplate = async (req, res) => {
    try {
        const { courseId, template } = req.body

        const courseData = await Course.findOne(
            { _id: mongoose.Types.ObjectId(courseId) },
        )
        .populate({ path: 'course_participant.participant_id', model: 'customers' })
        .populate({ path: 'course_participant.order_id', model: 'orders' })
        
        if (courseData == null) throw {
            status: '404',
            code: 'ERR_NOT_FOUND',
            messages: 'Course or participant not found'
        }

        const data = {
            name : 'John Doe Thanos',
            courseTitle : courseData.course_title,
            certificateNumber : `${courseData.course_id}/${Math.floor(Math.random() * 9000)}`,
            template
        }

        const stream = res.writeHead(200, {
            'Content-Type': 'application/pdf'
        })

        pdfTemplate.generate(
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

exports.saveCertificateTemplate = async (req, res) => {
    try {
        const { courseId, template } = req.body

        const resData = await Course.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(courseId) },
            { certificate_template: template },
        )

        res.status(200).send('Update Success.')
    } catch (error) {
        console.log(new Error(error))
        res.status(500).send('Internal Server Error')
    }
}
