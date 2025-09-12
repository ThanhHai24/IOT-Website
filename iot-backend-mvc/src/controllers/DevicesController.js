import Joi from 'joi';
import { ActionHistory, Device } from '../models/index.js';
import { publishDeviceCommand } from '../services/mqttService.js';

const toggleSchema = Joi.object({
  id: Joi.number().integer().optional(),
  name: Joi.string().optional(),
  status: Joi.string().valid('ON','OFF').required()
}).or('id','name'); // bắt buộc có id hoặc name

export default {
  // GET /api/devices
  list: async (req, res) => {
    const rows = await Device.findAll({ order: [['id','ASC']] });
    res.json(rows);
  },

  // POST /api/devices/toggle { id|name, status }
  toggle: async (req, res) => {
    const { value, error } = toggleSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    // kiểm tra tồn tại thiết bị trước khi publish
    let exists = null;
    if (value.id != null) exists = await Device.findByPk(value.id);
    else exists = await Device.findOne({ where: { name: value.name } });

    if (!exists) return res.status(404).json({ error: 'Device not found' });

    const info = await publishDeviceCommand(value);
    res.json({ ok: true, info });
  },

  getActionHistory: async (req, res) => {
    try {
      const actionHistory = await ActionHistory.findAll({
        order: [['time', 'DESC']]   // sắp xếp mới nhất trước
      });
      res.json(actionHistory);
    } catch (error) {
      console.error("Lỗi khi lấy action history:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  }
};
