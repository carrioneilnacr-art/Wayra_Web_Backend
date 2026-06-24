/**
 * RUTAS DE PEDIDOS Y CHECKOUT
 */
import express from 'express';
import { 
    estatusMozo, pedidosHoy, crearPedido, agregarItem, 
    eliminarItem, cambiarObservacion, checkout, verBoleta 
} from '../controllers/pedidoController.js';

const router = express.Router();

// Estas rutas se montarán en '/api' directamente en tu index.js

// -- Rutas de Estatus y Lectura --
router.get('/mozo/pedidos/estatus', estatusMozo);
router.get('/pedidos/hoy', pedidosHoy);
router.get('/admin/boleta/:id_pedido', verBoleta);

// -- Rutas de Transacción --
router.post('/pedidos', crearPedido);
router.post('/pedidos/:id/agregar', agregarItem);
router.delete('/pedidos/detalle/:id_detalle', eliminarItem);
router.put('/pedidos/:id/observacion', cambiarObservacion);
router.put('/pedidos/:id/checkout', checkout);

export default router;