import * as usuarioService from '../services/usuarioService.js';

export const getMozoDisponible = async (req, res) => {
    try { res.json(await usuarioService.obtenerMozoDisponible()); } 
    catch (err) { res.status(500).json({ error: err.message }); }
};

export const getListaMozos = async (req, res) => {
    try { res.json(await usuarioService.obtenerListaMozos()); } 
    catch (err) { res.status(500).json(err); }
};

export const getStaff = async (req, res) => {
    try { res.json(await usuarioService.obtenerStaffReactivo()); } 
    catch (err) { res.status(500).json({ error: "Fallo de sincronización", detail: err.message }); }
};

export const crearUsuario = async (req, res) => {
    try { res.json(await usuarioService.crearUsuario(req.body)); } 
    catch (err) { res.status(500).json({ error: err.message }); }
};

export const actualizarUsuario = async (req, res) => {
    try { res.json(await usuarioService.actualizarUsuario(req.params.id, req.body)); } 
    catch (err) { res.status(500).json({ error: err.message }); }
};

export const eliminarUsuario = async (req, res) => {
    try { res.json(await usuarioService.eliminarUsuario(req.params.id)); } 
    catch (err) { res.status(500).json(err); }
};

export const cambiarEstado = async (req, res) => {
    try { res.json(await usuarioService.cambiarEstadoUsuario(req.params.id, req.body.estado)); } 
    catch (err) { res.status(500).json(err); }
};