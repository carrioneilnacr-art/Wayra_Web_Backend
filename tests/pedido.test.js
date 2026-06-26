import { jest } from '@jest/globals'; // <-- SOLUCIÓN 1: Importamos jest explícitamente para ESM
import request from 'supertest';
import app from '../index.js';
import db from '../config/db.js';

jest.spyOn(db, 'query');
jest.spyOn(db, 'getConnection');

describe('🧪 Suite de Pruebas - Módulo de Pedidos', () => {
    let mockConnection;

    beforeEach(() => {
        mockConnection = {
            beginTransaction: jest.fn(),
            query: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn()
        };
        db.getConnection.mockResolvedValue(mockConnection);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // SOLUCIÓN 2: Matamos la conexión real a Railway al terminar para que Node no se quede colgado
    afterAll(async () => {
        await db.end();
    });

    describe('GET /api/pedidos/hoy', () => {
        it('Debería retornar status 200 y la lista de pedidos del día', async () => {
            db.query.mockResolvedValueOnce([[{ id_pedido: 1, total: 100, items: '[{"nombre": "Maki Furai"}]' }]]);

            const res = await request(app).get('/api/pedidos/hoy');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body[0].id_pedido).toBe(1);
            expect(res.body[0].items[0].nombre).toBe("Maki Furai");
        });

        it('Debería manejar errores de base de datos devolviendo un array vacío (Status 500)', async () => {
            db.query.mockRejectedValueOnce(new Error('Conexión perdida'));

            const res = await request(app).get('/api/pedidos/hoy');

            expect(res.statusCode).toBe(500);
            expect(res.body).toEqual([]);
        });
    });

    describe('POST /api/pedidos', () => {
        const payloadNuevoPedido = {
            id_mesa: 5,
            id_mozo: 2,
            total: 45.50,
            items: [{ id_producto: 1, cantidad: 2, subtotal: 45.50 }]
        };

        it('Debería crear un pedido exitosamente (Status 200)', async () => {
            mockConnection.query.mockResolvedValueOnce([[{ cant: 1 }]]); 
            mockConnection.query.mockResolvedValueOnce([{ insertId: 99 }]);
            
            const res = await request(app)
                .post('/api/pedidos')
                .send(payloadNuevoPedido);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.id_pedido).toBe(99);
            expect(mockConnection.commit).toHaveBeenCalled();
        });

        it('Debería bloquear la creación si el mozo excede el límite de mesas (Status 403)', async () => {
            mockConnection.query.mockResolvedValueOnce([[{ cant: 4 }]]);

            const res = await request(app)
                .post('/api/pedidos')
                .send(payloadNuevoPedido);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe("Límite de 4 mesas alcanzado por este mozo.");
            expect(mockConnection.rollback).toHaveBeenCalled();
        });

        it('Debería rechazar un pedido sin items (Status 400)', async () => {
            const res = await request(app)
                .post('/api/pedidos')
                .send({ ...payloadNuevoPedido, items: [] });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe("El pedido está vacío");
        });
    });

    describe('PUT /api/pedidos/:id/checkout', () => {
        it('Debería procesar el pago correctamente y liberar la mesa (Status 200)', async () => {
            mockConnection.query.mockResolvedValueOnce([[{ total: 100, id_mesa: 2, id_mozo: 1 }]]);
            mockConnection.query.mockResolvedValueOnce([[]]);
            
            const res = await request(app)
                .put('/api/pedidos/1/checkout')
                .send({ metodo_pago: 'EFECTIVO', tipo_doc: 'BOLETA' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(mockConnection.commit).toHaveBeenCalled();
        }); 
    });
    describe('Rutas Secundarias de Pedidos (Items y Boleta)', () => {
        it('POST /api/pedidos/:id/agregar - Debería agregar un item', async () => {
            db.query.mockResolvedValue([{ affectedRows: 1 }]);
            const res = await request(app).post('/api/pedidos/1/agregar').send({ id_producto: 1, cantidad: 1, subtotal: 10 });
            expect(res.statusCode).toBe(200);
        });

        it('DELETE /api/pedidos/detalle/:id_detalle - Debería eliminar un item', async () => {
            // Simulamos el select previo y luego los updates/deletes
            db.query.mockResolvedValueOnce([[{ id_pedido: 1, subtotal: 15 }]]); 
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); 
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); 

            const res = await request(app).delete('/api/pedidos/detalle/1');
            expect(res.statusCode).toBe(200);
        });

        it('PUT /api/pedidos/:id/observacion - Debería actualizar observación', async () => {
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const res = await request(app).put('/api/pedidos/1/observacion').send({ observacion: 'Sin cebolla' });
            expect(res.statusCode).toBe(200);
        });

        it('GET /api/admin/boleta/:id_pedido - Debería generar la boleta (Status 200)', async () => {
            // Simulamos las 3 consultas de la boleta: pedido, items y venta
            db.query.mockResolvedValueOnce([[{ id_pedido: 1, total: 50, estado_pedido: 'PAGADO' }]]);
            db.query.mockResolvedValueOnce([[{ cantidad: 2, subtotal: 50, producto: 'Maki' }]]);
            db.query.mockResolvedValueOnce([[{ metodo_pago: 'TARJETA', tipo_comprobante: 'BOLETA' }]]);

            const res = await request(app).get('/api/admin/boleta/1');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pedido.id_pedido).toBe(1);
        });

        it('GET /api/admin/boleta/:id_pedido - Debería devolver 404 si no existe', async () => {
            db.query.mockResolvedValueOnce([[]]); // DB no encuentra el pedido

            const res = await request(app).get('/api/admin/boleta/999');
            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Comprobante no encontrado');
        });
    });
});