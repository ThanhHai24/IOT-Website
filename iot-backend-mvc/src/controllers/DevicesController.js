import Joi from 'joi';
import { Device } from '../models/index.js';
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
  }
};
