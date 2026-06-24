/**
 * CONTROLADOR DE PEDIDOS
 */
import * as pedidoService from '../services/pedidoService.js';

export const estatusMozo = async (req, res) => {
    try {
        const pedidos = await pedidoService.obtenerEstatusMozo(req.query.id_mozo);
        res.json(pedidos);
    } catch (error) { res.status(500).json([]); }
};

export const pedidosHoy = async (req, res) => {
    try {
        const pedidos = await pedidoService.obtenerPedidosHoy();
        res.json(pedidos);
    } catch (error) { res.status(500).json([]); }
};

export const crearPedido = async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || items.length === 0) return res.status(400).json({ error: "El pedido está vacío" });

        const resultado = await pedidoService.crearPedido(req.body);
        res.json(resultado);
    } catch (error) {
        console.error("❌ ERROR TRANSACCIÓN PEDIDO:", error);
        if (error.code === 'LIMITE_MESAS') return res.status(403).json({ error: error.message });
        res.status(500).json({ error: "Error en base de datos", detail: error.message });
    }
};

export const agregarItem = async (req, res) => {
    try {
        const resultado = await pedidoService.agregarItemAPedido(req.params.id, req.body);
        res.json(resultado);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

export const eliminarItem = async (req, res) => {
    try {
        const resultado = await pedidoService.eliminarItemDePedido(req.params.id_detalle);
        res.json(resultado);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

export const cambiarObservacion = async (req, res) => {
    try {
        const resultado = await pedidoService.actualizarObservacion(req.params.id, req.body.observacion);
        res.json(resultado);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

export const checkout = async (req, res) => {
    try {
        const resultado = await pedidoService.procesarCheckout(req.params.id, req.body);
        res.json(resultado);
    } catch (error) {
        console.error("❌ ERROR CHECKOUT:", error);
        res.status(500).json({ error: "No se pudo procesar el pago", detail: error.message });
    }
};

export const verBoleta = async (req, res) => {
    try {
        const boleta = await pedidoService.obtenerBoleta(req.params.id_pedido);
        res.json(boleta);
    } catch (error) {
        if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
        res.status(500).json({ error: "Error interno", detail: error.message });
    }
};