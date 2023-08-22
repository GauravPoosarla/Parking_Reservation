const parkingController = require('../controllers/parkingController');

const parkingRoutes = [
  {
    method: 'POST',
    path: '/reserve',
    handler: parkingController.reserve, //TODO: add payload validation
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
  },
  {
    method: 'DELETE',
    path: '/cancel-reservation',
    handler: parkingController.cancelReservation,
  },
  {
    method: 'PUT',
    path: '/update-reservation',
    handler: parkingController.updateReservation, //TODO: add payload validation
  },
  {
    method: 'GET',
    path: '/get-reservations-of-user',
    handler: parkingController.getReservationsOfUser,
  }
];

module.exports = parkingRoutes;
