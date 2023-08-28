const controller = require('../../src/controllers/parkingController');
const parkingServices = require('../../src/services/parkingService');

describe('parkingController', () => {
  describe('reserve', () => {
    it('should return a reservation on successful reservation', async () => {
      const mockRequest = {
        payload: {
          slot: 'A1',
          startTime: '10:00 AM',
          endTime: '12:00 PM',
          date: '2023-08-25',
        },
        user: {
          username: 'testuser@example.com',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const mockReservation = { id: 1, slot: 'A1', startTime: '10:00 AM', endTime: '12:00 PM', date: '2023-08-25' };
      jest.spyOn(parkingServices, 'reserve').mockResolvedValue(mockReservation);

      await controller.reserve(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(mockReservation);
      expect(mockH.code).toHaveBeenCalledWith(201);

    });

    it('should return a Boom error on reservation failure', async () => {
      const mockRequest = {
        payload: {
          slot: 'A1',
          startTime: '10:00 AM',
          endTime: '12:00 PM',
          date: '2023-08-25',
        },
        user: {
          username: 'testuser@example.com',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const errorMessage = 'Reservation failed';
      jest.spyOn(parkingServices, 'reserve').mockRejectedValue(new Error(errorMessage));

      const result = await controller.reserve(mockRequest, mockH);

      expect(result.isBoom).toBe(true);
      expect(result.output.statusCode).toBe(500);
      expect(result.message).toBe(errorMessage);
    });
  });

  describe('getAllReservations', () => {
    it('should return all reservations on success', async () => {
      const mockRequest = {};
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const mockReservations = [
        { id: 1, slot: 'A1', startTime: '10:00 AM', endTime: '12:00 PM', date: '2023-08-25' },
        { id: 2, slot: 'B2', startTime: '02:00 PM', endTime: '04:00 PM', date: '2023-08-26' },
      ];
      jest.spyOn(parkingServices, 'getAllReservations').mockResolvedValue(mockReservations);

      await controller.getAllReservations(mockRequest, mockH);

      expect(mockH.code).toHaveBeenCalledWith(200);
      expect(mockH.response).toHaveBeenCalledWith(mockReservations);
    });

    it('should return a Boom error on failure', async () => {
      const mockRequest = {};
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const errorMessage = 'Failed to fetch reservations';
      jest.spyOn(parkingServices, 'getAllReservations').mockRejectedValue(new Error(errorMessage));

      const result = await controller.getAllReservations(mockRequest, mockH);

      expect(result.isBoom).toBe(true);
      expect(result.output.statusCode).toBe(500);
      expect(result.message).toBe(errorMessage);
    });
  });

  describe('getAvailableSlotsForTime', () => {
    it('should return all available slots for a given time on success', async () => {
      const mockRequest = {
        query: {
          startTime: '10:00 AM',
          endTime: '12:00 PM',
          date: '2023-08-25',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const mockAvailableSlots = [
        { id: 1, slot: 'A1', startTime: '10:00 AM', endTime: '12:00 PM', date: '2023-08-25' },
        { id: 2, slot: 'B2', startTime: '10:00 AM', endTime: '12:00 PM', date: '2023-08-25' },
      ];
      jest.spyOn(parkingServices, 'getAvailableSlotsForTime').mockResolvedValue(mockAvailableSlots);

      await controller.getAvailableSlotsForTime(mockRequest, mockH);

      expect(mockH.code).toHaveBeenCalledWith(200);
      expect(mockH.response).toHaveBeenCalledWith(mockAvailableSlots);
    });

    it('should return a Boom error on failure', async () => {
      const mockRequest = {
        query: {
          startTime: '10:00 AM',
          endTime: '12:00 PM',
          date: '2023-08-25',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };
    
      const errorMessage = 'Failed to fetch available slots';
      jest.spyOn(parkingServices, 'getAvailableSlotsForTime').mockRejectedValue(new Error(errorMessage));
    
      const result = await controller.getAvailableSlotsForTime(mockRequest, mockH);
    
      expect(result.isBoom).toBe(true);
      expect(result.output.statusCode).toBe(500);
      expect(result.message).toBe(errorMessage);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation successfully', async () => {
      const mockRequest = {
        params: {
          id: '12345',
        },
        user: {
          username: 'test@example.com',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      jest.spyOn(parkingServices, 'cancelReservation').mockResolvedValue();

      await controller.cancelReservation(mockRequest, mockH);

      expect(mockH.code).toHaveBeenCalledWith(204);
    });

    it('should return a Boom error on failure', async () => {
      const mockRequest = {
        params: {
          id: '12345',
        },
        user: {
          username: 'test@example.com',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const errorMessage = 'Failed to cancel reservation';
      jest.spyOn(parkingServices, 'cancelReservation').mockRejectedValue(new Error(errorMessage));

      const result = await controller.cancelReservation(mockRequest, mockH);

      expect(result.isBoom).toBe(true);
      expect(result.output.statusCode).toBe(500);
      expect(result.message).toBe(errorMessage);
    });
  });

  describe('updateReservation', () => {
    it('should update a reservation successfully', async () => {
      const mockRequest = {
        params: {
          id: '12345',
        },
        payload: {
          slot: 'A',
          startTime: '09:00 AM',
          endTime: '10:00 AM',
          date: '2023-08-30',
        },
        user: {
          username: 'test@example.com',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      jest.spyOn(parkingServices, 'updateReservation').mockResolvedValue();

      await controller.updateReservation(mockRequest, mockH);
      expect(mockH.code).toHaveBeenCalledWith(204);
    });

    it('should return a Boom error on failure', async () => {
      const mockRequest = {
        params: {
          id: '12345',
        },
        payload: {
          slot: 'A',
          startTime: '09:00 AM',
          endTime: '10:00 AM',
          date: '2023-08-30',
        },
        user: {
          username: 'test@example.com',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const errorMessage = 'Failed to update reservation';
      jest.spyOn(parkingServices, 'updateReservation').mockRejectedValue(new Error(errorMessage));

      const result = await controller.updateReservation(mockRequest, mockH);

      expect(result.isBoom).toBe(true);
      expect(result.output.statusCode).toBe(500);
      expect(result.message).toBe(errorMessage);
    });
  });

  describe('getReservationsOfUser', () => {
    it('should return reservations of the user successfully', async () => {
      const mockRequest = {
        user: {
          username: 'test@example.com',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const mockReservations = [
        {
          id: 1,
          slot: 'A1',
          startTime: '09:00 AM',
          endTime: '11:00 AM',
          date: '2023-08-26',
          userEmail: 'test@example.com',
        },
        {
          id: 2,
          slot: 'B2',
          startTime: '02:00 PM',
          endTime: '04:00 PM',
          date: '2023-08-27',
          userEmail: 'test@example.com',
        },
      ];
      jest.spyOn(parkingServices, 'getReservationsOfUser').mockResolvedValue(mockReservations);

      await controller.getReservationsOfUser(mockRequest, mockH);

      expect(mockH.code).toHaveBeenCalledWith(200);
      expect(mockH.response).toHaveBeenCalledWith(mockReservations);
    });

    it('should return a Boom error on failure', async () => {
      const mockRequest = {
        user: {
          username: 'test@example.com',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const errorMessage = 'Failed to fetch reservations';
      jest.spyOn(parkingServices, 'getReservationsOfUser').mockRejectedValue(new Error(errorMessage));

      const result = await controller.getReservationsOfUser(mockRequest, mockH);

      expect(result.isBoom).toBe(true);
      expect(result.output.statusCode).toBe(500);
      expect(result.message).toBe(errorMessage);
    });
  });

  describe('getStatusOfReservation', () => {
    it('should return the status of the reservation', async () => {
      const mockSlot = 'A1';
      const mockStartTime = '09:00 AM';
      const mockEndTime = '11:00 AM';
      const mockDate = '2023-08-26';
      const mockStatus = 'confirmed';
  
      const mockRequest = {
        query: {
          slot: mockSlot,
          startTime: mockStartTime,
          endTime: mockEndTime,
          date: mockDate,
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };
  
      jest.spyOn(parkingServices, 'getStatusOfReservation').mockResolvedValue(mockStatus);
  
      await controller.getStatusOfReservation(mockRequest, mockH);
  
      expect(mockH.response).toHaveBeenCalledWith(mockStatus);
      expect(mockH.code).toHaveBeenCalledWith(200);
    });
  
    it('should handle errors with Boom', async () => {
      const mockSlot = 'A1';
      const mockStartTime = '09:00 AM';
      const mockEndTime = '11:00 AM';
      const mockDate = '2023-08-26';
  
      const mockRequest = {
        query: {
          slot: mockSlot,
          startTime: mockStartTime,
          endTime: mockEndTime,
          date: mockDate,
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };
  
      const mockError = new Error('Test error');
      jest.spyOn(parkingServices, 'getStatusOfReservation').mockRejectedValue(mockError);
  
      const result = await controller.getStatusOfReservation(mockRequest, mockH);
  
      expect(result.isBoom).toBe(true);
      expect(result.output.statusCode).toBe(500);
    });
  });

  describe('deleteReservationAdmin', () => {
    it('should delete a reservation successfully', async () => {
      const mockRequest = {
        params: {
          id: '12345',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      jest.spyOn(parkingServices, 'deleteReservationAdmin').mockResolvedValue();

      await controller.deleteReservationAdmin(mockRequest, mockH);

      expect(mockH.code).toHaveBeenCalledWith(204);
    });

    it('should return a Boom error on failure', async () => {
      const mockRequest = {
        params: {
          id: '12345',
        },
      };
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn(),
      };

      const errorMessage = 'Failed to delete reservation';
      jest.spyOn(parkingServices, 'deleteReservationAdmin').mockRejectedValue(new Error(errorMessage));

      const result = await controller.deleteReservationAdmin(mockRequest, mockH);

      expect(result.isBoom).toBe(true);
      expect(result.output.statusCode).toBe(500);
      expect(result.message).toBe(errorMessage);
    });
  });
});
