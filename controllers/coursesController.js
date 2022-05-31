const User = require('../models/usersModel')
const Course = require('../models/courseModel')

exports.index = async (req, res) => {
    try {
        Course.find().then(data => {
            if (data.length > 0) {
                res.status(200).json(data)
            } else {
                res.status(404).send('Tidak ada course')
            }
        }).catch(e => {
            throw e;
        })
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}

exports.create = async (req, res) => {
    try {
        const { course_title, course_desc, course_category, course_price, course_participant } = req.body

        const courseData = {
            course_id: Math.floor(Math.random() * 9000000000) + 1000000000,
            course_title,
            course_desc,
            course_category,
            course_price,
            course_participant
        }

        Course.create(courseData).then(data => {
            res.status(200).json(data)
        }).catch(e => {
            console.log(e)
            res.status(400).send('Create course failed!')
        })
    } catch (error) {
        console.log(new Error(error.message ? error.message : error))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Please check your request data. Data cannot be null. Please read API Documentation.'}`
        })
    }
    
}

exports.getCourseById = async (req, res) => {
    try {
        const courseRes = await Course.findOne({ course_id: req.params.course_id }).lean()
            .populate({ path: 'course_participant.participant_id', model: 'customers' })
            .populate({ path: 'course_participant.order_id', model: 'orders' })
        
        if (courseRes == null) {
            res.send('Course Data Not Found!')
        } else {
            const result = {
                id: courseRes._id,
                course_id: courseRes.course_id,
                course_title: courseRes.course_title,
                course_desc: courseRes.course_desc,
                course_category: courseRes.course_category,
                course_price: courseRes.course_price,
                course_participant: courseRes.course_participant.map(data => {
                        return {
                            participant: {
                                id: data.participant_id._id,
                                fullName: data.participant_id.fullName,
                                email: data.participant_id.email
                            },
                            order: {
                                id: data.order_id._id,
                                order_id: data.order_id.order_id,
                                payment_status: data.order_id.payment_status
                            }
                        }
                    })
            }
            res.status(200).json(result)
        }
    } catch (error) {
        console.log(error)
        res.send('Internal Server Error')
    }
}