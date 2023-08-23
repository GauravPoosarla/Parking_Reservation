const Boom = require('@hapi/boom');
const amqp = require('amqplib');
const parkingServices = require('../services/parkingService');

const reserve = async (request, h) => {
  const {slot, startTime, endTime, date} = request.payload;
  const email = request.user.username;
  try {
    // const reservation = await parkingServices.reserve(slot, startTime, endTime, date, email);
    // return h.response(reservation).code(201);
    const message = JSON.stringify({
      slot,
      startTime,
      endTime,
      date,
      email,
    });

    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queueName = 'reservation_queue';

    await channel.assertQueue(queueName);
    channel.sendToQueue(queueName, Buffer.from(message));

    // Wait for ack from RabbitMQ
    // await new Promise(resolve => channel.waitForConfirms(resolve));

    await channel.close(); // Close the channel
    await connection.close(); // Close the connection

    return h.response({ message: 'Reservation request submitted for processing.' }).code(201);
  } catch (error) {
    if(Boom.isBoom(error)) {
      return error;
    }
    return Boom.badImplementation(error);
  }
};

const getAllReservations = async (request, h) => {
  try {
    const reservations = await parkingServices.getAllReservations();
    return h.response(reservations).code(200);
  } catch (error) {
    if(Boom.isBoom(error)) {
      return error;
    }
    return Boom.badImplementation(error);
  }
};

const getAvailableSlotsForTime = async (request, h) => {
  const {startTime, endTime, date} = request.query;
  try {
    const reservations = await parkingServices.getAvailableSlotsForTime(startTime, endTime, date);
    return h.response(reservations).code(200);
  } catch (error) {
    if(Boom.isBoom(error)) {
      return error;
    }
    return Boom.badImplementation(error);
  }
};

const cancelReservation = async (request, h) => {
  const {startTime, endTime, date, slot} = request.query;
  const email = request.user.username;
  try {
    await parkingServices.cancelReservation(startTime, endTime, date, slot, email);
    return h.response().code(204);
  } catch (error) {
    if(Boom.isBoom(error)) {
      return error;
    }
    return Boom.badImplementation(error);
  }
};

const updateReservation = async (request, h) => {
  const {slot, startTime, endTime, date, newSlot} = request.payload;
  const email = request.user.username;
  try {
    await parkingServices.updateReservation(slot, startTime, endTime, date, email, newSlot);
    return h.response().code(204);
  } catch (error) {
    if(Boom.isBoom(error)) {
      return error;
    }
    return Boom.badImplementation(error);
  }
};
    
const getReservationsOfUser = async (request, h) => {
  const email = request.user.username;
  try {
    const reservation = await parkingServices.getReservationsOfUser(email);
    return h.response(reservation).code(200);
  } catch (error) {
    if(Boom.isBoom(error)) {
      return error;
    }
    return Boom.badImplementation(error);
  }
};

module.exports = {
  reserve,
  getAllReservations,
  getAvailableSlotsForTime,
  cancelReservation,
  updateReservation,
  getReservationsOfUser
};