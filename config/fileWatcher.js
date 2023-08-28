const path = require('path');
const chokidar = require('chokidar');
const updateConfiguration = require('./updateConfiguration');

const configFilePath = path.join(__dirname, '/slots.config.json');
const watchConfigFile = () => {
  const watcher = chokidar.watch(configFilePath, {
    persistent: true,
  });

  watcher.on('change', () => {
    console.log('Configuration file has changed.');
    updateConfiguration.readConfigFile();
  });
};

module.exports = {
  watchConfigFile,
};
