/**
 * SERVICIO DE RESERVAS
 * Centraliza la lógica de negocio, recepciones, check-in y consultas DB.
 */
import db from '../config/db.js';

export const actualizarReserva = async (id, datos) => {
    try {
        const sql = `UPDATE reservas SET 
            id_mesa = ?, dni_cliente = ?, nombre_cliente = ?, 
            telefono_cliente = ?, fecha_reserva = ?, hora_reserva = ?, 
            observacion = ?, id_mozo = ? 
            WHERE id_reserva = ?`;
        await db.query(sql, [
            datos.id_mesa, datos.dni_cliente, datos.nombre_cliente, 
            datos.telefono_cliente, datos.fecha_reserva, datos.hora_reserva, 
            datos.observacion, datos.id_mozo || null, id
        ]);
        return { success: true, message: "Reserva actualizada" };
    } catch (error) { throw new Error(`Error DB (Actualizar Reserva): ${error.message}`); }
};

export const obtenerReservasPorFecha = async (fecha) => {
    try {
        const sql = `
            SELECT r.*, u.nombre as nombre_mozo 
            FROM reservas r 
            LEFT JOIN usuarios u ON r.id_mozo = u.id_usuario 
            WHERE DATE(r.fecha_reserva) = ? AND r.estado_reserva != 'cancelada'
            ORDER BY r.hora_reserva ASC`;
        const [results] = await db.query(sql, [fecha || new Date().toISOString().split('T')[0]]);
        return results;
    } catch (error) { throw new Error(`Error DB (Obtener Reservas): ${error.message}`); }
};

export const crearReserva = async (datos) => {
    const connection = await db.getConnection(); // Usamos conexión individual para la transacción
    try {
        await connection.beginTransaction();

        const creadorId = datos.id_usuario || datos.id_mozo;

        const sqlInsert = `
            INSERT INTO reservas (id_mesa, id_mozo, id_recepcionista, dni_cliente, nombre_cliente, telefono_cliente, fecha_reserva, hora_reserva, estado_reserva, observacion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`;
        
        const [resultado] = await connection.query(sqlInsert, [
            datos.id_mesa, datos.id_mozo || null, creadorId || null, 
            datos.dni_cliente, datos.nombre_cliente, datos.telefono_cliente || '', 
            datos.fecha_reserva, datos.hora_reserva, datos.observacion || ''
        ]);

        const idNuevaReserva = resultado.insertId;

        await connection.query("UPDATE mesas SET estado = 'reservada' WHERE id_mesa = ?", [datos.id_mesa]);

        if (creadorId) {
            const msjAuditoria = `Realizó reserva para Mesa ${datos.id_mesa} | ID Reserva: #${idNuevaReserva}`;
            await connection.query("UPDATE usuarios SET ultima_accion = ? WHERE id_usuario = ?", [msjAuditoria, creadorId]);
        }

        await connection.commit();
        return { success: true, message: "Reserva insertada y mesa sincronizada" };
    } catch (error) {
        await connection.rollback();
        throw new Error(`Error DB (Crear Reserva Transaccional): ${error.message}`);
    } finally {
        connection.release();
    }
};

export const obtenerHorasOcupadas = async (idMesa, fecha) => {
    try {
        const sql = `SELECT hora_reserva FROM reservas WHERE id_mesa = ? AND DATE(fecha_reserva) = ? AND estado_reserva != 'cancelada'`;
        const [rows] = await db.query(sql, [idMesa, fecha]);
        return rows.map(r => r.hora_reserva.toString().substring(0, 5));
    } catch (error) { throw new Error(`Error DB (Horas Ocupadas): ${error.message}`); }
};

export const obtenerConteoMensual = async () => {
    try {
        const sql = `SELECT DATE_FORMAT(fecha_reserva, '%Y-%m-%d') as fecha, COUNT(*) as cantidad 
                     FROM reservas WHERE estado_reserva != 'cancelada' GROUP BY DATE(fecha_reserva)`;
        const [rows] = await db.query(sql);
        return rows;
    } catch (error) { throw new Error(`Error DB (Conteo Mensual): ${error.message}`); }
};

export const procesarCheckIn = async (idReserva, idUsuario) => {
    try {
        await db.query("UPDATE reservas SET estado_reserva = 'confirmada', id_recepcionista = ? WHERE id_reserva = ?", [idUsuario || null, idReserva]);
        if (idUsuario) {
            await db.query("UPDATE usuarios SET ultima_accion = CONCAT('Validó Check-In de Reserva #', ?) WHERE id_usuario = ?", [idReserva, idUsuario]);
        }
        return { success: true };
    } catch (error) { throw new Error(`Error DB (Check-In): ${error.message}`); }
};

export const anularReserva = async (idReserva) => {
    try {
        await db.query("UPDATE reservas SET estado_reserva = 'cancelada' WHERE id_reserva = ?", [idReserva]);
        return { success: true };
    } catch (error) { throw new Error(`Error DB (Anular Reserva): ${error.message}`); }
};

export const obtenerReservasMozoHoy = async (idMozo) => {
    try {
        const sql = `SELECT * FROM reservas WHERE DATE(fecha_reserva) = CURDATE() AND id_mozo = ? AND estado_reserva != 'completada' ORDER BY hora_reserva ASC`;
        const [rows] = await db.query(sql, [idMozo]);
        return rows;
    } catch (error) { return []; /* Devuelve array vacío en caso de error para no romper UI */ }
};