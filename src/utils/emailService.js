require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  
  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });
  
  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject();
      }
      resolve(token);
    });
  });
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
      accessToken,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN
    }
  });
  
  return transporter;
};

async function sendReservationEmail(toEmail, reservationData) {
  const { slot, startTime, endTime, date } = reservationData;
  let emailTransporter = await createTransporter();
  const dateObj = new Date(date);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);
   
  const htmlContent = generateEmailTemplate(slot, formattedDate, startTime, endTime);

  const mailOptions = {
    from: process.env.EMAIL,
    to: toEmail,
    subject: 'Parking Reservation Confirmation',
    html: htmlContent,
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

function generateEmailTemplate(slot, formattedDate, startTime, endTime) {
  const emailTemplate = fs.readFileSync('./src/utils/common/template.html', 'utf-8');
    
  const placeholders = {
    slot: slot,
    formattedDate: formattedDate,
    startTime: startTime,
    endTime: endTime,
  };
  
  const filledTemplate = emailTemplate.replace(/\{\{(\w+)\}\}/g, (match, p1) => placeholders[p1]);
    
  return filledTemplate;
}

module.exports = {
  sendReservationEmail
};