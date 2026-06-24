/**
 * CONTROLADOR DE RESERVAS
 * Gestiona el Request/Response (Req/Res) aislando el SQL en el servicio.
 */
import * as reservaService from '../services/reservaService.js';

export const actualizarReserva = async (req, res) => {
    try {
        const resultado = await reservaService.actualizarReserva(req.params.id, req.body);
        res.json(resultado);
    } catch (error) { res.status(500).json({ error: "Error al actualizar reserva", detail: error.message }); }
};

export const obtenerReservas = async (req, res) => {
    try {
        const reservas = await reservaService.obtenerReservasPorFecha(req.query.fecha);
        res.json(reservas);
    } catch (error) { res.status(500).json({ error: "Error al obtener reservas", detail: error.message }); }
};

export const crearReserva = async (req, res) => {
    try {
        const resultado = await reservaService.crearReserva(req.body);
        res.json(resultado);
    } catch (error) {
        console.error("❌ Error en Transacción de Reserva:", error);
        res.status(500).json({ error: "Error al insertar reserva transaccional", detail: error.message });
    }
};

export const obtenerHorasOcupadas = async (req, res) => {
    try {
        const horas = await reservaService.obtenerHorasOcupadas(req.query.id_mesa, req.query.fecha);
        res.json(horas);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

export const obtenerConteoMensual = async (req, res) => {
    try {
        const conteo = await reservaService.obtenerConteoMensual();
        res.json(conteo);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

export const checkInReserva = async (req, res) => {
    try {
        const resultado = await reservaService.procesarCheckIn(req.params.id, req.body.id_usuario);
        res.json(resultado);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

export const anularReserva = async (req, res) => {
    try {
        const resultado = await reservaService.anularReserva(req.params.id);
        res.json(resultado);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

export const reservasMozoHoy = async (req, res) => {
    try {
        const reservas = await reservaService.obtenerReservasMozoHoy(req.query.id_mozo);
        res.json(reservas);
    } catch (error) { res.json([]); }
};