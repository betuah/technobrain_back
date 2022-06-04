const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true
}).catch(err => {
    console.log('mongo connect error: ', err)
})

mongoose.set('bufferCommands', false);

const mongoConn = mongoose.connection

mongoConn.on('connecting', function() {
    console.log('connecting to MongoDB...');
});

mongoConn.on('reconnected', function () {
    console.log('MongoDB reconnected!');
});

mongoConn.on('disconnected', function() {
    console.log('MongoDB disconnected!');
    mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: true
    }).catch(err => {
        console.log('mongo connect error: ', err)
    })
});

mongoConn.on('connected', function() {
    console.log('MongoDB connected!');
});

module.exports = { mongoConn, mongoose }

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