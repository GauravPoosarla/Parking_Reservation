/* eslint-disable no-unused-vars */
const axios = require('axios');
const Boom = require('@hapi/boom');

const validateJWT = async (request, h) => {
  const token = request.headers.authorization;
  if (!token) {
    throw Boom.unauthorized('Missing auth token');
  }
  try {
    const headers = {
      authorization: token,
    };
    const result = await axios.post(
      'http://localhost:8080/validate',
      {},
      { headers: headers }
    );
    if (!result.data) {
      throw Boom.unauthorized('JWT malformed');
    }
    request.user = result.data;
    return h.continue;
  } catch (err) {
    throw Boom.unauthorized(err.response.data.message || 'JWT validation failed');
  }
};

module.exports = {
  name: 'jwt-validator', // Plugin name
  register: (server, options) => {
    server.ext('onPreHandler', validateJWT); // Hook into the request lifecycle
  },
};
