import Joi from 'joi';
import { ActionHistory, Device } from '../models/index.js';
import { publishDeviceCommand } from '../services/mqttService.js';
import { Op, fn, col, literal, where as SequelizeWhere } from "sequelize";

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
    if (value.id != null) {
      exists = await Device.findByPk(value.id);
    } else {
      exists = await Device.findOne({ where: { name: value.name } });
    }

    if (!exists) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // publish command kèm actionBy = 'User'
    const info = await publishDeviceCommand({
      ...value,
      actionBy: 'User'
    });

    res.json({ ok: true, info });
  },

  // GET /api/devices/action_history
  getActionHistory: async (req, res) => {
    try {
      let {
        search = "",
        field = "all",
        sort = "time",
        order = "desc",
        page = 1,
        limit = 10,
      } = req.query;

      page = Number(page) || 1;
      limit = Number(limit) || 10;

      const validSortFields = ["time", "status", "deviceName", "actionBy"];
      const validOrders = ["ASC", "DESC"];
      const sortField = validSortFields.includes(sort) ? sort : "time";
      const sortOrder = validOrders.includes(order.toUpperCase())
        ? order.toUpperCase()
        : "DESC";

      // where cho search
      const where = {};
      if (search) {
        const timeCondition = SequelizeWhere(
          fn("DATE_FORMAT", col("ActionHistory.time"), "%Y-%m-%d %H:%i:%s"),
          { [Op.like]: `%${search}%` }
        );

        if (field === "status") {
          where[Op.and] = [
            SequelizeWhere(literal("CAST(`ActionHistory`.`status` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
          ];
        } else if (field === "device") {
          where[Op.and] = [
            SequelizeWhere(literal("CAST(`Device`.`name` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
          ];
        } else if (field === "actionBy") {
          where[Op.and] = [
            SequelizeWhere(literal("CAST(`ActionHistory`.`actionBy` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
          ];
        } else if (field === "time") {
          where[Op.and] = [timeCondition];
        } else if (field === "all") {
          where[Op.or] = [
            SequelizeWhere(literal("CAST(`ActionHistory`.`status` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
            SequelizeWhere(literal("CAST(`Device`.`name` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
            SequelizeWhere(literal("CAST(`ActionHistory`.`actionBy` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
            timeCondition,
          ];
        }
      }

      // đếm tổng số record
      const total = await ActionHistory.count({
        where,
        include: [{ model: Device, attributes: [] }],
      });

      // lấy dữ liệu trang hiện tại
      const rows = await ActionHistory.findAll({
        where,
        include: [{ model: Device, attributes: ["name"] }],
        order: [
          [
            sortField === "deviceName"
              ? col("Device.name")
              : col(`ActionHistory.${sortField}`),
            sortOrder,
          ],
        ],
        offset: (page - 1) * limit,
        limit,
      });

      // format JSON trả về
      const data = rows.map(r => ({
        id: r.id,
        deviceId: r.deviceId,
        deviceName: r.Device?.name || `Device #${r.deviceId}`,
        status: r.status,
        actionBy: r.actionBy,
        time: r.time,
      }));

      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      });
    } catch (err) {
      console.error("Lỗi khi lấy action history:", err);
      res.status(500).json({ error: err.message });
    }
  }
};
