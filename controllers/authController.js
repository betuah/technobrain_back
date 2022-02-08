const { OAuth2Client } = require('google-auth-library')
const bcrypt  = require('bcryptjs')
const env     = require('../env')
const User    = require('../models/usersModel') 
const Rule    = require('../models/rulesModel')

const {
    generateJwtToken,
    generateRefreshToken,
    revokeToken,
    setTokenCookie,
    refreshToken
} = require('../services/authService')

exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email: email })
    
        if (!user || !bcrypt.compareSync(password, user.password)) {
            throw { status: 400, code: 'ERR_INCORRECT_USER_PASS', messages: "email and password not match!" }
        }
    
        const accessToken  = generateJwtToken(user)
        const refreshToken = generateRefreshToken(user)
        await refreshToken.save()
    
        res.status(200).json({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            details: user.details,
            accessToken,
            refreshToken: refreshToken.token
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.google = async (req, res) => {
    try {
        if (req.body.grant_type === 'refresh_token') {
            const token = req.cookies['auth._refresh_token.local' || 'auth._refresh_token.google' || 'refresh_token']
            console.log(req.body, token)

            refreshToken({ token })
                .then((tokenData) => {
                    // If creating token success
                    setTokenCookie(res, tokenData.refreshToken)
                        .then(() => {
                            res.status(200).json({code: 'OK', ...tokenData}) 
                        })
                        .catch(err => { 
                            console.log(new Error(err))
                            res.status(500).json({code: 'ERR_INTERNAL_SERVER', message: 'Internal Server Error'})
                        })
                })
                .catch(err => { 
                    console.log(new Error(err))
                    res.sendStatus(401)
                })
        } else {
            let resData = {}
            const { code, client_id } = req.body
            const client = new OAuth2Client(
                env.google.clientId,
                env.google.secret,
                req.body.redirect_uri
            )
    
            const { tokens } = await client.getToken(code)
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token,
                audience: client_id,
            })
            const payload = ticket.getPayload()
            const { name, picture, email } = payload
    
            const userData = await User.findOne({ email })
            if (userData === null) {
                const ruleData  = await Rule.findOne({code: 2})
    
                const dataBody = {
                    fullName: name,
                    email,
                    password: null,
                    rule: ruleData._id
                }
    
                resData = await User.create(dataBody)
            } else {
                resData = userData
            }
            
            const accessToken   = generateJwtToken(resData) 
            const refreshToken  = generateRefreshToken(resData)
            await refreshToken.save()

            res.status(200).json({
                id: resData.id,
                fullName: resData.fullName,
                email: resData.email,
                rule: resData.rule.toString(),
                accessToken,
                refreshToken: refreshToken.token
            })
        }
    } catch (error) {
        console.log(error)
        console.log(new Error(error.messages ? error.messages : error.message))
        res.status(`${error.status ? error.status : 500}`).json({
            code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
            message: `${error.messages ? error.messages : 'Internal Server Error!'}`
        })
    }
}

exports.signUp = async (req, res) => {
    try {
        const { signInAs, fullName, email, password } = req.body
        const passwordHashed = await bcrypt.hash(password, 12)
        const ruleData       = await Rule.findOne({code: signInAs === 'mentor' ? 3 : 2})

        const dataBody = {
            fullName,
            email,
            password: passwordHashed.replace(/^\$2y(.+)$/i, '\$2a$1'),
            rule: ruleData._id
        }

        const resData = await User.create(dataBody)

        const accessToken   = generateJwtToken(resData) // Generate Access Token From Auth Service
        const refreshToken  = generateRefreshToken(resData) // Generate Refresh Token From Auth Service
        await refreshToken.save()

        res.status(200).json({
            id: resData.id,
            fullName: resData.fullName,
            email: resData.email,
            rule: resData.rule.toString(),
            accessToken,
            refreshToken: refreshToken.token
        })
    } catch (error) {
        console.log(new Error(error.messages ? error.messages : error.message))

        if (error.code === 11000) {
            res.status(400).json({
                code: error.code,
                message: error.message
            })
        } else {
            res.status(`${error.status ? error.status : 500}`).json({
                code: `${error.code ? error.code : 'ERR_INTERNAL_SERVER'}`,
                message: `${error.messages ? error.messages : 'Internal Server Error!'}`
            })
        }

    }
}

exports.signOut = async (req, res) => {
    const token = req.body.token || req.cookies['auth._refresh_token.local' || 'auth._refresh_token.google' || 'refresh_token']

    if (!token) return res.status(400).json({ message: 'Refresh Token is required!' }) // Check If token not found from body or cookie

    // Revoke Token with revoke function from Auth Service
    revokeToken({ token })
        .then(() => {
            res.status(200).json({ status: 'Success', message: 'Token Revoked!' })
        })
        .catch(err => {
            console.log(new Error(err))
            res.status(500).json({ status: 'Error', message: err})
        })
}

exports.accessToken = async (req, res) => {
    const token = req.cookies['auth._refresh_token.local' || 'auth._refresh_token.google' || 'refresh_token']

    refreshToken({ token }) // Create new token and refresh token
        .then((tokenData) => {
            // If creating token success
            setTokenCookie(res, tokenData.refreshToken) // Set refreshtoken to cookie
                .then(() => {
                    res.status(200).json({code: 'OK', ...tokenData}) // Send Token and RefreshToken to front end
                })
                .catch(err => { // If set cookie failed
                    console.log(new Error(err))
                    res.status(500).json({code: 'ERR_INTERNAL_SERVER', message: 'Internal Server Error'})
                })
        })
        .catch(err => { // If create new token and refresh token error
            console.log(new Error(err))
            res.sendStatus(401)
        })
}