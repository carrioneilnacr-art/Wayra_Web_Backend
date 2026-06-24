import express from 'express';
import * as uc from '../controllers/usuarioController.js';

const router = express.Router();

router.get('/asignar-mozo', uc.getMozoDisponible);
router.get('/usuarios/mozos', uc.getListaMozos);
router.get('/admin/usuarios', uc.getStaff);
router.post('/admin/usuarios', uc.crearUsuario);
router.put('/admin/usuarios/:id', uc.actualizarUsuario);
router.delete('/admin/usuarios/:id', uc.eliminarUsuario);
router.put('/admin/usuarios/:id/estado', uc.cambiarEstado);

export default router;