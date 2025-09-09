import { Router } from 'express';
import sensors from './sensors.js';
import devices from './devices.js';

const router = Router();
router.use('/sensors', sensors);
router.use('/devices', devices);
export default router;
