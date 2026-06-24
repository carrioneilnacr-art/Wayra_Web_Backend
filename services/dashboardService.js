import db from '../config/db.js';

export const obtenerMetricas = async () => {
    try {
        const [kpis] = await db.query(`SELECT IFNULL(SUM(total), 0) as ventasHoy, COUNT(id_pedido) as pedidos, IFNULL(AVG(total), 0) as ticketPromedio FROM pedidos WHERE DATE(fecha_pedido) = CURDATE() AND estado_pedido = 'PAGADO'`);
        const [historico] = await db.query(`SELECT COUNT(id_pedido) as total FROM pedidos WHERE estado_pedido = 'PAGADO'`);
        const [ventasSemana] = await db.query(`SELECT DATE(fecha_pedido) as fecha, SUM(total) as total FROM pedidos WHERE fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND estado_pedido = 'PAGADO' GROUP BY DATE(fecha_pedido) ORDER BY fecha ASC`);
        const [topProductos] = await db.query(`SELECT p.nombre, SUM(pd.cantidad) as cantidad FROM pedido_detalle pd JOIN productos p ON pd.id_producto = p.id_producto JOIN pedidos ped ON pd.id_pedido = ped.id_pedido WHERE ped.estado_pedido = 'PAGADO' GROUP BY p.id_producto ORDER BY cantidad DESC LIMIT 5`);
        const [mozos] = await db.query(`SELECT u.nombre, COUNT(p.id_pedido) as mesas, SUM(p.total) as total_vendido FROM usuarios u JOIN pedidos p ON u.id_usuario = p.id_mozo WHERE p.estado_pedido = 'PAGADO' GROUP BY u.id_usuario`);

        let insightMensaje = null;
        let alertaMensaje = "Flujo del salón estable: Rendimiento de comensales dentro de los parámetros esperados.";

        if (topProductos.length >= 3) {
            const totalTop3 = topProductos.slice(0, 3).reduce((sum, item) => sum + Number(item.cantidad), 0);
            const totalGeneralPlatos = topProductos.reduce((sum, item) => sum + Number(item.cantidad), 0);
            if (totalGeneralPlatos > 0 && (totalTop3 / totalGeneralPlatos) >= 0.5) {
                insightMensaje = "Patrón de consumo detectado: Tus 3 platos principales concentran la mayor parte de la demanda. Asegura el stock de insumos.";
            }
        }

        if (kpis[0].ventasHoy < 300) alertaMensaje = "Alerta operativa: El flujo de ingresos del turno actual se encuentra por debajo del umbral mínimo proyectado.";

        return { 
            kpis: { ...kpis[0], totalPedidosHistoricos: historico[0].total }, 
            ventasSemana, topProductos, rendimientoMozos: mozos,
            notificaciones: { insight: insightMensaje, alerta: alertaMensaje }
        };
    } catch (error) { throw new Error(error.message); }
};

export const obtenerHistorialVentas = async (fecha) => {
    try {
        const [rows] = await db.query(`SELECT p.id_pedido, TIME_FORMAT(p.fecha_pedido, '%H:%i') as hora, p.id_mesa, p.total, u.nombre as nombre_mozo FROM pedidos p JOIN usuarios u ON p.id_mozo = u.id_usuario WHERE DATE(p.fecha_pedido) = ? AND p.estado_pedido = 'PAGADO' ORDER BY p.fecha_pedido DESC`, [fecha]);
        return rows;
    } catch (error) { throw new Error(error.message); }
};