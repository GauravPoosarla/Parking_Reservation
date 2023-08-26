const Boom = require('@hapi/boom');
const amqp = require('amqplib');
const db = require('../../database/models/index.js');

const reserve = async (slot, startTime, endTime, date, email) => {
  const startTimeComponents = startTime.split(':');
  const startHours = parseInt(startTimeComponents[0]);
  const startMinutes = parseInt(startTimeComponents[1]);
  const startSeconds = parseInt(startTimeComponents[2]);

  date.setUTCHours(startHours - 5, startMinutes - 30, startSeconds); // IST to UTC

  if(date < new Date()) {
    throw Boom.badRequest('Reservation cannot be made for past dates');
  }

  // advance reservation can be done only for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if(date > tomorrow) {
    throw Boom.badRequest('Reservation can be made only for 1 day in advance');
  }

  if (endTime <= startTime) {
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
    type: 'reservation',
    data: {
      slot,
      startTime,
      endTime,
      date,
      email,
    },
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
  const startTimeComponents = startTime.split(':');
  const startHours = parseInt(startTimeComponents[0]);
  const startMinutes = parseInt(startTimeComponents[1]);
  const startSeconds = parseInt(startTimeComponents[2]);

  date.setUTCHours(startHours - 5, startMinutes - 30, startSeconds); // IST to UTC

  if(date < new Date()) {
    throw Boom.badRequest('Reservation cannot be made for past dates');
  }

  // advance reservation can be done only for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if(date > tomorrow) {
    throw Boom.badRequest('Reservation can be made only for 1 day in advance');
  }

  if (endTime <= startTime) {
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

  const allSlots = Array.from(Array(Number(process.env.SLOTS)).keys()).map(slot => slot + 1);
  const reservedSlotNumbers = reservedSlots.map(reservation => reservation.slot);
  const availableSlots = allSlots.filter(slot => !reservedSlotNumbers.includes(slot));

  return availableSlots;
};

const cancelReservation = async (id, email) => {
  const reservation = await db.Parking.findOne({
    where: {
      id: id,
      userEmail: email
    }
  });
  
  if (!reservation) {
    throw Boom.notFound('Reservation not found');
  }

  const { slot, startTime, endTime, date } = reservation;
  const message = JSON.stringify({
    type: 'cancellation',
    data: {
      slot,
      startTime,
      endTime,
      date,
      email,
    },
  });

  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queueName = 'reservation_queue';

  await channel.assertQueue(queueName);
  channel.sendToQueue(queueName, Buffer.from(message));

  await channel.close(); 
  await connection.close();

  const deletedReservation = await reservation.destroy();
  return deletedReservation; // TODO: return deleted reservation
};
  

const updateReservation = async (slot, startTime, endTime, date, email, id) => {
  if (endTime <= startTime) {
    throw Boom.badRequest('End time cannot be before or equal to start time.');
  }

  if(slot > Number(process.env.SLOTS)) {
    throw Boom.badRequest('Invalid slot number');
  }

  const startTimeComponents = startTime.split(':');
  const startHours = parseInt(startTimeComponents[0]);
  const startMinutes = parseInt(startTimeComponents[1]);
  const startSeconds = parseInt(startTimeComponents[2]);

  date.setUTCHours(startHours - 5, startMinutes - 30, startSeconds); // IST to UTC

  if(date < new Date()) {
    throw Boom.badRequest('Reservation cannot be made for past dates');
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if(date > tomorrow) {
    throw Boom.badRequest('Reservation can be made only for 1 day in advance');
  }

  const reservation = await db.Parking.findOne({
    where: {
      id: id,
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
      slot: slot,
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
  
  if (intersectingReservations.length > 0) {
    throw Boom.badRequest('Slot already reserved, Please choose another slot');
  }

  reservation.slot = slot;
  reservation.startTime = startTime;
  reservation.endTime = endTime;
  reservation.date = date;
  await reservation.save();

  const message = JSON.stringify({
    type: 'update',
    data: {
      slot,
      startTime,
      endTime,
      date,
      email,
    },
  });

  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queueName = 'reservation_queue';

  await channel.assertQueue(queueName);
  channel.sendToQueue(queueName, Buffer.from(message));

  await channel.close(); 
  await connection.close();
  return reservation; // TODO: return updated reservation
};


const getReservationsOfUser = async (email) => {
  const reservation = await db.Parking.findAll({
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