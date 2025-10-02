import { Op, fn, col, where as SequelizeWhere, literal } from "sequelize";
import { SensorData } from "../models/index.js";

export default {
  // GET /api/sensors/latest
  latest: async (req, res) => {
    const row = await SensorData.findOne({ order: [["measured_at", "DESC"]] });
    res.json(row ?? {});
  },

  // GET /api/sensors/today
  today: async (req, res) => {
    try {
      // Lấy ngày hôm nay theo timezone VN (+7)
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`; // yyyy-MM-dd

      // Query tất cả bản ghi measured_at trong ngày hôm nay
      const rows = await SensorData.findAll({
        where: {
          measured_at: {
            [Op.between]: [
              `${dateStr} 00:00:00`,
              `${dateStr} 23:59:59`
            ]
          }
        },
        order: [["measured_at", "ASC"]]
      });

      if (!rows.length) return res.json({ rows: [], stats: {} });

      // Tính average, min, max cho từng field
      const temps  = rows.map(r => Number(r.temp));
      const humids = rows.map(r => Number(r.humid));
      const lights = rows.map(r => Number(r.light));

      const stats = {
        temp: {
          avg: temps.reduce((a,b)=>a+b,0) / temps.length,
          hi:  Math.max(...temps),
          lo:  Math.min(...temps)
        },
        humid: {
          avg: humids.reduce((a,b)=>a+b,0) / humids.length,
          hi:  Math.max(...humids),
          lo:  Math.min(...humids)
        },
        light: {
          avg: lights.reduce((a,b)=>a+b,0) / lights.length,
          hi:  Math.max(...lights),
          lo:  Math.min(...lights)
        }
      };

      res.json({ rows, stats });
    } catch (err) {
      console.error("Error in getSensors/today:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/sensors
  list: async (req, res) => {
    try {
      let {
        search = "",
        field = "all",
        sort = "measured_at",
        order = "desc",
        page = 1,
        limit = 50,
      } = req.query;

      page = Number(page) || 1;
      limit = Number(limit) || 50;

      const validSortFields = ["measured_at", "temp", "humid", "light"];
      const validOrders = ["ASC", "DESC"];
      const sortField = validSortFields.includes(sort) ? sort : "measured_at";
      const sortOrder = validOrders.includes(order.toUpperCase())
        ? order.toUpperCase()
        : "DESC";

      const where = {};
      if (search) {
        const timeCondition = SequelizeWhere(
          fn("DATE_FORMAT", col("measured_at"), "%Y-%m-%d %H:%i:%s"),
          { [Op.like]: `%${search}%` }
        );

        if (field === "temperature") {
          where[Op.and] = [
            SequelizeWhere(literal("CAST(`temp` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
          ];
        } else if (field === "humidity") {
          where[Op.and] = [
            SequelizeWhere(literal("CAST(`humid` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
          ];
        } else if (field === "light") {
          where[Op.and] = [
            SequelizeWhere(literal("CAST(`light` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
          ];
        } else if (field === "time") {
          where[Op.and] = [timeCondition];
        } else if (field === "all") {
          where[Op.or] = [
            SequelizeWhere(literal("CAST(`temp` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
            SequelizeWhere(literal("CAST(`humid` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
            SequelizeWhere(literal("CAST(`light` AS CHAR)"), {
              [Op.like]: `%${search}%`,
            }),
            timeCondition,
          ];
        }
      }

      // đếm tổng số record
      const total = await SensorData.count({ where });

      // lấy dữ liệu
      const rows = await SensorData.findAll({
        where,
        order: [[sortField, sortOrder]],
        offset: (page - 1) * limit,
        limit: Number(limit),
      });

      res.json({
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.error("Error in getSensors:", err);
      res.status(500).json({ error: err.message });
    }
  },
};
