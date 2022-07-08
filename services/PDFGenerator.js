const PDFDocument   = require('pdfkit')
const QRCode        = require('qrcode')
const axios         = require('axios')
// const doc = require('pdfkit')

const generate = async (templateData, dataCallback, endCallback) => {
    const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        info: {
            Title: `${templateData.courseTitle} - ${templateData.name}`,
        },
        margins: { top: 0, left: 0, right: 0, bottom: 0 }
    })

    doc.on('data', dataCallback)
    doc.on('end', endCallback)

    try {
        const {
            name,
            certificateNumber,
            certificateId,
            template
        } = templateData

        const capitalizeName = name.split(" ")
        const fullName = capitalizeName.map((word) => { 
            if (word.length > 1) {
                return word[0] === " " || word[0] === undefined ? "" : word[0].toUpperCase() + word.substring(1)
            } else {
                return word[0] === " " || word[0] === undefined ? "" : word[0].toUpperCase()
            }
        }).join(" ")

        // Start Page 1 Template
        // Page 1Background image
        const frontImage      = (await axios.get(`${template.frontBackground}`, { responseType: 'arraybuffer' })).data
        const front = `data:image/jpg;base64,${Buffer.from(frontImage).toString('base64')}`
        doc.image(`${front}`, 0, 0, { width: 842 })
        
        // Participant Name
        doc.fillColor(`${template.name.fontColor}`)
            .font('public/fonts/Montserrat/Montserrat-Bold.ttf')
            .fontSize(template.name.fontSize)
            .text(fullName, template.name.x, template.name.y, {
                align: `${template.name.align}`
            })
        
        // Qr Code Position
        if (template.qrcodePage1.show !== null ? template.qrcodePage1.show : false) {
            const qrOpts = {
                color: {
                    dark:"#232323",
                }
            }

            let codePage1 = await QRCode.toDataURL(`${template.qrcodePage1.url !== '' ? template.qrcodePage1.url : 'example'}`, qrOpts)
            doc.image(codePage1, template.qrcodePage1.x, template.qrcodePage1.y, { width: template.qrcodePage1.size, align: `${template.qrcodePage1.align}` })
        }
        
        // Certificate Number Position
        if (template.certificateNumberPage1.show) {
            doc.font('public/fonts/Montserrat/Montserrat-Regular.ttf')
                .fontSize(template.certificateNumberPage1.fontSize)
                .text(certificateNumber, template.certificateNumberPage1.x, template.certificateNumberPage1.y, {
                    align: template.certificateNumberPage1.align
                })
        }
        // End Page 1 Template
        
        if (template.backBackground == null || template.backBackground == "") return doc.end()

        // Start Page 2 Template
        doc.addPage({
            size: 'A4',
            layout: 'landscape'
        })

        // Page 2 background image
        const backImage       = (await axios.get(`${template.backBackground}`, { responseType: 'arraybuffer' })).data
        const back            = `data:image/jpg;base64,${Buffer.from(backImage).toString('base64')}`
        doc.image(`${back}`, 0, 0, { width: 842 })
        
        // Qr Code Position
        if (template.qrcodePage2.show) {
            const qrOpts = {
                color: {
                    dark:"#232323",
                }
            }

            let codePage2 = await QRCode.toDataURL(`${template.qrcodePage2.url !== '' ? `${template.qrcodePage2.url}/${certificateId}` : 'example'}`, qrOpts)
            doc.image(codePage2, template.qrcodePage2.x, template.qrcodePage2.y, { width: template.qrcodePage2.size, align: `${template.qrcodePage2.align}` })
        }

        // Certificate Number Position
        if (template.certificateNumberPage2.show) {
            doc.font('public/fonts/Montserrat/Montserrat-Regular.ttf')
                .fontSize(template.certificateNumberPage2.fontSize)
                .text(certificateNumber, template.certificateNumberPage2.x, template.certificateNumberPage2.y, {
                    align: template.certificateNumberPage2.align
                })
        }

        doc.end()
        // End Page 2 Template
    } catch (error) {
        console.log(new Error(error))
        doc.end(error)
    }
}

module.exports = { generate }