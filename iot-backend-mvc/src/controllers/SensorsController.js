import { SensorData } from '../models/index.js';

export default {
  // GET /api/sensors/latest
  latest: async (req, res) => {
    const row = await SensorData.findOne({ order: [['measured_at','DESC']] });
    res.json(row ?? {});
  },

  // GET /api/sensors?limit=100
  list: async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
    const rows = await SensorData.findAll({ order: [['measured_at','DESC']], limit });
    res.json(rows);
  }
};
