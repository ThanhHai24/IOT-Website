import { Router } from 'express';
import DevicesController from '../controllers/DevicesController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: API quản lý thiết bị IoT
 */

/**
 * @swagger
 * /devices:
 *   get:
 *     summary: Lấy danh sách thiết bị
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thiết bị
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   status:
 *                     type: string
 *                   usage_seconds_today:
 *                     type: integer
 *                   usage_date:
 *                     type: string
 *                   last_state_changed_at:
 *                     type: string
 *               example:              
 *                 - id: 1
 *                   name: "Đèn 1"
 *                   status: "ON"
 *                   usage_seconds_today: 0
 *                   usage_date: "2025-10-03"
 *                   last_state_changed_at: "2025-10-03 13:38:05"
 *                 - id: 2
 *                   name: "Đèn 2"
 *                   status: "OFF"
 *                   usage_seconds_today: 300
 *                   usage_date: "2025-10-03"
 *                   last_state_changed_at: "2025-10-03 12:15:00"
 */

/**
 * @swagger
 * /devices/action_history:
 *   get:
 *     summary: Lấy lịch sử hành động của thiết bị
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch sử bật/tắt
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   deviceId:
 *                     type: integer
 *                   deviceName:
 *                     type: string
 *                   status:
 *                     type: string
 *                   actionBy:
 *                     type: string
 *                   time:
 *                     type: string
 *               example:               
 *                 - id: 58
 *                   deviceId: 3
 *                   deviceName: "Đèn 3"
 *                   status: "ON"
 *                   actionBy: "User"
 *                   time: "2025-10-03 13:38:09"
 *                 - id: 57
 *                   deviceId: 2
 *                   deviceName: "Đèn 2"
 *                   status: "OFF"
 *                   actionBy: "System"
 *                   time: "2025-10-03 13:20:00"
 */

/**
 * @swagger
 * /devices/toggle:
 *   post:
 *     summary: Bật/tắt thiết bị
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 2
 *               status:
 *                 type: string
 *                 enum: [ON, OFF]
 *                 example: "ON"
 *     responses:
 *       200:
 *         description: Trạng thái thiết bị sau khi toggle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                     topic:
 *                       type: string
 *                     msg:
 *                       type: string
 *               example:             
 *                 ok: true
 *                 info:
 *                   topic: "esp8266/devices"
 *                   msg: "{\"id\":2,\"status\":\"OFF\",\"actionBy\":\"User\"}"
 */

router.get('/action_history', verifyToken, DevicesController.getActionHistory);
router.get('/', verifyToken, DevicesController.list);
router.post('/toggle', verifyToken, DevicesController.toggle);

export default router;
