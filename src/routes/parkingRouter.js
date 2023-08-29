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
    path: '/cancel-reservation/{id}',
    handler: parkingController.cancelReservation,
    options: {
      validate: {
        params: schemas.cancelReservationQueryParamSchema,
      }
    }
  },
  {
    method: 'PUT',
    path: '/update-reservation/{id}',
    handler: parkingController.updateReservation,
    options: {
      validate: {
        payload: schemas.updateReservationPayloadSchema,
        params: schemas.cancelReservationQueryParamSchema,
      }
    }
  },
  {
    method: 'GET',
    path: '/get-reservations-of-user',
    handler: parkingController.getReservationsOfUser,
  },
  {
    method: 'GET',
    path: '/get-status-of-reservation',
    handler: parkingController.getStatusOfReservation,
    options: {
      validate: {
        query: schemas.getStatusOfReservationQueryParamSchema,
      }
    }
  },
  {
    method: 'DELETE',
    path: '/delete-reservation-admin/{id}',
    handler: parkingController.deleteReservationAdmin,
    options: {
      validate: {
        params: schemas.cancelReservationQueryParamSchema,
      }
    }
  },
  {
    method: 'POST',
    path: '/verify-qr',
    handler: parkingController.verifyQR,
  }
];

module.exports = parkingRoutes;
