const user = require('../controllers/usersController') // Import Auth Controller

module.exports = (app) => {

    app.route('/api/v1/users/')
        .get(user.index)

    app.route('/api/v1/users/')
        .post(user.create)

}
