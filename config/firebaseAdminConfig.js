
const firebaseAdmin   = require("firebase-admin")
const serviceAccount  = require("./serviceAccountKey.json")
const env             = require('../env')

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert({
    
  }),
  databaseURL: `${env.firebase_url}`
})

module.exports = firebaseAdmin
