/**
 * SERVICIO DE MESAS
 * Este archivo centraliza la lógica de negocio y las consultas directas a la base de datos para la entidad "mesas".
 * Aquí no hay req ni res, solo funciones limpias que devuelven datos o lanzan errores.
 */
import db from '../config/db.js';

/**
 * Obtiene todas las mesas registradas.
 * @returns {Promise<Array>} Lista de mesas.
 */
export const obtenerTodasLasMesas = async () => {
    try {
        const [mesas] = await db.query('SELECT * FROM mesas');
        return mesas;
    } catch (error) {
        throw new Error(`Error en Base de Datos al obtener mesas: ${error.message}`);
    }
};

/**
 * Libera una mesa (cambia su estado a 'disponible' y limpia la hora_ocupada).
 * @param {string|number} idMesa - ID de la mesa a liberar.
 * @returns {Promise<Object>} Resultado de la operación.
 */
export const liberarMesa = async (idMesa) => {
    try {
        const [resultado] = await db.query(
            "UPDATE mesas SET estado = 'disponible', hora_ocupada = NULL WHERE id_mesa = ?", 
            [idMesa]
        );
        
        if (resultado.affectedRows === 0) {
             throw new Error('La mesa no existe o no pudo ser liberada.');
        }

        return { success: true, mensaje: 'Mesa liberada correctamente' };
    } catch (error) {
        throw new Error(`Error en Base de Datos al liberar mesa: ${error.message}`);
    }
};

/**
 * Asigna una mesa a un mozo, verificando previamente la regla de negocio del límite de mesas.
 * @param {string|number} idMesa - ID de la mesa.
 * @param {string|number} idMozo - ID del mozo.
 * @returns {Promise<Object>} Resultado de la asignación.
 */
export const asignarMozoAMesa = async (idMesa, idMozo) => {
    try {
        // Regla de Negocio: Verificar si el mozo ya tiene 4 mesas asignadas (esto lo traemos de tu código anterior)
        const [asignadas] = await db.query(
            'SELECT COUNT(*) as total FROM mesas WHERE id_mozo_asignado = ? AND estado = "ocupada"', 
            [idMozo]
        );

        if (asignadas[0].total >= 4) {
            // Lanzamos un error específico para que el controlador sepa que es una regla de negocio y no un fallo de DB
            const errorLimite = new Error('El mozo ya tiene el límite de 4 mesas');
            errorLimite.code = 'LIMITE_MESAS_ALCANZADO';
            throw errorLimite;
        }

        // Si pasa la validación, asignamos la mesa
        const [resultado] = await db.query(
            'UPDATE mesas SET id_mozo_asignado = ?, estado = "ocupada" WHERE id_mesa = ?',
            [idMozo, idMesa]
        );

         if (resultado.affectedRows === 0) {
             throw new Error('La mesa no existe o no pudo ser asignada.');
        }

        return { success: true, mensaje: 'Mesa asignada con éxito' };
    } catch (error) {
         // Si el error ya trae un código (como el LIMITE_MESAS), lo pasamos tal cual; si no, es un error de DB.
        if (error.code) throw error; 
        throw new Error(`Error en Base de Datos al asignar mesa: ${error.message}`);
    }
};