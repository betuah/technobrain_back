const mongoose  = require('mongoose')

const mongoConn = mongoose.createConnection(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true
})

/**
 * Checking Object ID
 * @param {OjectId} id 
 */
 const isValidId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}
// End checking object id

module.exports = { mongoConn, isValidId }