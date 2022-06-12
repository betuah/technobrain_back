const User = require('../models/usersModel')
const Course = require('../models/courseModel')
const mongoose = require('mongoose')

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
        const { course_title, course_desc, course_category, course_price, course_participant, course_start, course_end, certificate_template } = req.body

        const courseData = {
            course_id: Math.floor(Math.random() * 9000000000) + 1000000000,
            course_title,
            course_desc,
            course_category,
            course_price,
            course_participant,
            course_start,
            course_end,
            certificate_template
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
        
        console.log(courseRes);
        
        if (courseRes == null) {
            // res.send('Course Data Not Found!')
            throw 'Course Data Not Found!'
        } else {
            const result = {
                ...courseRes,
                course_participant: courseRes.course_participant.map(data => {
                        return {
                            id: data._id,
                            completion: data.completion,
                            participant: {
                                id: data.participant_id._id,
                                fullName: data.participant_id.fullName,
                                email: data.participant_id.email
                            },
                            order: {
                                id: data.order_id._id,
                                order_id: data.order_id.order_id,
                                payment_status: data.order_id.payment_status,
                                gross_amount: data.order_id.gross_amount
                            },
                        }
                    })
            }
            res.status(200).json(result)
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.completion = async (req, res) => {
    try {
        const { course_id, participant_id } = req.body

        const participantList = participant_id.map(ids => mongoose.Types.ObjectId(`${ids}`))

        await Course.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(`${course_id}`) },
            { $set: { "course_participant.$[elem].completion": 1 } },
            {
                "arrayFilters": [{
                    "elem._id": {
                        $in: participantList
                    }
                }]
            }
        )
        
        res.status(200).send('Update success.')
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error')
    }
}