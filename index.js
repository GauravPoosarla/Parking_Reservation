const Hapi = require('@hapi/hapi');
const routes = require('./src/routes/parkingRouter');
const fileWatcher = require('./config/fileWatcher');
require('dotenv').config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 8080,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },    
  });

  fileWatcher.watchConfigFile();

  await server.register(require('./src/plugins/authentication'));
  await server.register({
    plugin: require('./src/plugins/authorization'),
    options: {
      restrictedRoutes: ['/reservations'],
    },
  });
  server.route(routes);

  await server.start();
  console.log(`Server running on ${process.env.PORT || 8080} port`);
};

init();