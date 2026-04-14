import db from '../config/db.js';

export const obtenerMesas = async (req, res) => {
  try {
    // Traemos las 18 mesas con su piso y zona
    const [rows] = await db.query('SELECT * FROM mesas');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al leer las mesas" });
  }
};

export const asignarMesaAMozo = async (req, res) => {
  const { id_mesa, id_mozo } = req.body;

  try {
    // REGLA DE INGENIERÍA: Verificar si el mozo ya tiene 4 mesas [Regla de Negocio]
    const [asignadas] = await db.query(
      'SELECT COUNT(*) as total FROM mesas WHERE id_mozo_asignado = ? AND estado = "ocupada"', 
      [id_mozo]
    );

    if (asignadas[0].total >= 4) {
      return res.status(400).json({ mensaje: "El mozo ya tiene el límite de 4 mesas" });
    }

    // Si tiene menos de 4, asignamos y cambiamos estado a 'ocupada'
    await db.query(
      'UPDATE mesas SET id_mozo_asignado = ?, estado = "ocupada" WHERE id_mesa = ?',
      [id_mozo, id_mesa]
    );

    res.json({ mensaje: "Mesa asignada con éxito" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en la asignación" });
  }
};