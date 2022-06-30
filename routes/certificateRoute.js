const Certificate = require('../controllers/certificateController') // Import Auth Controller

module.exports = (app) => {

    app.route('/api/v1/certificate')
        .get(Certificate.index)
    
    app.route('/api/v1/cetificate/check/:certificateId')
        .get(Certificate.checkCertificate)

    app.route('/api/v1/certificate/print/:courseId/:participantId')
        .get(Certificate.getCertificate)

    app.route('/api/v1/certificate/course/:courseId')
        .get(Certificate.getDataCertificateByCourse)

}
