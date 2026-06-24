import db from '../config/db.js';

export const obtenerActivos = async () => {
    try {
        const [results] = await db.query("SELECT id_producto, nombre, precio, categoria, tiempo_estimado, estado FROM productos WHERE estado = 1");
        return results;
    } catch (error) { return []; }
};

export const obtenerTodos = async () => {
    try {
        const [results] = await db.query("SELECT id_producto, nombre, precio, categoria, tiempo_estimado, estado FROM productos");
        return results;
    } catch (error) { throw new Error(`Error DB: ${error.message}`); }
};

export const crearProducto = async (datos) => {
    try {
        await db.query("INSERT INTO productos (nombre, precio, categoria, tiempo_estimado, estado) VALUES (?, ?, ?, ?, 1)", 
            [datos.nombre, datos.precio, datos.categoria, datos.tiempo_estimado]);
        return { success: true };
    } catch (error) { throw new Error(`Error DB: ${error.message}`); }
};

export const actualizarProducto = async (id, updates) => {
    try {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        await db.query(`UPDATE productos SET ${fields} WHERE id_producto = ?`, [...values, id]);
        return { success: true };
    } catch (error) { throw new Error(`Error DB: ${error.message}`); }
};