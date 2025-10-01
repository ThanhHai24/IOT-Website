import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import Device from './Device.js';

class ActionHistory extends Model {}

ActionHistory.init({
  id: { 
    type: DataTypes.BIGINT, 
    autoIncrement: true, 
    primaryKey: true 
  },
  deviceId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM('ON','OFF'), 
    allowNull: false 
  },
  actionBy: { 
    type: DataTypes.ENUM('User','System'), 
    allowNull: false, 
    defaultValue: 'System' 
  },
  time: { 
    type: DataTypes.DATE, 
    allowNull: false, 
    defaultValue: DataTypes.NOW 
  }
}, {
  sequelize,
  modelName: 'ActionHistory',
  tableName: 'action_history',
  timestamps: false
});

ActionHistory.belongsTo(Device, { foreignKey: 'deviceId' });

export default ActionHistory;
