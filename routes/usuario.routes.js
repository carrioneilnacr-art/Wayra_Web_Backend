const express = require('express');
const router = express.Router();
const usuarioControlador = require('../controllers/usuarioControlador');

// Definimos la ruta POST para el login
router.post('/login', usuarioControlador.login);

module.exports = router;