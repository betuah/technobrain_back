const course = require('../controllers/coursesController') // Import Auth Controller

module.exports = (app) => {

    app.route('/api/v1/course/')
        .get(course.index)

    app.route('/api/v1/course/enroll/:courseId')
        .get(course.getEnrollUsers)

    app.route('/api/v1/course/')
        .post(course.create)
        
    app.route('/api/v1/course/enroll')
        .post(course.enroll)

    app.route('/api/v1/course/course/:courseId')
        .delete(course.getEnrollUsers)

    app.route('/api/v1/course/enroll/:participantId')
        .delete(course.delOnceParticipant)
}
