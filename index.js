const Hapi = require('@hapi/hapi');
require('dotenv').config();
const routes = require('./src/routes/parkingRouter');


const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 8080,
    host: process.env.HOST || 'localhost',
  });

  await server.register(require('./src/plugins/authentication'));
  server.route(routes);

  await server.start();
  console.log(`Server running on ${process.env.PORT || 8080} port`);
};

init();