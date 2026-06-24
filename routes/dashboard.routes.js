import express from 'express';
import { getMetrics, getHistorial } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/admin/metrics', getMetrics);
router.get('/admin/historial', getHistorial);

export default router;