const course = require('../controllers/coursesController') // Import Auth Controller

module.exports = (app) => {

    app.route('/api/v1/course/')
        .get(course.index)

    app.route('/api/v1/course/enroll/all')
        .get(course.getAllEnrollUsers)

    app.route('/api/v1/course/enroll/:courseId')
        .get(course.getEnrollUsers)

    app.route('/api/v1/course/')
        .post(course.create)
        
    app.route('/api/v1/course/enroll')
        .post(course.enroll)
    
    app.route('/api/v1/course/enroll/payment')
        .post(course.payment)

    app.route('/api/v1/course/course/:courseId')
        .delete(course.delCourse)

    app.route('/api/v1/course/enroll/:participantId')
        .delete(course.delOnceParticipant)
}
