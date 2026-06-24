import * as productoService from '../services/productoService.js';

export const getProductosMozo = async (req, res) => {
    const productos = await productoService.obtenerActivos();
    res.json(productos);
};

export const getProductosAdmin = async (req, res) => {
    try {
        const productos = await productoService.obtenerTodos();
        res.json(productos);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

export const crearProducto = async (req, res) => {
    try {
        const resultado = await productoService.crearProducto(req.body);
        res.json(resultado);
    } catch (error) { res.status(500).json({ error: "Error al crear producto", detail: error.message }); }
};

export const actualizarProducto = async (req, res) => {
    try {
        const resultado = await productoService.actualizarProducto(req.params.id, req.body);
        res.json(resultado);
    } catch (error) { res.status(500).json({ error: error.message }); }
};