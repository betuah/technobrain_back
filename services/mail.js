const transporter = require('../config/mail_config')

const sendMail = (sendTo, subject, content) => new Promise(async (resolve, reject) => {
   const fromObject = {
      name: 'Technobrain Admin',
      address: `noreply@technobrainlab.com`
   }

   const mailOptions = {
         from: fromObject,
         to: `${sendTo}`,
         subject: subject,
         html: content
   }

   transporter().sendMail(mailOptions).then(info => {
      console.log('Mail Sent!')
      resolve(info)
   }).catch(err => {
      console.log('Sending email error')
      reject(err)
   })
})

module.exports = sendMail