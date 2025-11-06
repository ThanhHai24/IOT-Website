import { Router } from 'express';
import DevicesController from '../controllers/DevicesController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.get('/action_history', verifyToken, DevicesController.getActionHistory);
router.get('/', verifyToken, DevicesController.list);
router.post('/toggle', verifyToken, DevicesController.toggle);

export default router;
