const Boom = require('@hapi/boom');
const db = require('../../database/models/index.js');

const reserve = async (slot, startTime, endTime, date, email) => {
  const reservation = await db.Parking.findOne({ 
    where: {
      slot: slot,
      date: date,
      startTime: startTime,
      endTime: endTime,
    }
  });

  if (reservation) {
    throw Boom.badRequest('Slot already reserved, Please choose another slot');
  }

  const newReservation = await db.Parking.create({
    slot: slot,
    date: date,
    startTime: startTime,
    endTime: endTime,
    userEmail: email,
    slotBooked: true
  });

  return newReservation;
};

const getAllReservations = async () => {
  const reservations = await db.Parking.findAll();
  return reservations;
};

const getAvailableSlotsForTime = async (startTime, endTime, date) => {
  const allReservationsForTime = await db.Parking.findAll({
    where: {
      date: date,
      [db.Sequelize.Op.or]: [
        {
          startTime: {
            [db.Sequelize.Op.lte]: startTime
          },
          endTime: {
            [db.Sequelize.Op.gte]: startTime
          }
        },
        {
          startTime: {
            [db.Sequelize.Op.lte]: endTime
          },
          endTime: {
            [db.Sequelize.Op.gte]: endTime
          }
        }
      ]
    }
  });

  const reservedSlots = allReservationsForTime.map(reservation => reservation.slot);
  const allSlots = Array.from(Array(20).keys()).map(slot => slot + 1); // TODO: bring slots number from config
  const availableSlots = allSlots.filter(slot => !reservedSlots.includes(slot));

  return availableSlots;
};
  
const cancelReservation = async (startTime, endTime, date, slot, email) => {
  const reservation = await db.Parking.findOne({
    where: {
      slot: slot,
      date: date,
      startTime: startTime,
      endTime: endTime,
      userEmail: email
    }
  });
  
  if (!reservation) {
    throw Boom.notFound('Reservation not found');
  }

  const deletedReservation = await reservation.destroy();
  return deletedReservation; // TODO: return deleted reservation
};
  

const updateReservation = async (slot, startTime, endTime, date, email, newSlot) => {
  const reservation = await db.Parking.findOne({
    where: {
      slot: slot,
      date: date,
      startTime: startTime,
      endTime: endTime,
      userEmail: email
    }
  });

  if (!reservation) {
    throw Boom.notFound('Reservation not found');
  }

  const newReservation = await db.Parking.findOne({
    where: {
      slot: newSlot,
      date: date,
      startTime: startTime,
      endTime: endTime
    }
  });

  if (newReservation) {
    throw Boom.badRequest('Slot already reserved, Please choose another slot');
  }

  reservation.slot = newSlot;
  await reservation.save();
  return reservation; // TODO: return updated reservation
};


const getReservationsOfUser = async (email) => {
  const reservation = await db.Parking.findOne({
    where: {
      userEmail: email
    }
  });
    
  if (!reservation) {
    throw Boom.notFound('Reservation not found');
  }
    
  return reservation;
};

module.exports = {
  reserve,
  getAllReservations,
  getAvailableSlotsForTime,
  cancelReservation,
  updateReservation,
  getReservationsOfUser
};