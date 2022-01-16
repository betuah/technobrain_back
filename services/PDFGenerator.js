const PDFDocument   = require('pdfkit')
const QRCode        = require('qrcode')

const generate = async (data, dataCallback, endCallback) => {
    const name            = data.name
    const date            = data.date
    const title           = data.title
    const participantId   = data.participantId
    const certificateId   = data.number
    const signatureDate   = data.signatureDate
    const backCertificate = data.backCertificate
    const frontCertificate = data.frontCertificate
    const fontCollor      = data.fontCollor

    const capitalizeName = name.split(" ")

    const fullName = capitalizeName.map((word) => { 
        return word[0].toUpperCase() + word.substring(1)
    }).join(" ")

    const qrOpts = {
        color: {
            dark:"#232323",
        }
    }

    let signature   = await QRCode.toDataURL(`https://technobrainlab.com/certificate/signature/${signatureDate}`, qrOpts)
    let code        = await QRCode.toDataURL(`https://technobrainlab.com/certificate/${participantId}`, qrOpts)

    const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        info: {
            Title: `${title} - ${fullName}`,
        },
        margins: { top: 0, left: 0, right: 0, bottom: 0 }
    })

    doc.on('data', dataCallback)
    doc.on('end', endCallback)
    doc.image(`public/images/sertifikat/${frontCertificate}`, 0, 0, { width: 842})
        .image('public/images/technobrain-logo.png', 320, 45, { width: 120})
        .image('public/images/aws-logo.png', 460, 45, { width: 60})
        .fillColor(`${fontCollor}`).font('public/fonts/Montserrat/Montserrat-Bold.ttf').fontSize(35).text(fullName, 0, 250, {
            align: 'center'
        })
        .fillColor(`${fontCollor}`).font('public/fonts/Montserrat/Montserrat-SemiBold.ttf').fontSize(14).text(title.toUpperCase(), 0, 350, {
            align: 'center'
        })
        .fillColor(`${fontCollor}`).font('public/fonts/Montserrat/Montserrat-SemiBold.ttf').fontSize(12).text(date, 0, 413, {
            align: 'center'
        })
        .image(signature, 390, 435, { width: 60, align: 'center' })

    doc.addPage({
        size: 'A4',
        layout: 'landscape'
    })
    doc.image(`public/images/sertifikat/${backCertificate}`, 0, 0, { width: 842})
    doc.image(code, 385, 418, { width: 80, align: 'center' })
    doc.font('public/fonts/Montserrat/Montserrat-Regular.ttf').fontSize(8).text(certificateId, 78, 495, {
        align: 'center'
    })

    doc.end()
}

module.exports = { generate }