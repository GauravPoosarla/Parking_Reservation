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
      accessToken,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN
    }
  });
  
  return transporter;
};

async function sendReservationEmail(toEmail, reservationData) {
  const { slot, startTime, endTime, date, qrCodeImage } = reservationData;
  let emailTransporter = await createTransporter();
  const dateObj = new Date(date);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);
   
  const htmlContent = generateEmailTemplate(slot, formattedDate, startTime, endTime, 'reservation');

  const mailOptions = {
    from: process.env.EMAIL,
    to: toEmail,
    subject: 'Parking Reservation Confirmation',
    html: htmlContent,
    attachments: [{
      filename: 'qr-code.png',
      content: qrCodeImage,
      encoding: 'base64',
      cid: 'qrCodeImage'
    }]
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function sendUpdationEmail(toEmail, reservationData) {
  const { slot, startTime, endTime, date, qrCodeImage } = reservationData;
  let emailTransporter = await createTransporter();
  const dateObj = new Date(date);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);

  const htmlContent = generateEmailTemplate(slot, formattedDate, startTime, endTime, 'update');

  const mailOptions = {
    from: process.env.EMAIL,
    to: toEmail,
    subject: 'Parking Reservation Update',
    html: htmlContent,
    attachments: [{
      filename: 'qr-code.png',
      content: qrCodeImage,
      encoding: 'base64',
      cid: 'qrCodeImage'
    }]
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function sendCancellationEmail(toEmail, reservationData) {
  const { slot, startTime, endTime, date } = reservationData;
  let emailTransporter = await createTransporter();
  const dateObj = new Date(date);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);

  const htmlContent = generateEmailTemplate(slot, formattedDate, startTime, endTime, 'cancellation');

  const mailOptions = {
    from: process.env.EMAIL,
    to: toEmail,
    subject: 'Parking Reservation Cancellation',
    html: htmlContent,
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function sendAdminCancellationEmail(toEmail, reservationData) {
  const { slot, startTime, endTime, date } = reservationData;
  let emailTransporter = await createTransporter();
  const dateObj = new Date(date);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);

  const htmlContent = generateEmailTemplate(slot, formattedDate, startTime, endTime, 'cancellation-admin');

  const mailOptions = {
    from: process.env.EMAIL,
    to: toEmail,
    subject: 'Parking Reservation Cancellation',
    html: htmlContent,
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

function generateEmailTemplate(slot, formattedDate, startTime, endTime, type) {
  let emailTemplate;
  if(type === 'reservation') {
    emailTemplate = fs.readFileSync('./src/utils/common/reservation.html', { encoding: 'utf-8' });
  }
  else if(type === 'update') {
    emailTemplate = fs.readFileSync('./src/utils/common/update.html', { encoding: 'utf-8' });
  }
  else if(type === 'cancellation') {
    emailTemplate = fs.readFileSync('./src/utils/common/cancellation.html', { encoding: 'utf-8' });
  }
  else if(type === 'cancellation-admin') {
    emailTemplate = fs.readFileSync('./src/utils/common/cancellation-admin.html', { encoding: 'utf-8' });
  }
    
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
  sendReservationEmail,
  sendUpdationEmail,
  sendCancellationEmail,
  sendAdminCancellationEmail
};