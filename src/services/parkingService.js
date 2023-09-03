const Boom = require('@hapi/boom');
const amqp = require('amqplib');
const db = require('../../database/models/index.js');
const qrcode = require('qrcode');
const slotConfigService = require('./slotConfigService');

const reserve = async (userSlot, startTime, endTime, date, email) => {
  if (endTime <= startTime) {
    throw Boom.badRequest('End time cannot be before or equal to start time.');
  }
  const slotConfig = slotConfigService.readSlotConfig();

  const validSlotIds = slotConfig.slots.map(slot => slot.id);
  if (!validSlotIds.includes(userSlot)) {
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

  // advance reservation can be done only for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if(date > tomorrow) {
    throw Boom.badRequest('Reservation can be made only for 1 day in advance');
  }

  // Intersections:
  // 1. startTime <= startTime && (endTime <= endTime && endTime >= startTime)
  // 2. endTime >= endTime && (startTime <= endTime && startTime >= startTime)
  // 3. endTime >= endTime && (startTime >= startTime && startTime <= endTime)

  const intersectingReservations = await db.Parking.findAll({
    where: {
      date: date,
      slot: userSlot,
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

  const selectedSlot = slotConfig.slots.find(slot => userSlot === slot.id);
  const newReservation = await db.Parking.create({
    slot: selectedSlot.id,
    date: date,
    startTime: startTime,
    endTime: endTime,
    userEmail: email,
    parkingStatus: false
  });

  const qrCode = await qrcode.toDataURL(JSON.stringify(newReservation));
  const qrCodeImage = qrCode.split(',')[1];
  const message = JSON.stringify({
    type: 'reservation',
    data: {
      slot: selectedSlot.id,
      startTime,
      endTime,
      date,
      email,
      qrCodeImage,
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
  if (endTime <= startTime) {
    throw Boom.badRequest('End time cannot be before or equal to start time.');
  }

  const slotConfig = slotConfigService.readSlotConfig();

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

  const reservedSlots = await db.Parking.findAll({
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

  const allSlots = slotConfig.slots.map(slot => slot.id);
  const reservedSlotNumbers = reservedSlots.map(slot => slot.slot);
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
  

const updateReservation = async (userSlot, startTime, endTime, date, email, id) => {
  if (endTime <= startTime) {
    throw Boom.badRequest('End time cannot be before or equal to start time.');
  }

  const slotConfig = slotConfigService.readSlotConfig();

  const validSlotIds = slotConfig.slots.map(slot => slot.id);
  if (!validSlotIds.includes(userSlot)) {
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
    where: {
      date: date,
      slot: userSlot,
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

  const selectedSlot = slotConfig.slots.find(slot => userSlot === slot.id);

  reservation.slot = selectedSlot.id;
  reservation.startTime = startTime;
  reservation.endTime = endTime;
  reservation.date = date;
  if(reservation.parkingStatus === true) {
    reservation.parkingStatus = false;
  }
  await reservation.save();

  const qrCode = await qrcode.toDataURL(JSON.stringify(reservation));
  const qrCodeImage = qrCode.split(',')[1];

  const message = JSON.stringify({
    type: 'update',
    data: {
      slot: selectedSlot.id,
      startTime,
      endTime,
      date,
      email,
      qrCodeImage,
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

const getStatusOfReservation = async (id) => {
  const reservation = await db.Parking.findOne({
    where: {
      id: id
    }
  });

  if (!reservation) {
    throw Boom.notFound('Reservation was not successful, Please try again');
  }

  return reservation;
};

const deleteReservationAdmin = async (id) => {
  const reservation = await db.Parking.findOne({
    where: {
      id: id
    }
  });

  if (!reservation) {
    throw Boom.notFound('Reservation not found');
  }

  const { slot, startTime, endTime, date, userEmail } = reservation;
  const message = JSON.stringify({
    type: 'cancellation-admin',
    data: {
      slot,
      startTime,
      endTime,
      date,
      email: userEmail,
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

const verifyQR = async (slot, startTime, endTime, date) => {
  const reservation = await db.Parking.findOne({
    where: {
      slot: slot,
      date: date,
      startTime: startTime,
      endTime: endTime
    }
  });

  if (!reservation) {
    return 'Reservation not found';
  }

  reservation.parkingStatus = true;
  await reservation.save();
  return reservation;
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