const Certificate = require('../controllers/certificateController') // Import Auth Controller

module.exports = (app) => {

    app.route('/api/v1/certificate')
        .get(Certificate.index)

    app.route('/api/v1/certificate/:participantId')
        .get(Certificate.getCertificate)

    app.route('/api/v1/certificate/course/:courseId')
        .get(Certificate.getDataCertificateByCourse)
        
    app.route('/api/v1/certificate/:participantId')
        .post(Certificate.create)

    app.route('/api/v1/certificate/generate/any')
        .post(Certificate.createAny)

    app.route('/api/v1/certificate/generate/all')
        .post(Certificate.createAll)
}
