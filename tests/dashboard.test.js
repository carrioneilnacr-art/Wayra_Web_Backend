import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import db from '../config/db.js';

// Interceptamos las consultas a la base de datos
jest.spyOn(db, 'query');

describe('🧪 Suite de Pruebas - Dashboard Analytics', () => {

    afterEach(() => {
        jest.clearAllMocks(); // Limpiamos memoria tras cada test
    });

    afterAll(async () => {
        await db.end(); // Cerramos el pool para evitar Open Handles
    });

    describe('GET /api/admin/metrics', () => {

        it('Debería retornar las métricas completas con insight de alta demanda (Status 200)', async () => {
            // MAGIA SENIOR: Simulamos las 5 consultas en orden exacto

            // 1. kpis (Ventas > 300 para no detonar la alerta)
            db.query.mockResolvedValueOnce([[{ ventasHoy: 500, pedidos: 15, ticketPromedio: 33.33 }]]);
            // 2. historico
            db.query.mockResolvedValueOnce([[{ total: 1000 }]]);
            // 3. ventasSemana
            db.query.mockResolvedValueOnce([[{ fecha: '2023-10-01', total: 500 }]]);
            // 4. topProductos (Forzamos que 3 productos superen el 50% para activar el insight)
            db.query.mockResolvedValueOnce([[
                { nombre: 'Maki Acevichado', cantidad: 60 },
                { nombre: 'Ramen', cantidad: 30 },
                { nombre: 'Gyozas', cantidad: 10 }
            ]]);
            // 5. mozos
            db.query.mockResolvedValueOnce([[{ nombre: 'Carlos', mesas: 5, total_vendido: 200 }]]);

            const res = await request(app).get('/api/admin/metrics');

            expect(res.statusCode).toBe(200);
            expect(res.body.kpis.ventasHoy).toBe(500);
            expect(res.body.kpis.totalPedidosHistoricos).toBe(1000);
            // Validamos que se activó tu regla de negocio de inventario
            expect(res.body.notificaciones.insight).toContain("Patrón de consumo detectado");
            expect(res.body.notificaciones.alerta).toContain("Flujo del salón estable");
        });

        it('Debería detonar la alerta operativa si las ventas son menores a 300 (Status 200)', async () => {
            // 1. kpis (Ventas en 150 para detonar alerta)
            db.query.mockResolvedValueOnce([[{ ventasHoy: 150, pedidos: 5, ticketPromedio: 30 }]]);
            // 2. historico
            db.query.mockResolvedValueOnce([[{ total: 1000 }]]);
            // 3. ventasSemana
            db.query.mockResolvedValueOnce([[]]);
            // 4. topProductos (Menos de 3 para no activar el insight)
            db.query.mockResolvedValueOnce([[{ nombre: 'Inca Kola', cantidad: 5 }]]);
            // 5. mozos
            db.query.mockResolvedValueOnce([[]]);

            const res = await request(app).get('/api/admin/metrics');

            expect(res.statusCode).toBe(200);
            // Validamos que se disparó la alarma financiera
            expect(res.body.notificaciones.alerta).toContain("Alerta operativa");
            expect(res.body.notificaciones.insight).toBeNull();
        });

        it('Debería devolver error 500 si la base de datos de métricas falla', async () => {
            db.query.mockRejectedValueOnce(new Error('Fallo en DB Analytics'));

            const res = await request(app).get('/api/admin/metrics');

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Fallo en DB Analytics');
        });
    });

    describe('GET /api/admin/historial', () => {

        it('Debería retornar el historial de ventas por fecha (Status 200)', async () => {
            db.query.mockResolvedValueOnce([[{ id_pedido: 1, hora: '14:30', id_mesa: 2, total: 150, nombre_mozo: 'Carlos' }]]);

            const res = await request(app).get('/api/admin/historial?fecha=2023-10-15');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body[0].total).toBe(150);
        });

        it('Debería manejar errores de DB en el historial (Status 500)', async () => {
            db.query.mockRejectedValueOnce(new Error('Fallo al leer historial'));

            const res = await request(app).get('/api/admin/historial?fecha=2023-10-15');

            expect(res.statusCode).toBe(500);
        });
    });
});