const user       = require('../controllers/usersController')
const auth       = require('../middlewares/authMiddleware')
const validate   = require('../middlewares/validate')
const schema     = require('../schema/auth')

module.exports = (app) => {

    app.route('/api/v1/user/')
        .get(auth, user.index)

    app.route('/api/v1/users/')
        .post(user.create)

}
