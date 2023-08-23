const Joi = require('joi');

const reservePayloadSchema = Joi.object({
  slot: Joi.string().required(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  date: Joi.date().iso().required()
});

const timeQueryParamSchema = Joi.object({
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  date: Joi.date().iso().required()
}).options({ stripUnknown: true });

const cancelReservationQueryParamSchema = Joi.object({
  startTime: Joi.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  endTime: Joi.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  date: Joi.date().iso().required(),
  slot: Joi.string().required()
}).options({ stripUnknown: true });

const updateReservationPayloadSchema = Joi.object({
  slot: Joi.string().required(),
  startTime: Joi.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  endTime: Joi.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  date: Joi.date().iso().required(),
  newSlot: Joi.string().required()
});

module.exports = {
  reservePayloadSchema,
  timeQueryParamSchema,
  cancelReservationQueryParamSchema,
  updateReservationPayloadSchema
};

