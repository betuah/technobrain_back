const authMiddleware = require('../middlewares/authMiddleware')
const auth           = require('../controllers/authController')
const validate       = require('../middlewares/validate')
const schema         = require('../schema/auth')

module.exports = (app) => {

    // app.route('/api/v1/auth/user')
    //     .get(auth.getUser)

    app.route('/api/v1/auth/signin')
        .post(schema.signinBody, validate, auth.signin)

    app.route('/api/v1/auth/signup')
        .post(schema.signUp, validate, auth.signUp)

    app.route('/api/v1/auth/signout')
        .post(authMiddleware, auth.signUp)

    app.route('/api/v1/auth/token')
        .post(auth.accessToken)

}