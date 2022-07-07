const Certificate = require('../models/certificateModel')
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
        const { course_id, course_title, course_desc, course_category, course_price, course_participant, course_start, course_end, certificate_template } = req.body

        const default_certificate = {
            "certificateNumberPage1": {
                "align": "left",
                "fontSize": 14,
                "fontColor": "#504C69",
                "x": 660,
                "y": 30
            },
            "certificateNumberPage2": {
                "align": "center",
                "fontSize": 8,
                "fontColor": "#504C69",
                "x": 78,
                "y": 495
            },
            "name": {
                "align": "center",
                "fontSize": 35,
                "fontColor": "#504C69",
                "x": 0,
                "y": 250
            },
            "qrcode": {
                "url": "example",
                "align": "center",
                "size": 80,
                "x": 385,
                "y": 418
            },
            "backBackground": "https://firebasestorage.googleapis.com/v0/b/technobrain-dev.appspot.com/o/certificates%2Faws-back.jpg?alt=media&token=d209a7dc-cc58-4282-95d7-831923109837",
            "frontBackground": "https://firebasestorage.googleapis.com/v0/b/technobrain-dev.appspot.com/o/certificates%2Fsertifikat_aws_2024_des__sig_front.png?alt=media&token=2862115d-84f3-4540-879a-d0c607a7f1d0"
        }

        const courseData = {
            course_id,
            course_title,
            course_desc,
            course_category,
            course_price,
            course_participant,
            course_start,
            course_end,
            certificate_template: default_certificate
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
        const courseRes = await Course.findOne({ _id: mongoose.Types.ObjectId(req.params.course_id) })
            .populate({ path: 'course_participant.participant_id', model: 'customers' })
            .populate({ path: 'course_participant.order_id', model: 'orders' })
        
        if (courseRes == null) {
            throw 'Course Data Not Found!'
        } else {
            const result = {
                ...courseRes._doc,
                course_participant: courseRes.course_participant.map(data => {
                    if (data.participant_id != null) {
                        return {
                            id: data._id,
                            completion: data.completion ? data.completion : 0,
                            participant: {
                                id: data.participant_id._id,
                                fullName: data.participant_id.fullName,
                                email: data.participant_id.email,
                                phone_number: data.participant_id.phone_number,
                                institution: data.participant_id.institution,
                                profession: data.participant_id.profession
                            },
                            order: {
                                id: data.order_id._id,
                                order_id: data.order_id.order_id,
                                payment_status: data.order_id.payment_status,
                                gross_amount: data.order_id.gross_amount
                            },
                        }        
                    }
                }).filter(item => item != null)
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
        const session = await mongoose.startSession()

        try {
            session.startTransaction()

            const courseData = await Course.findOne({ _id: mongoose.Types.ObjectId(course_id) }).populate({ path: 'course_participant.order_id', model: 'orders' })

            if (courseData == null) {
                res.status(404).send('Course not found!')
                return;
            }

            await Promise.all(
                participantList.map(async i => {
                    const findOrder = courseData.course_participant.find(r => r._id.equals(i))
                    if (findOrder !== null) {
                        if (findOrder.order_id.payment_status == 1) {
                            if (findOrder.certificate == null || findOrder.certificate == '') {
                                const cert = {
                                    certificateId : `${courseData.course_id}/${Math.floor(Math.random() * 999) + 1}`,
                                    course: mongoose.Types.ObjectId(courseData._id),
                                    customer: mongoose.Types.ObjectId(findOrder.participant_id),
                                    participant: i.toString()
                                }
    
                                const certifData = await Certificate.create(cert)
                                await Course.findOneAndUpdate(
                                    { _id: mongoose.Types.ObjectId(course_id) },
                                    {
                                        $set: {
                                            "course_participant.$[elem].completion": 1,
                                            "course_participant.$[elem].certificate": certifData._id
                                        }
                                    },
                                    {
                                        "arrayFilters": [{
                                            "elem._id": {
                                                $in: [i]
                                            }
                                        }]
                                    }
                                )
                            }
                        }
                    }
                })
            )

            await session.commitTransaction()
            session.endSession()
            
            res.status(200).send('Update success.')
        } catch (error) {
            console.log(error)
            res.status(400).send('Update failed!')
            await session.abortTransaction()
        }
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error')
    }
}

exports.uncompletion = async (req, res) => {
    try {
        const { course_id, participant_id } = req.body
        const participantList = participant_id.map(ids => mongoose.Types.ObjectId(`${ids}`))
        const session = await mongoose.startSession()

        try {
            session.startTransaction()
            await Certificate.deleteMany({
                participant: {
                    $in: participant_id
                }
            })
            
            await Course.findOneAndUpdate(
                { _id: mongoose.Types.ObjectId(`${course_id}`) },
                {
                    $set: {
                        "course_participant.$[elem].completion": 0,
                        "course_participant.$[elem].certificate": null
                    }
                },
                {
                    "arrayFilters": [{
                        "elem._id": {
                            $in: participantList
                        }
                    }]
                }
            )
            
            await session.commitTransaction()
            session.endSession()
            res.status(200).send('Update success.')
        } catch (error) {
            console.log(error)
            res.status(400).send('Update failed!')
            await session.abortTransaction()
        }
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error')
    }
}

exports.delete = async (req, res) => {
    try {
        const { course_id } = req.params

        if (typeof course_id == "string" && course_id.length == 24) {
            await Course.deleteOne({ _id: mongoose.Types.ObjectId(course_id) });
            res.status(200).send(`Course with id ${course_id} has been deleted.`)
            return
        } 

        res.status(400).send('Course must be string and has 24 character.')
    } catch (error) {
        console.log(error)
        res.status(500).send('Failed delete course')
    }
}