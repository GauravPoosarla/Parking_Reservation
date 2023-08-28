const amqp = require('amqplib');
const { sendReservationEmail, sendUpdationEmail, sendCancellationEmail, sendAdminCancellationEmail } = require('../utils/emailService');

// Connect to RabbitMQ server
async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queueName = 'reservation_queue';
    await channel.assertQueue(queueName);

    console.log('Worker connected to RabbitMQ. Waiting for messages...');

    channel.consume(queueName, async (msg) => {
      if (msg) {
        const messageData = JSON.parse(msg.content.toString());
        try {
          console.log('Reservation received successfully.');
          if (messageData.type === 'reservation') {
            await sendReservationEmail(messageData.data.email, messageData.data);
            console.log('Reservation confirmation email sent.');
          }
          else if(messageData.type === 'update') {
            await sendUpdationEmail(messageData.data.email, messageData.data);
            console.log('Reservation update email sent.');
          }
          else if (messageData.type === 'cancellation') {
            await sendCancellationEmail(messageData.data.email, messageData.data);
            console.log('Reservation cancellation email sent.');
          }
          else if(messageData.type === 'cancellation-admin') {
            await sendAdminCancellationEmail(messageData.data.email, messageData.data);
            console.log('Reservation cancelled by admin, email sent');
          }
          channel.ack(msg); 
        } catch (error) {
          console.error('Error processing reservation:', error);
          // Retry logic
          if (msg.fields.deliveryTag < 3) {
            console.log('Retrying...');
            channel.nack(msg);
          } else {
            console.log('Max retries reached. Discarding message.');
            channel.ack(msg);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
}

connectToRabbitMQ();
