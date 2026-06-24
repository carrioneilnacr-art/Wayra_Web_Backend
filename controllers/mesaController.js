/**
 * CONTROLADOR DE MESAS
 * Gestiona el ciclo de vida Request/Response. No ejecuta consultas SQL.
 */
import * as mesaService from '../services/mesaService.js';

// ==========================================
// 1. OBTENER TODAS LAS MESAS
// ==========================================
export const obtenerMesas = async (req, res) => {
    try {
        const mesas = await mesaService.obtenerTodasLasMesas();
        res.json(mesas);
    } catch (error) {
        console.error("❌ ERROR EN CONTROLADOR DE MESAS:", error);
        res.status(500).json({ error: "Error al obtener mesas", detalle: error.message });
    }
};

// ==========================================
// 2. LIBERAR MESA
// ==========================================
export const liberarMesa = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await mesaService.liberarMesa(id);
        res.json(resultado);
    } catch (error) {
        console.error("❌ ERROR AL LIBERAR MESA:", error);
        res.status(500).json({ error: "Error al liberar mesa", detail: error.message });
    }
};

// ==========================================
// 3. ASIGNAR MOZO A MESA (Ocupar Mesa)
// ==========================================
export const asignarMozo = async (req, res) => {
    try {
        const { id_mesa, id_mozo } = req.body;
        
        if (!id_mesa || !id_mozo) {
             return res.status(400).json({ error: "Faltan datos obligatorios (id_mesa, id_mozo)" });
        }

        const resultado = await mesaService.asignarMozoAMesa(id_mesa, id_mozo);
        res.json(resultado);
        
    } catch (error) {
        console.error("❌ ERROR AL ASIGNAR MESA:", error);
        
        // Manejamos el error específico de la regla de negocio que creamos en el servicio
        if (error.code === 'LIMITE_MESAS_ALCANZADO') {
            return res.status(403).json({ error: error.message });
        }
        
        res.status(500).json({ error: "Error en la asignación", detail: error.message });
    }
};