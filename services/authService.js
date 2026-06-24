/**
 * SERVICIO DE AUTENTICACIÓN
 * Maneja validación de credenciales, control de sesión y auditoría.
 */
import db from '../config/db.js';

export const loginUsuario = async (user, pass) => {
    try {
        const sql = `SELECT id_usuario, nombre, rol FROM usuarios WHERE usuario = ? AND password = ? AND estado = 1`;
        const [results] = await db.query(sql, [user, pass]);

        if (results.length === 0) {
            // Error personalizado para atraparlo en el controlador
            const error = new Error('Usuario o clave incorrecta');
            error.code = 'CREDENTIALS_INVALID';
            throw error;
        }

        const usuario = results[0];

        // 🕒 Auditoría y Estado en vivo
        await db.query("UPDATE usuarios SET estado_sesion = 'activo', ultima_accion = 'Inició sesión en la plataforma' WHERE id_usuario = ?", [usuario.id_usuario]);
        await db.query("INSERT INTO historial_sesiones (id_usuario, evento) VALUES (?, 'LOGIN')", [usuario.id_usuario]);

        return usuario;
    } catch (error) {
        if (error.code) throw error;
        throw new Error(`Error en Base de Datos durante el login: ${error.message}`);
    }
};

export const logoutUsuario = async (idUsuario) => {
    try {
        // 🕒 Apagamos la luz LED en Railway e insertamos la auditoría
        await db.query("UPDATE usuarios SET estado_sesion = 'offline', ultima_accion = 'Cerró sesión de forma segura' WHERE id_usuario = ?", [idUsuario]);
        await db.query("INSERT INTO historial_sesiones (id_usuario, evento) VALUES (?, 'LOGOUT')", [idUsuario]);

        return { success: true, message: "Sesión cerrada correctamente en la nube" };
    } catch (error) {
        throw new Error(`Error en Base de Datos durante el logout: ${error.message}`);
    }
};