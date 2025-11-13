import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class SensorData extends Model {}
SensorData.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  temp:  { type: DataTypes.FLOAT, allowNull: false },
  humid: { type: DataTypes.FLOAT, allowNull: false },
  light: { type: DataTypes.FLOAT, allowNull: false },
  rain:  { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  measured_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  modelName: 'SensorData',
  tableName: 'sensor_data',
  timestamps: false
});

export default SensorData;
