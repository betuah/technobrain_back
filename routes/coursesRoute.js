const course = require('../controllers/coursesController') // Import Auth Controller

module.exports = (app) => {

    app.route('/api/v1/course/')
        .get(course.index)
    
    app.route('/api/v1/course/:course_id')
        .get(course.getCourseById)
    
    app.route('/api/v1/course/create')
        .post(course.create)
    
    app.route('/api/v1/course/completion')
        .post(course.completion)
    
}
