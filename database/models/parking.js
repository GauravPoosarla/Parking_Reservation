'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Parking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Parking.init({
    startTime: DataTypes.TIME,
    endTime: DataTypes.TIME,
    date: DataTypes.DATEONLY,
    userEmail: DataTypes.STRING,
    slot: DataTypes.STRING,
    parkingStatus: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Parking',
  });
  return Parking;
};