import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Device extends Model {}
Device.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  status: { type: DataTypes.ENUM('ON','OFF'), allowNull: false, defaultValue: 'OFF' },
  usage_seconds_today: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  usage_date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  last_state_changed_at: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  modelName: 'Device',
  tableName: 'devices',
  timestamps: false
});

export default Device;
