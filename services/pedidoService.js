/**
 * SERVICIO DE PEDIDOS
 * Lógica transaccional para creación de comandas, actualización de ítems y checkout.
 */
import db from '../config/db.js';

export const obtenerEstatusMozo = async (idMozo) => {
    try {
        const sql = `
            SELECT p.*,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'id_detalle', pd.id_detalle, 'id_producto', pd.id_producto,
                'nombre', prod.nombre, 'cantidad', pd.cantidad,
                'tiempo_estimado', prod.tiempo_estimado, 'fecha_agregado', pd.fecha_agregado,
                'subtotal', pd.subtotal
            )) FROM pedido_detalle pd JOIN productos prod ON pd.id_producto = prod.id_producto 
            WHERE pd.id_pedido = p.id_pedido) as items
            FROM pedidos p
            WHERE p.id_mozo = ? AND (DATE(p.fecha_pedido) = CURDATE() OR p.estado_pedido != 'PAGADO')
            ORDER BY p.id_pedido DESC`;
            
        const [rows] = await db.query(sql, [idMozo]);
        return rows.map(row => ({
            ...row,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || [])
        }));
    } catch (error) { throw new Error(`Error DB (Estatus Mozo): ${error.message}`); }
};

export const obtenerPedidosHoy = async () => {
    try {
        const sql = `
            SELECT p.*, 
            (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'id_detalle', pd.id_detalle, 'nombre', prod.nombre,
                'cantidad', pd.cantidad, 'tiempo_estimado', prod.tiempo_estimado,
                'subtotal', pd.subtotal
            )) FROM pedido_detalle pd JOIN productos prod ON pd.id_producto = prod.id_producto 
            WHERE pd.id_pedido = p.id_pedido) as items
            FROM pedidos p WHERE DATE(p.fecha_pedido) = CURDATE() OR p.estado_pedido != 'PAGADO'
            ORDER BY p.id_pedido DESC`;
            
        const [rows] = await db.query(sql);
        return rows.map(row => ({
            ...row,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || [])
        }));
    } catch (error) { throw new Error(`Error DB (Pedidos Hoy): ${error.message}`); }
};

export const crearPedido = async (datos) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Validar límite de mesas del mozo
        const [mesasActivas] = await connection.query(
            "SELECT COUNT(DISTINCT id_mesa) as cant FROM pedidos WHERE id_mozo = ? AND estado_pedido != 'PAGADO'",
            [datos.id_mozo]
        );
        
        if (mesasActivas[0].cant >= 4) {
            const err = new Error("Límite de 4 mesas alcanzado por este mozo.");
            err.code = "LIMITE_MESAS";
            throw err;
        }

        // 2. Insertar cabecera del pedido
        const sqlPedido = `INSERT INTO pedidos (id_mesa, id_mozo, fecha_pedido, total, estado_pedido, observacion) 
                           VALUES (?, ?, NOW(), ?, 'PREPARACION', ?)`;
        const [pedidoRes] = await connection.query(sqlPedido, [datos.id_mesa, datos.id_mozo, datos.total, datos.observacion || null]);
        const idPedido = pedidoRes.insertId;

        // 3. Insertar detalles de forma masiva
        const valoresDetalle = datos.items.map(item => [idPedido, item.id_producto, item.cantidad, item.subtotal]);
        await connection.query("INSERT INTO pedido_detalle (id_pedido, id_producto, cantidad, subtotal) VALUES ?", [valoresDetalle]);
        
        // 4. Sincronizar mesa y auditoría
        await connection.query("UPDATE mesas SET estado = 'ocupada', hora_ocupada = NOW() WHERE id_mesa = ?", [datos.id_mesa]);
        await connection.query("UPDATE usuarios SET ultima_accion = CONCAT('Registró pedido en Mesa ', ?) WHERE id_usuario = ?", [datos.id_mesa, datos.id_mozo]);

        await connection.commit();
        return { success: true, id_pedido: idPedido };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const agregarItemAPedido = async (idPedido, item) => {
    try {
        await db.query("INSERT INTO pedido_detalle (id_pedido, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)", 
            [idPedido, item.id_producto, item.cantidad, item.subtotal]);
        await db.query("UPDATE pedidos SET total = total + ? WHERE id_pedido = ?", [item.subtotal, idPedido]);
        return { success: true };
    } catch (error) { throw new Error(`Error DB (Agregar Item): ${error.message}`); }
};

