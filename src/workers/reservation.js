const amqp = require('amqplib'); // Import the RabbitMQ client library
const { reserve } = require('../services/parkingService'); // Import your reservation processing logic

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
          // Process the reservation request
          await reserve(reservationData.slot, reservationData.startTime, reservationData.endTime, reservationData.date, reservationData.email);

          console.log('Reservation processed successfully.');
        } catch (error) {
          console.error('Error processing reservation:', error);
        } finally {
          channel.ack(msg); // Acknowledge the message
        }
      }
    });
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
}

connectToRabbitMQ();
