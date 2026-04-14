import express from 'express';
import { obtenerMesas, asignarMesaAMozo } from '../controllers/mesaControlador.js';

const router = express.Router();

// Ruta para ver el plano de 2 pisos
router.get('/mesas', obtenerMesas);

// Ruta para la asignación automática/manual
router.post('/mesas/asignar', asignarMesaAMozo);

export default router;