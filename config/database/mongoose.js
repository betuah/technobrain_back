const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true
})

mongoose.set('bufferCommands', false);

const mongoConn = mongoose.connection

module.exports = mongoConn

// const mongoConn = mongoose.createConnection(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     autoIndex: true
// })

// /**
//  * Checking Object ID
//  * @param {OjectId} id 
//  */
//  const isValidId = (id) => {
//     return mongoose.Types.ObjectId.isValid(id);
// }
// // End checking object id

// module.exports = { mongoConn, isValidId }