const fs = require('fs');
const path = require('path');
const configFilePath = path.join(__dirname, '/slots.config.json');
const slotService = require('../src/services/slotConfigService');

const updateConfiguration = (config) => {
  const newSlotConfig = slotService.readSlotConfig();
  slotService.updateSlotConfig(newSlotConfig);
  console.log('Configuration updated:', config);
};

const readConfigFile = () => {
  try {
    const configFileContents = fs.readFileSync(configFilePath, 'utf-8');
    console.log('Configuration file contents:', configFileContents);
    const config = JSON.parse(configFileContents);
    updateConfiguration(config);
  } catch (error) {
    console.error('Error reading configuration file:', error);
  }
};

module.exports = {
  readConfigFile,
};
