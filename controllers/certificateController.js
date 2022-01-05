const pdf = require('../services/PDFGenerator')

exports.index = async (req, res) => {
    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf'
    })

    const data = {
        title: 'Amazon Web Services - Technical Fundamental',
        name: 'Betuah Anugerah',
        date: '20 - 24 Desember 2021',
        participantId: 'qowioi32r989wef9h',
        certificateId: '001/TB/2021/00001',
        signatureDate: '05012022',
        backCertificate: 'back001.jpg'
    }

    pdf.generate(
        data,
        (chunk) => stream.write(chunk),
        () => stream.end()
    )
}