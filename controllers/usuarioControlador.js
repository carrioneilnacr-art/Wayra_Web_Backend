const db = require('../config/db');

// 1. LOGIN (El que ya tenías)
exports.login = (req, res) => {
  const { user, pass } = req.body;
  const sql = 'SELECT id_usuario, nombre, rol FROM usuarios WHERE usuario = ? AND password = ? AND estado = 1';

  db.query(sql, [user, pass], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Error en servidor" });
    if (result.length > 0) {
      res.json({ success: true, usuario: result[0] });
    } else {
      res.status(401).json({ success: false, message: "Usuario o clave incorrecta" });
    }
  });
};

// 2. OBTENER TODOS LOS USUARIOS
exports.obtenerUsuarios = (req, res) => {
  const sql = 'SELECT id_usuario, nombre, usuario, rol, estado FROM usuarios';
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json(result);
  });
};

// 3. CREAR USUARIO
exports.crearUsuario = (req, res) => {
  const { nombre, usuario, password, rol } = req.body;
  const sql = 'INSERT INTO usuarios (nombre, usuario, password, rol, estado) VALUES (?, ?, ?, ?, 1)';
  db.query(sql, [nombre, usuario, password, rol], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, id: result.insertId });
  });
};

// 4. ACTUALIZAR USUARIO
exports.actualizarUsuario = (req, res) => {
  const { id } = req.params;
  const { nombre, usuario, rol } = req.body;
  const sql = 'UPDATE usuarios SET nombre = ?, usuario = ?, rol = ? WHERE id_usuario = ?';
  db.query(sql, [nombre, usuario, rol, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
};

// 5. ELIMINAR USUARIO
exports.eliminarUsuario = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM usuarios WHERE id_usuario = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
};
