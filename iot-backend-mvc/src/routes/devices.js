import { Router } from 'express';
import DevicesController from '../controllers/DevicesController.js';
const router = Router();

router.get('/', DevicesController.list);
router.post('/toggle', DevicesController.toggle);

export default router;
