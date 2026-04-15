const express = require('express');
const router = express.Router();
const usuarioControlador = require('../controllers/usuarioControlador');

// Ruta para el login (Esta ya la tienes)
router.post('/login', usuarioControlador.login);

// --- NUEVAS RUTAS PARA GESTIÓN DE USUARIOS ---

// Obtener todos los usuarios (GET)
router.get('/', usuarioControlador.obtenerUsuarios); 

// Crear un nuevo usuario (POST)
router.post('/', usuarioControlador.crearUsuario);

// Actualizar un usuario existente (PUT)
router.put('/:id', usuarioControlador.actualizarUsuario);

// Eliminar un usuario (DELETE)
router.delete('/:id', usuarioControlador.eliminarUsuario);

module.exports = router;
