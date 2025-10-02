import { Router } from 'express';
import DevicesController from '../controllers/DevicesController.js';
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
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Air Conditioner
 */

/**
 * @swagger
 * /devices/action_history:
 *   get:
 *     summary: Lấy lịch sử hành động của thiết bị
 *     tags: [Devices]
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
 *                   deviceId:
 *                     type: integer
 *                     example: 1
 *                   action:
 *                     type: string
 *                     example: "ON"
 *                   timestamp:
 *                     type: string
 *                     example: "2025-10-03T08:00:00Z"
 */

/**
 * @swagger
 * /devices/toggle:
 *   post:
 *     summary: Bật/tắt thiết bị
 *     tags: [Devices]
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
 *               action:
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
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 status:
 *                   type: string
 */


router.get('/action_history', DevicesController.getActionHistory);
router.get('/', DevicesController.list);
router.post('/toggle', DevicesController.toggle);

export default router;
