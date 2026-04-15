import express from 'express';
import cors from 'cors';
import pool from './config/db.js';

const app = express();

// Configuración de CORS blindada
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// ==========================================
// 🔐 SISTEMA DE AUTENTICACIÓN (LOGIN)
// ==========================================
app.post('/api/login', async (req, res) => {
  try {
    const { user, pass } = req.body;
    const sql = `SELECT id_usuario, nombre, rol FROM usuarios WHERE usuario = ? AND password = ? AND estado = 1`;
    const [results] = await pool.query(sql, [user, pass]);
    results.length > 0 ? res.json({ success: true, usuario: results[0] }) : res.status(401).json({ success: false });
  } catch (err) { res.status(500).json({ error: "Error en Login", detail: err.message }); }
});

// ==========================================
// 📅 MÓDULO DE RECEPCIÓN (RESERVAS)
// ==========================================

// Obtener reservas por fecha (Mejorado para el Dashboard)
app.get('/api/reservas', async (req, res) => {
  const { fecha } = req.query;
  try {
    const sql = `
      SELECT r.*, u.nombre as nombre_mozo 
      FROM reservas r 
      LEFT JOIN usuarios u ON r.id_mozo = u.id_usuario 
      WHERE DATE(r.fecha_reserva) = ? 
      ORDER BY r.hora_reserva ASC`;
    const [results] = await pool.query(sql, [fecha || new Date().toISOString().split('T')[0]]);
    res.json(results);
  } catch (err) { res.status(500).json({ error: "Error al obtener reservas", detail: err.message }); }
});

