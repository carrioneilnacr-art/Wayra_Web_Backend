/**
 * RUTAS DE MESAS
 * Define los endpoints y los enlaza con el controlador correspondiente.
 */
import express from 'express';
import { obtenerMesas, liberarMesa, asignarMozo } from '../controllers/mesaController.js';

const router = express.Router();

// Ruta: GET /api/mesas
router.get('/', obtenerMesas);

// Ruta: PUT /api/mesas/:id/liberar
router.put('/:id/liberar', liberarMesa);

// Ruta: POST /api/mesas/asignar
router.post('/asignar', asignarMozo);

export default router;