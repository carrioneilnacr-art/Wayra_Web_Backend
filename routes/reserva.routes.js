/**
 * RUTAS DE RESERVAS
 */
import express from 'express';
import { 
    actualizarReserva, obtenerReservas, crearReserva, 
    obtenerHorasOcupadas, obtenerConteoMensual, checkInReserva, 
    anularReserva, reservasMozoHoy 
} from '../controllers/reservaController.js';

const router = express.Router();

// Ojo: Estas rutas se montarán en '/api/reservas'
router.get('/', obtenerReservas);
router.post('/', crearReserva);
router.get('/ocupadas', obtenerHorasOcupadas);
router.get('/conteo-mensual', obtenerConteoMensual);
router.get('/hoy', reservasMozoHoy);

// Rutas con parámetros ID dinámicos (van al final para evitar choques)
router.put('/:id', actualizarReserva);
router.put('/:id/checkin', checkInReserva);
router.put('/:id/anular', anularReserva);

export default router;