// Crear o Actualizar Reserva con id_mozo asignado
app.post('/api/reservas', async (req, res) => {
  try {
    const { id_mesa, id_mozo, dni_cliente, nombre_cliente, apellido_cliente, telefono_cliente, fecha_reserva, hora_reserva, observacion } = req.body;
    const sql = `INSERT INTO reservas (id_mesa, id_mozo, dni_cliente, nombre_cliente, apellido_cliente, telefono_cliente, fecha_reserva, hora_reserva, observacion, estado_reserva) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`;
    await pool.query(sql, [id_mesa, id_mozo, dni_cliente, nombre_cliente, apellido_cliente, telefono_cliente, fecha_reserva, hora_reserva, observacion]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Check-in: Cuando llega el cliente (Dispara el aviso al Mozo)
app.put('/api/reservas/:id/checkin', async (req, res) => {
  try {
    await pool.query("UPDATE reservas SET estado_reserva = 'confirmada' WHERE id_reserva = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Obtener solo mozos activos (Para el selector del ModalReserva)
app.get('/api/usuarios/mozos', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id_usuario, nombre FROM usuarios WHERE rol = 'mozo' AND estado = 1");
    res.json(rows);
  } catch (err) { res.status(500).json(err); }
});

// ==========================================
// 🍽️ MÓDULO DE GESTIÓN DE MESAS
// ==========================================
app.get('/api/mesas', async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM mesas");
    res.json(results);
  } catch (err) {
    // Esto enviará el error real a la consola de Render
    console.error("❌ ERROR CRÍTICO EN DB:", err);
    
    // Esto te mostrará el error real en el navegador para que no adivinemos
    res.status(500).json({ 
      error: "Error al obtener mesas", 
      detalle: err.message,
      codigo: err.code 
    }); 
  }
});

app.put('/api/mesas/:id/liberar', async (req, res) => {
  try {
    await pool.query("UPDATE mesas SET estado = 'disponible' WHERE id_mesa = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Error al liberar mesa", detail: err.message }); }
});

// ==========================================
// 🍣 MÓDULO DEL MOZO (RESERVAS ASIGNADAS Y PEDIDOS)
// ==========================================

// Reservas de hoy para un mozo específico (Carrusel del MonitorPedidos)
app.put('/api/reservas/:id/anular', async (req, res) => {
  try {
    await pool.query("UPDATE reservas SET estado_reserva = 'cancelada' WHERE id_reserva = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/reservas/hoy', async (req, res) => {
  const { id_mozo } = req.query;
  try {
    const sql = `SELECT * FROM reservas WHERE DATE(fecha_reserva) = CURDATE() AND id_mozo = ? AND estado_reserva != 'completada' ORDER BY hora_reserva ASC`;
    const [rows] = await pool.query(sql, [id_mozo]);
    res.json(rows);
  } catch (err) { res.json([]); }
});

app.get('/api/productos', async (req, res) => {
  try {
    const [results] = await pool.query("SELECT id_producto, nombre, precio, categoria, tiempo_estimado, estado FROM productos");
    res.json(results);
  } catch (err) { res.json([]); }
});

app.get('/api/pedidos/hoy', async (req, res) => {
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
    const [rows] = await pool.query(sql);
    res.json(rows.map(row => ({ ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []) })));
  } catch (err) { res.json([]); }
});

app.post('/api/pedidos', async (req, res) => {
  const { id_mesa, id_mozo, nombre_cliente, items, total, observacion } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const sqlPedido = `INSERT INTO pedidos (id_mesa, id_mozo, nombre_cliente, total, estado_pedido, fecha_pedido, observacion) 
                       VALUES (?, ?, ?, ?, 'PREPARACION', NOW(), ?)`;
    const [pedidoRes] = await connection.query(sqlPedido, [id_mesa, id_mozo, nombre_cliente, total, observacion || '']);
    const idPedido = pedidoRes.insertId;
    const sqlDetalle = `INSERT INTO pedido_detalle (id_pedido, id_producto, cantidad, subtotal) VALUES ?`;
    const valoresDetalle = items.map(item => [idPedido, item.id_producto, item.cantidad, item.subtotal]);
    await connection.query(sqlDetalle, [valoresDetalle]);
    await connection.query("UPDATE mesas SET estado = 'ocupada', hora_ocupada = NOW() WHERE id_mesa = ?", [id_mesa]);
    await connection.commit();
    res.json({ success: true, id_pedido: idPedido });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// --- EDICIÓN Y DETALLES ---
app.post('/api/pedidos/:id/agregar', async (req, res) => {
  try {
    await pool.query("INSERT INTO pedido_detalle (id_pedido, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)", [req.params.id, req.body.id_producto, req.body.cantidad, req.body.subtotal]);
    await pool.query("UPDATE pedidos SET total = total + ? WHERE id_pedido = ?", [req.body.subtotal, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/pedidos/detalle/:id_detalle', async (req, res) => {
  try {
    const [[item]] = await pool.query("SELECT id_pedido, subtotal FROM pedido_detalle WHERE id_detalle = ?", [req.params.id_detalle]);
    if (item) {
      await pool.query("UPDATE pedidos SET total = total - ? WHERE id_pedido = ?", [item.subtotal, item.id_pedido]);
      await pool.query("DELETE FROM pedido_detalle WHERE id_detalle = ?", [req.params.id_detalle]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/pedidos/:id/observacion', async (req, res) => {
  try {
    await pool.query("UPDATE pedidos SET observacion = ? WHERE id_pedido = ?", [req.body.observacion, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 💳 PAGOS Y CIERRE (CHECKOUT UNIFICADO)
// ==========================================
app.put('/api/pedidos/:id/checkout', async (req, res) => {
  const { id } = req.params;
  const { metodo_pago, dni_cliente, nombre_cliente, tipo_doc } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [pedidos] = await connection.query("SELECT total, id_mesa FROM pedidos WHERE id_pedido = ?", [id]);
    if (pedidos.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    const pedido = pedidos[0];
    await connection.query("UPDATE pedidos SET dni_cliente = ?, nombre_cliente = ?, estado_pedido = 'PAGADO' WHERE id_pedido = ?", [dni_cliente, nombre_cliente, id]);
    const sqlVenta = `INSERT INTO ventas (total, metodo_pago, tipo_comprobante) VALUES (?, ?, ?)`;
    await connection.query(sqlVenta, [pedido.total, metodo_pago, tipo_doc]);
    await connection.query("UPDATE mesas SET estado = 'limpieza', hora_ocupada = NULL WHERE id_mesa = ?", [pedido.id_mesa]);
    await connection.commit();
    res.status(200).json({ success: true });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: "Error en DB", detail: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// ==========================================
// 🧠 ALGORITMO DE ASIGNACIÓN AUTOMÁTICA
// ==========================================
app.get('/api/asignar-mozo', async (req, res) => {
  try {
    const sql = `
      SELECT u.id_usuario, u.nombre, COUNT(p.id_pedido) as carga_actual
      FROM usuarios u
      LEFT JOIN pedidos p ON u.id_usuario = p.id_mozo AND p.estado_pedido != 'PAGADO'
      WHERE u.rol = 'mozo' AND u.estado = 1
      GROUP BY u.id_usuario
      HAVING carga_actual < 4
      ORDER BY carga_actual ASC, u.id_usuario ASC
      LIMIT 1`;
    const [rows] = await pool.query(sql);
    rows.length > 0 ? res.json({ success: true, mozo: rows[0] }) : res.json({ success: false, message: "Todos los mozos están full (4 mesas)" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/metrics', async (req, res) => {
  try {
    // 1. KPIs principales
    const [kpis] = await pool.query(`
      SELECT 
        IFNULL(SUM(total), 0) as ventasHoy,
        COUNT(id_pedido) as pedidos,
        IFNULL(AVG(total), 0) as ticketPromedio
      FROM pedidos 
      WHERE DATE(fecha_pedido) = CURDATE() AND estado_pedido = 'PAGADO'
    `);

    // 2. Ventas últimos 7 días
    const [ventasSemana] = await pool.query(`
      SELECT DATE(fecha_pedido) as fecha, SUM(total) as total
      FROM pedidos 
      WHERE fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND estado_pedido = 'PAGADO'
      GROUP BY DATE(fecha_pedido)
      ORDER BY fecha ASC
    `);

    // 3. Top 5 productos
    const [topProductos] = await pool.query(`
      SELECT p.nombre, SUM(pd.cantidad) as cantidad
      FROM pedido_detalle pd
      JOIN productos p ON pd.id_producto = p.id_producto
      JOIN pedidos ped ON pd.id_pedido = ped.id_pedido
      WHERE ped.estado_pedido = 'PAGADO'
      GROUP BY p.id_producto
      ORDER BY cantidad DESC
      LIMIT 5
    `);

    // 4. Rendimiento Mozos
    const [mozos] = await pool.query(`
      SELECT u.nombre, COUNT(p.id_pedido) as mesas, SUM(p.total) as total_vendido
      FROM usuarios u
      JOIN pedidos p ON u.id_usuario = p.id_mozo
      WHERE p.estado_pedido = 'PAGADO'
      GROUP BY u.id_usuario
    `);

    res.json({
      kpis: kpis[0],
      ventasSemana,
      topProductos,
      rendimientoMozos: mozos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ==========================================
// 🛡️ RUTAS EXCLUSIVAS DE ADMINISTRADOR
// ==========================================

// Actualizar precio de un producto
app.get('/api/admin/historial', async (req, res) => {
  const { fecha } = req.query;
  try {
    const [rows] = await pool.query(`
      SELECT p.id_pedido, TIME_FORMAT(p.fecha_pedido, '%H:%i') as hora, 
             p.id_mesa, p.total, u.nombre as nombre_mozo
      FROM pedidos p
      JOIN usuarios u ON p.id_mozo = u.id_usuario
      WHERE DATE(p.fecha_pedido) = ? AND p.estado_pedido = 'PAGADO'
      ORDER BY p.fecha_pedido DESC
    `, [fecha]);
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});
app.put('/api/admin/productos/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // { precio: 25, estado: 1, etc }
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
  const values = Object.values(updates);
  
  try {
    await pool.query(`UPDATE productos SET ${fields} WHERE id_producto = ?`, [...values, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/admin/productos/:id/precio', async (req, res) => {
  const { precio } = req.body;
  const { id } = req.params;
  try {
    await pool.query("UPDATE productos SET precio = ? WHERE id_producto = ?", [precio, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener lista de usuarios para el admin
app.get('/api/admin/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id_usuario, nombre, usuario, rol, estado FROM usuarios");
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});
app.delete('/api/admin/usuarios/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM usuarios WHERE id_usuario = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});
// Cambiar estado de un usuario (Activo/Inactivo)
app.put('/api/admin/usuarios/:id/estado', async (req, res) => {
  const { estado } = req.body;
  try {
    await pool.query("UPDATE usuarios SET estado = ? WHERE id_usuario = ?", [estado, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 SERVIDOR WAYRA NIKKEI ACTIVO EN PUERTO ${PORT}`));
