/**
 * RUTAS DE AUTENTICACIÓN
 */
import express from 'express';
import { login, logout } from '../controllers/authController.js';

const router = express.Router();

// Ojo: Estas rutas se montarán en el index como '/api', 
// por lo que el frontend seguirá viendo '/api/login' y '/api/logout'
router.post('/login', login);
router.post('/logout', logout);

export default router;