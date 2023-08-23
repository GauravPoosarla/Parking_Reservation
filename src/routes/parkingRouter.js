const parkingController = require('../controllers/parkingController');
const schemas = require('../utils/common/schema');

const parkingRoutes = [
  {
    method: 'POST',
    path: '/reserve',
    handler: parkingController.reserve, 
    options: {
      validate: {
        payload: schemas.reservePayloadSchema,
      }
    }
  },
  {
    method: 'GET',
    path: '/reservations',
    handler: parkingController.getAllReservations,
  },
  {
    method: 'GET',
    path: '/available-slots-for-time',
    handler: parkingController.getAvailableSlotsForTime,
    options: {
      validate: {
        query: schemas.timeQueryParamSchema,
      }
    }
  },
  {
    method: 'DELETE',
    path: '/cancel-reservation',
    handler: parkingController.cancelReservation,
    options: {
      validate: {
        query: schemas.cancelReservationQueryParamSchema,
      }
    }
  },
  {
    method: 'PUT',
    path: '/update-reservation',
    handler: parkingController.updateReservation,
    options: {
      validate: {
        payload: schemas.updateReservationPayloadSchema,
      }
    }
  },
  {
    method: 'GET',
    path: '/get-reservations-of-user',
    handler: parkingController.getReservationsOfUser,
  }
];

module.exports = parkingRoutes;
