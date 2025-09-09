import { Router } from 'express';
import SensorsController from '../controllers/SensorsController.js';
const router = Router();

router.get('/latest', SensorsController.latest);
router.get('/', SensorsController.list);

export default router;
