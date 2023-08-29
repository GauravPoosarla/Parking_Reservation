const Boom = require('@hapi/boom');
const parkingServices = require('../services/parkingService');

const reserve = async (request, h) => {
  const {slot, startTime, endTime, date} = request.payload;
  const email = request.user.username;
  try {
    const reservation = await parkingServices.reserve(slot, startTime, endTime, date, email);
    return h.response(reservation).code(201);
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
  const {id} = request.params;
  const email = request.user.username;
  try {
    await parkingServices.cancelReservation(id, email);
    return h.response().code(204);
  } catch (error) {
    if(Boom.isBoom(error)) {
      return error;
    }
    return Boom.badImplementation(error);
  }
};

const updateReservation = async (request, h) => {
  const {slot, startTime, endTime, date} = request.payload;
  const email = request.user.username;
  const id = request.params.id;
  try {
    await parkingServices.updateReservation(slot, startTime, endTime, date, email, id);
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

const getStatusOfReservation = async (request, h) => {
  const {slot, startTime, endTime, date} = request.query;
  try {
    const reservation = await parkingServices.getStatusOfReservation(slot, startTime, endTime, date);
    return h.response(reservation).code(200);
  } catch (error) {
    if(Boom.isBoom(error)) {
      return error;
    }
    return Boom.badImplementation(error);
  }
};

const deleteReservationAdmin = async (request, h) => {
  const {id} = request.params;
  try {
    await parkingServices.deleteReservationAdmin(id);
    return h.response().code(204);
  } catch (error) {
    if(Boom.isBoom(error)) {
      return error;
    }
    return Boom.badImplementation(error);
  }
};

const verifyQR = async (request, h) => {
  const {slot, startTime, endTime, date} = request.payload;
  try {
    const reservation = await parkingServices.verifyQR(slot, startTime, endTime, date);
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
  getReservationsOfUser,
  getStatusOfReservation,
  deleteReservationAdmin,
  verifyQR
};