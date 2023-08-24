const amqp = require('amqplib');
const { sendReservationEmail } = require('../utils/emailService');

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
        const reservationData = JSON.parse(msg.content.toString());
        console.log('Received reservation request:', reservationData);

        try {
          // Process the notify request
          console.log('Reservation received successfully.');
          await sendReservationEmail(reservationData.email, reservationData);
          console.log('Reservation confirmation email sent.');
        } catch (error) {
          console.error('Error processing reservation:', error);
        } finally {
          channel.ack(msg); 
        }
      }
    });
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
}

connectToRabbitMQ();
