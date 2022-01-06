const Certificate = require('../controllers/certificateController') // Import Auth Controller

module.exports = (app) => {

    app.route('/api/v1/certification/:participantId')
        .get(Certificate.index)
        
    app.route('/api/v1/certification/:participantId')
        .post(Certificate.create)
}
