const Certificate = require('../controllers/certificateController') // Import Auth Controller

module.exports = (app) => {

    app.route('/api/v1/certificate')
        .get(Certificate.index)
    
    app.route('/api/v1/certificate/check/:certificateId')
        .get(Certificate.checkCertificate)

    app.route('/api/v1/certificate/course/:courseId')
        .get(Certificate.getDataCertificateByCourse)
    
    app.route('/api/v1/certificate/print')
        .post(Certificate.getCertificate)
        
    app.route('/api/v1/certificate/template')
        .post(Certificate.editCertificateTemplate)
    
    app.route('/api/v1/certificate/template/save')
        .post(Certificate.saveCertificateTemplate)

}
