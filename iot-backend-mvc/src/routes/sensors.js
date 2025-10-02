import { Router } from 'express';
import SensorsController from '../controllers/SensorsController.js';
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sensors
 *   description: API quản lý dữ liệu cảm biến
 */

/**
 * @swagger
 * /sensors:
 *   get:
 *     summary: Lấy danh sách dữ liệu cảm biến
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: Trả về danh sách sensor
 */

/**
 * @swagger
 * /sensors/latest:
 *   get:
 *     summary: Lấy dữ liệu cảm biến mới nhất
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: Trả về dữ liệu mới nhất
 */

/**
 * @swagger
 * /sensors/today:
 *   get:
 *     summary: Lấy dữ liệu cảm biến trong ngày hôm nay
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: Trả về dữ liệu theo ngày
 */

router.get('/latest', SensorsController.latest);
router.get('/', SensorsController.list);
router.get("/today", SensorsController.today);

export default router;
