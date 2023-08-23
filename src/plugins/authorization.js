const Boom = require('@hapi/boom');

const authorizeAdmin = (request, h) => {
  const user = request.user;

  if (user && user.role === 'admin') {
    return h.continue;
  } else {
    throw Boom.forbidden('Access denied');
  }
};

module.exports = {
  name: 'authorization-plugin',
  register: (server, options) => {
    const restrictedRoutes = options.restrictedRoutes || [];

    server.ext('onPreHandler', (request, h) => {
      if (restrictedRoutes.includes(request.route.path)) {
        return authorizeAdmin(request, h);
      } else {
        return h.continue;
      }
    });
  },
};
