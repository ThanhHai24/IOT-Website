import { Router } from 'express';
import SensorsController from '../controllers/SensorsController.js';
import { verifyToken } from '../middleware/auth.js';

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
 *     security:
 *       - bearerAuth: []      # yêu cầu token
 *     responses:
 *       200:
 *         description: Trả về danh sách sensor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   temp:
 *                     type: number
 *                   humid:
 *                     type: number
 *                   light:
 *                     type: number
 *                   measured_at:
 *                     type: string
 *               example:              
 *                 - id: 2012
 *                   temp: 29.3
 *                   humid: 57
 *                   light: 268.333
 *                   measured_at: "2025-10-03 13:52:51"
 *                 - id: 2013
 *                   temp: 28.7
 *                   humid: 60
 *                   light: 150.25
 *                   measured_at: "2025-10-03 14:00:00"
 */

/**
 * @swagger
 * /sensors/latest:
 *   get:
 *     summary: Lấy dữ liệu cảm biến mới nhất
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về dữ liệu mới nhất
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 temp:
 *                   type: number
 *                 humid:
 *                   type: number
 *                 light:
 *                   type: number
 *                 measured_at:
 *                   type: string
 *               example:                
 *                 id: 2065
 *                 temp: 29.7
 *                 humid: 57
 *                 light: 266.667
 *                 measured_at: "2025-10-03 13:54:35"
 */

/**
 * @swagger
 * /sensors/today:
 *   get:
 *     summary: Lấy dữ liệu cảm biến trong ngày hôm nay
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về dữ liệu theo ngày
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   temp:
 *                     type: number
 *                   humid:
 *                     type: number
 *                   light:
 *                     type: number
 *                   measured_at:
 *                     type: string
 *               example:               
 *                 - id: 1560
 *                   temp: 28.1
 *                   humid: 61
 *                   light: 268.333
 *                   measured_at: "2025-10-03 13:37:57"
 *                 - id: 1561
 *                   temp: 28.4
 *                   humid: 61
 *                   light: 264.167
 *                   measured_at: "2025-10-03 13:37:57"
 */

router.get('/latest', verifyToken, SensorsController.latest);
router.get('/', verifyToken, SensorsController.list);
router.get('/today', verifyToken, SensorsController.today);

export default router;
