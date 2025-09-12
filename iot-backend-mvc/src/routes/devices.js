import { Router } from 'express';
import DevicesController from '../controllers/DevicesController.js';
const router = Router();

router.get('/action_history', DevicesController.getActionHistory);
router.get('/', DevicesController.list);
router.post('/toggle', DevicesController.toggle);

export default router;