export const eliminarItemDePedido = async (idDetalle) => {
    try {
        const [[item]] = await db.query("SELECT id_pedido, subtotal FROM pedido_detalle WHERE id_detalle = ?", [idDetalle]);
        if (item) {
            await db.query("UPDATE pedidos SET total = total - ? WHERE id_pedido = ?", [item.subtotal, item.id_pedido]);
            await db.query("DELETE FROM pedido_detalle WHERE id_detalle = ?", [idDetalle]);
        }
        return { success: true };
    } catch (error) { throw new Error(`Error DB (Eliminar Item): ${error.message}`); }
};

export const actualizarObservacion = async (idPedido, observacion) => {
    try {
        await db.query("UPDATE pedidos SET observacion = ? WHERE id_pedido = ?", [observacion, idPedido]);
        return { success: true };
    } catch (error) { throw new Error(`Error DB (Observación): ${error.message}`); }
};

export const procesarCheckout = async (idPedido, datosCheckout) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [pedidos] = await connection.query("SELECT total, id_mesa, id_mozo FROM pedidos WHERE id_pedido = ?", [idPedido]);
        if (pedidos.length === 0) throw new Error("Pedido no encontrado");
        const pedido = pedidos[0];

        let finalDni = datosCheckout.dni_cliente;
        let finalNombre = datosCheckout.nombre_cliente;

        if (!finalDni || !finalNombre) {
            const [reserva] = await connection.query(
                "SELECT dni_cliente, nombre_cliente FROM reservas WHERE id_mesa = ? AND estado_reserva = 'confirmada' AND DATE(fecha_reserva) = CURDATE() LIMIT 1",
                [pedido.id_mesa]
            );
            if (reserva.length > 0) {
                finalDni = finalDni || reserva[0].dni_cliente;
                finalNombre = finalNombre || reserva[0].nombre_cliente;
            }
        }

        await connection.query("INSERT INTO ventas (total, metodo_pago, tipo_comprobante, fecha_venta) VALUES (?, ?, ?, NOW())", 
            [pedido.total, datosCheckout.metodo_pago || 'EFECTIVO', datosCheckout.tipo_doc || 'BOLETA']);
        
        await connection.query("UPDATE pedidos SET dni_cliente = ?, nombre_cliente = ?, estado_pedido = 'PAGADO' WHERE id_pedido = ?", 
            [finalDni || '00000000', finalNombre || 'CLIENTE GENERAL', idPedido]);
        
        await connection.query("UPDATE mesas SET estado = 'disponible', hora_ocupada = NULL WHERE id_mesa = ?", [pedido.id_mesa]);
        await connection.query("UPDATE usuarios SET ultima_accion = CONCAT('Efectuó cobro de Mesa ', ?) WHERE id_usuario = ?", [pedido.id_mesa, pedido.id_mozo]);

        await connection.commit();
        return { success: true, message: "Venta registrada y mesa liberada" };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const obtenerBoleta = async (idPedido) => {
    try {
        const sqlPedido = `
            SELECT p.id_pedido, p.fecha_pedido, p.total, p.dni_cliente, p.nombre_cliente, 
                   p.id_mesa, u.nombre as nombre_mozo, p.estado_pedido
            FROM pedidos p JOIN usuarios u ON p.id_mozo = u.id_usuario WHERE p.id_pedido = ?`;
        const [pedido] = await db.query(sqlPedido, [idPedido]);
        if (pedido.length === 0) {
             const error = new Error("Comprobante no encontrado");
             error.code = 'NOT_FOUND';
             throw error;
        }

        const sqlDetalle = `
            SELECT pd.cantidad, pd.subtotal, pr.nombre as producto, pr.precio as precio_unitario
            FROM pedido_detalle pd JOIN productos pr ON pd.id_producto = pr.id_producto WHERE pd.id_pedido = ?`;
        const [items] = await db.query(sqlDetalle, [idPedido]);
        
        const [venta] = await db.query("SELECT metodo_pago, tipo_comprobante, fecha_venta FROM ventas WHERE id_venta = (SELECT MAX(id_venta) FROM ventas) LIMIT 1");

        return {
            success: true,
            header: { restaurante: "Wayra Nikkei", ruc: "20123456789", direccion: "Los Olivos, Lima", telefono: "987 654 321" },
            pedido: pedido[0],
            items: items,
            pago: venta[0] || { metodo_pago: "EFECTIVO", tipo_comprobante: "BOLETA" }
        };
    } catch (error) {
        if (error.code) throw error;
        throw new Error(`Error DB (Boleta): ${error.message}`);
    }
};