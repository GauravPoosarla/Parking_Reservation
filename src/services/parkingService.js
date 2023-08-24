const Boom = require('@hapi/boom');
const amqp = require('amqplib');
const db = require('../../database/models/index.js');

const reserve = async (slot, startTime, endTime, date, email) => {
  // TODO: handle advance booking only till tomorrow and no past dates
  if (new Date(endTime) <= new Date(startTime)) {
    throw Boom.badRequest('End time cannot be before or equal to start time.');
  }

  if(slot > Number(process.env.SLOTS)) {
    throw Boom.badRequest('Invalid slot number');
  }

  // Intersections:
  // 1. startTime <= startTime && (endTime <= endTime && endTime >= startTime)
  // 2. endTime >= endTime && (startTime <= endTime && startTime >= startTime)
  // 3. endTime >= endTime && (startTime >= startTime && startTime <= endTime)

  const intersectingReservations = await db.Parking.findAll({
    attributes: ['slot'],
    where: {
      date: date,
      slot: slot,
      [db.Sequelize.Op.and]: [
        {
          [db.Sequelize.Op.or]: [
            {
              startTime: {
                [db.Sequelize.Op.lte]: endTime,
                [db.Sequelize.Op.gte]: startTime
              },
              endTime: {
                [db.Sequelize.Op.gte]: endTime
              }
            },
            {
              endTime: {
                [db.Sequelize.Op.gte]: startTime,
                [db.Sequelize.Op.lte]: endTime
              }
            },
            {
              startTime: {
                [db.Sequelize.Op.lte]: startTime,
                [db.Sequelize.Op.lte]: endTime
              },
              endTime: {
                [db.Sequelize.Op.gte]: startTime,
                [db.Sequelize.Op.gte]: endTime
              }
            },
            {
              endTime: {
                [db.Sequelize.Op.gte]: endTime,
                [db.Sequelize.Op.lte]: startTime
              },
              startTime: {
                [db.Sequelize.Op.lte]: endTime,
                [db.Sequelize.Op.gte]: startTime
              }
            },
            {
              endTime: {
                [db.Sequelize.Op.gte]: endTime,
                [db.Sequelize.Op.lte]: startTime
              },
              startTime: {
                [db.Sequelize.Op.gte]: startTime,
                [db.Sequelize.Op.lte]: endTime
              }
            }
          ]
        }
      ]
    }
  });

  if (intersectingReservations.length > 0) {
    throw Boom.badRequest('Slot already reserved, Please choose another slot');
  }

  const newReservation = await db.Parking.create({
    slot: slot,
    date: date,
    startTime: startTime,
    endTime: endTime,
    userEmail: email,
  });

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

  await channel.close(); 
  await connection.close();

  return newReservation;
};

const getAllReservations = async () => {
  const reservations = await db.Parking.findAll();
  return reservations;
};

const getAvailableSlotsForTime = async (startTime, endTime, date) => {
  if (new Date(endTime) <= new Date(startTime)) {
    throw Boom.badRequest('End time cannot be before or equal to start time.');
  }

  const reservedSlots = await db.Parking.findAll({
    attributes: ['slot'],
    where: {
      date: date,
      [db.Sequelize.Op.and]: [
        {
          [db.Sequelize.Op.or]: [
            {
              startTime: {
                [db.Sequelize.Op.lt]: endTime,
                [db.Sequelize.Op.gte]: startTime
              },
              endTime: {
                [db.Sequelize.Op.gte]: endTime
              }
            },
            {
              endTime: {
                [db.Sequelize.Op.gt]: startTime,
                [db.Sequelize.Op.lt]: endTime
              }
            },
            {
              startTime: {
                [db.Sequelize.Op.lte]: startTime,
                [db.Sequelize.Op.lte]: endTime
              },
              endTime: {
                [db.Sequelize.Op.gte]: startTime,
                [db.Sequelize.Op.gte]: endTime
              }
            },
            {
              endTime: {
                [db.Sequelize.Op.gte]: endTime,
                [db.Sequelize.Op.lte]: startTime
              },
              startTime: {
                [db.Sequelize.Op.lte]: endTime,
                [db.Sequelize.Op.gte]: startTime
              }
            },
            {
              endTime: {
                [db.Sequelize.Op.gte]: endTime,
                [db.Sequelize.Op.lte]: startTime
              },
              startTime: {
                [db.Sequelize.Op.gte]: startTime,
                [db.Sequelize.Op.lte]: endTime
              }
            }
          ]
        }
      ]
    }
  });

  const allSlots = Array.from(Array(process.env.SLOTS).keys()).map(slot => slot + 1);
  const reservedSlotNumbers = reservedSlots.map(reservation => reservation.slot);
  const availableSlots = allSlots.filter(slot => !reservedSlotNumbers.includes(slot));

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
  

const updateReservation = async (slot, startTime, endTime, date, email, newSlot, newStartTime, newEndTime) => {
  if (new Date(newEndTime) <= new Date(newStartTime)) {
    throw Boom.badRequest('End time cannot be before or equal to start time.');
  }

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

  const intersectingReservations = await db.Parking.findAll({
    attributes: ['slot'],
    where: {
      date: date,
      slot: newSlot,
      [db.Sequelize.Op.and]: [
        {
          [db.Sequelize.Op.or]: [
            {
              startTime: {
                [db.Sequelize.Op.lt]: endTime,
                [db.Sequelize.Op.gte]: startTime
              },
              endTime: {
                [db.Sequelize.Op.gte]: endTime
              }
            },
            {
              endTime: {
                [db.Sequelize.Op.gt]: startTime,
                [db.Sequelize.Op.lt]: endTime
              }
            },
            {
              startTime: {
                [db.Sequelize.Op.lte]: startTime,
                [db.Sequelize.Op.lte]: endTime
              },
              endTime: {
                [db.Sequelize.Op.gte]: startTime,
                [db.Sequelize.Op.gte]: endTime
              }
            },
            {
              endTime: {
                [db.Sequelize.Op.gte]: endTime,
                [db.Sequelize.Op.lte]: startTime
              },
              startTime: {
                [db.Sequelize.Op.lte]: endTime,
                [db.Sequelize.Op.gte]: startTime
              }
            },
            {
              endTime: {
                [db.Sequelize.Op.gte]: endTime,
                [db.Sequelize.Op.lte]: startTime
              },
              startTime: {
                [db.Sequelize.Op.gte]: startTime,
                [db.Sequelize.Op.lte]: endTime
              }
            }
          ]
        }
      ]
    }
  });
  
  if (intersectingReservations) {
    throw Boom.badRequest('Slot already reserved, Please choose another slot');
  }

  if(newSlot > process.env.SLOTS) {
    throw Boom.badRequest('Invalid slot number');
  }

  reservation.slot = newSlot;
  reservation.startTime = newStartTime;
  reservation.endTime = newEndTime;
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

const getStatusOfReservation = async (slot, startTime, endTime, date) => {
  const reservation = await db.Parking.findOne({
    where: {
      slot: slot,
      date: date,
      startTime: startTime,
      endTime: endTime
    }
  });

  if (!reservation) {
    throw Boom.notFound('Reservation was not successful, Please try again');
  }

  return reservation;
};

module.exports = {
  reserve,
  getAllReservations,
  getAvailableSlotsForTime,
  cancelReservation,
  updateReservation,
  getReservationsOfUser,
  getStatusOfReservation
};