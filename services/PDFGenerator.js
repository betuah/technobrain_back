const PDFDocument   = require('pdfkit')
const QRCode        = require('qrcode')
const axios         = require('axios')
const doc = require('pdfkit')

const generate = async (data, dataCallback, endCallback) => {
    const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        info: {
            Title: `${data.courseTitle} - ${data.fullName}`,
        },
        margins: { top: 0, left: 0, right: 0, bottom: 0 }
    })

    doc.on('data', dataCallback)
    doc.on('end', endCallback)

    try {
        const name            = data.fullName
        const participantId   = data.participantId
        const certificateId   = data.certificateNumber
        const template        = data.template
        const frontImage      = (await axios.get(`${template.front}`, { responseType: 'arraybuffer' })).data
        const front           = `data:image/jpg;base64,${Buffer.from(frontImage).toString('base64')}`

        const capitalizeName = name.split(" ")
        const fullName = capitalizeName.map((word) => { 
            if (word.length > 1) {
                return word[0] === " " || word[0] === undefined ? "" : word[0].toUpperCase() + word.substring(1)
            } else {
                return word[0] === " " || word[0] === undefined ? "" : word[0].toUpperCase()
            }
        }).join(" ")

        const qrOpts = {
            color: {
                dark:"#232323",
            }
        }

        // let signature   = await QRCode.toDataURL(`https://technobrainlab.com/certificate/signature/${signatureDate}`, qrOpts)
        let code        = await QRCode.toDataURL(`https://technobrainlab.com/certificate/${participantId}`, qrOpts)

        doc.image(`${front}`, 0, 0, { width: 842})
        doc.fillColor(`${template.fontColor}`)
            .font('public/fonts/Montserrat/Montserrat-Bold.ttf')
            .fontSize(template.name.fontSize)
            .text(fullName, template.name.x, template.name.y, {
                align: `${template.name.align}`
            })

        if (template.back === null) return doc.end()

        const backImage       = (await axios.get(`${template.back}`, { responseType: 'arraybuffer' })).data
        const back            = `data:image/jpg;base64,${Buffer.from(backImage).toString('base64')}`

        doc.addPage({
            size: 'A4',
            layout: 'landscape'
        })
        doc.image(`${back}`, 0, 0, { width: 842})
        
        if (template.qrcode) {
            doc.image(code, template.qrcode.x, template.qrcode.y, { width: template.qrcode.size, align: `${template.qrcode.align}` })
        }

        if (template.certificateNumber) {
            doc.font('public/fonts/Montserrat/Montserrat-Regular.ttf')
                .fontSize(template.certificateNumber.fontSize)
                .text(certificateId, template.certificateNumber.x, template.certificateNumber.y, {
                    align: 'center'
                })
        }

        doc.end()
    } catch (error) {
        console.log(new Error(error))
        doc.end(error)
    }
}

const imageEncode = (arrayBuffer) => {
    let u8 = new Uint8Array(arrayBuffer)
    let b64encoded = btoa([].reduce.call(new Uint8Array(arrayBuffer),function(p,c){return p+String.fromCharCode(c)},''))
    let mimetype="image/jpeg"
    return "data:"+mimetype+";base64,"+b64encoded
}

module.exports = { generate }