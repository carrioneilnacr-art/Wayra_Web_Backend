import * as dashboardService from '../services/dashboardService.js';

export const getMetrics = async (req, res) => {
    try { res.json(await dashboardService.obtenerMetricas()); } 
    catch (err) { res.status(500).json({ error: err.message }); }
};

export const getHistorial = async (req, res) => {
    try { res.json(await dashboardService.obtenerHistorialVentas(req.query.fecha)); } 
    catch (err) { res.status(500).json(err); }
};