const fs = require('fs');
const path = require('path');
const slotConfigFilePath = path.join(__dirname, '../../config/slots.config.json');

const readSlotConfig = () => {
  try {
    const configFileContents = fs.readFileSync(slotConfigFilePath, 'utf-8');
    const config = JSON.parse(configFileContents);
    return config;
  } catch (error) {
    console.error('Error reading slot configuration file:', error);
    return [];
  }
};

const updateSlotConfig = (newSlotConfig) => {
  try {
    fs.writeFileSync(slotConfigFilePath, JSON.stringify(newSlotConfig, null, 2));
    console.log('Slot configuration file updated.');
  } catch (error) {
    console.error('Error updating slot configuration file:', error);
  }
};

module.exports = {
  readSlotConfig,
  updateSlotConfig,
};