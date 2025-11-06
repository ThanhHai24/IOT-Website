import { Router } from 'express';
import SensorsController from '../controllers/SensorsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/latest', verifyToken, SensorsController.latest);
router.get('/', verifyToken, SensorsController.list);
router.get('/today', verifyToken, SensorsController.today);

export default router;
