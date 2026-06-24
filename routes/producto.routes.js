import express from 'express';
import { getProductosMozo, getProductosAdmin, crearProducto, actualizarProducto } from '../controllers/productoController.js';

const router = express.Router();

router.get('/productos', getProductosMozo);
router.get('/admin/productos/todos', getProductosAdmin);
router.post('/admin/productos', crearProducto);
router.put('/admin/productos/:id', actualizarProducto);

export default router;