const jwt           = require('jsonwebtoken')
const env           = require('../env')
const bcrypt        = require('bcryptjs')
const hash          = require('../config/hash_config')
const secret        = env.token_secret

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']

        if (typeof authHeader !== undefined || authHeader !== '') {
            const token     = req.header('Authorization').replace('Bearer ','')
            const decoded   = jwt.verify(token, secret)
            req.userId      = decoded.id,
            req.rule        = decoded.rule
            
            next()
        } else {
            throw 'Not Authorized!'
        }
    } catch (error) {
        console.log(new Error(error))
        res.status(401).send('Not Authorized!')
    }
}

module.exports = authMiddleware;