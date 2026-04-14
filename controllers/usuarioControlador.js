const db = require('../config/db');

exports.login = (req, res) => {
  const { user, pass } = req.body;
  
  // Usamos tus columnas exactas de MySQL
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