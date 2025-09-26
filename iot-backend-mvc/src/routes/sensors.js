import { Router } from 'express';
import SensorsController from '../controllers/SensorsController.js';
const router = Router();

router.get('/latest', SensorsController.latest);
router.get('/', SensorsController.list);
router.get("/today", SensorsController.today);

export default router;
