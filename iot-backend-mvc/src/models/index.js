import { sequelize } from '../config/database.js';
import SensorData from './SensorData.js';
import Device from './Device.js';
import ActionHistory from './ActionHistory.js';

export async function syncModels() {
  await sequelize.authenticate();
  await sequelize.sync(); // tạo bảng nếu chưa có
}

export { SensorData, Device, ActionHistory };
