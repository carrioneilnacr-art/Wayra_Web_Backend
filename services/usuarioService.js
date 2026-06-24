import db from '../config/db.js';

export const obtenerMozoDisponible = async () => {
    try {
        const [rows] = await db.query("SELECT id_usuario, nombre FROM usuarios WHERE rol = 'mozo' AND estado = 1 LIMIT 1");
        return rows.length > 0 ? { success: true, mozo: rows[0] } : { success: false, message: "No hay mozos disponibles" };
    } catch (error) { throw new Error(error.message); }
};

export const obtenerListaMozos = async () => {
    try {
        const [rows] = await db.query("SELECT id_usuario, nombre FROM usuarios WHERE rol = 'mozo' AND estado = 1");
        return rows;
    } catch (error) { throw new Error(error.message); }
};

export const obtenerStaffReactivo = async () => {
    try {
        const [usuarios] = await db.query(`SELECT id_usuario, nombre, usuario, rol, estado, IFNULL(estado_sesion, 'offline') as estado_sesion, IFNULL(ultima_accion, 'Sin actividad reciente') as ultima_accion FROM usuarios`);
        const [pedidosActivos] = await db.query("SELECT id_mozo FROM pedidos WHERE estado_pedido = 'PREPARACION' AND id_mozo IS NOT NULL");
        const [reservas] = await db.query("SELECT id_recepcionista FROM reservas WHERE (estado_reserva = 'confirmada' OR estado_reserva = 'en mesa') AND DATE(fecha_reserva) = CURDATE() AND id_recepcionista IS NOT NULL");

        return usuarios.map(u => ({
            ...u,
            mesas_assigned: pedidosActivos.filter(p => p.id_mozo === u.id_usuario).length,
            checkins_hoy: reservas.filter(r => r.id_recepcionista === u.id_usuario).length
        }));
    } catch (error) { throw new Error(error.message); }
};

export const crearUsuario = async (d) => {
    try {
        await db.query("INSERT INTO usuarios (nombre, usuario, password, rol, estado, estado_sesion, ultima_accion) VALUES (?, ?, ?, ?, 1, 'offline', 'Perfil creado')", [d.nombre, d.usuario, d.password, d.rol]);
        return { success: true };
    } catch (error) { throw new Error(error.message); }
};

export const actualizarUsuario = async (id, d) => {
    try {
        if (d.password && d.password.trim() !== "") {
            await db.query("UPDATE usuarios SET nombre = ?, usuario = ?, rol = ?, password = ? WHERE id_usuario = ?", [d.nombre, d.usuario, d.rol, d.password, id]);
        } else {
            await db.query("UPDATE usuarios SET nombre = ?, usuario = ?, rol = ? WHERE id_usuario = ?", [d.nombre, d.usuario, d.rol, id]);
        }
        return { success: true };
    } catch (error) { throw new Error(error.message); }
};

export const eliminarUsuario = async (id) => {
    await db.query("DELETE FROM usuarios WHERE id_usuario = ?", [id]);
    return { success: true };
};

export const cambiarEstadoUsuario = async (id, estado) => {
    await db.query("UPDATE usuarios SET estado = ? WHERE id_usuario = ?", [estado, id]);
    return { success: true };
};