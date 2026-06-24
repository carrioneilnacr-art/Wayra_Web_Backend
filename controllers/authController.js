/**
 * CONTROLADOR DE AUTENTICACIÓN
 * Gestiona peticiones HTTP de login y logout.
 */
import * as authService from '../services/authService.js';

export const login = async (req, res) => {
    try {
        const { user, pass } = req.body;

        if (!user || !pass) {
            return res.status(400).json({ success: false, message: "Faltan credenciales" });
        }

        const usuario = await authService.loginUsuario(user, pass);
        res.json({ success: true, usuario });

    } catch (error) {
        console.error("❌ ERROR Controlador Auth (Login):", error);
        
        // Si la clave o usuario son incorrectos, enviamos error 401
        if (error.code === 'CREDENTIALS_INVALID') {
            return res.status(401).json({ success: false, message: error.message });
        }
        
        res.status(500).json({ error: "Error en Login", detail: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const { id_usuario } = req.body;

        if (!id_usuario) {
            return res.status(400).json({ error: "Falta ID de usuario" });
        }

        const resultado = await authService.logoutUsuario(id_usuario);
        res.json(resultado);

    } catch (error) {
        console.error("❌ ERROR Controlador Auth (Logout):", error);
        res.status(500).json({ error: "Error en Logout", detail: error.message });
    }
};