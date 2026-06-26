import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import db from '../config/db.js';

jest.spyOn(db, 'query');
jest.spyOn(db, 'getConnection');

describe('🧪 Suite de Pruebas - Módulo de Reservas', () => {
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

    afterAll(async () => {
        await db.end();
    });

    describe('GET /api/reservas', () => {
        it('Debería obtener las reservas por fecha', async () => {
            db.query.mockResolvedValueOnce([[{ id_reserva: 1, nombre_cliente: 'Juan' }]]);
            const res = await request(app).get('/api/reservas?fecha=2023-10-01');
            expect(res.statusCode).toBe(200);
            expect(res.body[0].nombre_cliente).toBe('Juan');
        });
    });

    describe('POST /api/reservas (Transaccional)', () => {
        const payloadReserva = {
            id_mesa: 2, id_usuario: 1, dni_cliente: '12345678',
            nombre_cliente: 'Pedro', fecha_reserva: '2023-10-01', hora_reserva: '20:00'
        };

        it('Debería crear la reserva, actualizar la mesa y hacer commit', async () => {
            // 1. Inserción de la reserva
            mockConnection.query.mockResolvedValueOnce([{ insertId: 50 }]);
            // 2. Update de la mesa a 'reservada'
            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            // 3. Update de la auditoría del usuario
            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app).post('/api/reservas').send(payloadReserva);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(mockConnection.commit).toHaveBeenCalled(); // Transacción exitosa
        });

        it('Debería hacer rollback si falla la actualización de la mesa', async () => {
            // 1. Inserción exitosa
            mockConnection.query.mockResolvedValueOnce([{ insertId: 50 }]);
            // 2. Falla en la actualización de la mesa
            mockConnection.query.mockRejectedValueOnce(new Error('Mesa bloqueada'));

            const res = await request(app).post('/api/reservas').send(payloadReserva);

            expect(res.statusCode).toBe(500);
            expect(mockConnection.rollback).toHaveBeenCalled(); // Prevención de inconsistencias
        });
    });

    describe('PUT /api/reservas/:id/checkin', () => {
        it('Debería confirmar la reserva (Check-In) y auditar', async () => {
            // Update reserva + Update usuario
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app).put('/api/reservas/1/checkin').send({ id_usuario: 2 });
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('PUT /api/reservas/:id/anular', () => {
        it('Debería anular la reserva', async () => {
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const res = await request(app).put('/api/reservas/1/anular');
            expect(res.statusCode).toBe(200);
        });
    });

    describe('Rutas de Consultas Menores (GETs)', () => {
        it('/ocupadas - Debería retornar las horas reservadas', async () => {
            db.query.mockResolvedValueOnce([[{ hora_reserva: '20:00:00' }]]);
            const res = await request(app).get('/api/reservas/ocupadas?id_mesa=1&fecha=2023-10-01');
            expect(res.body).toEqual(['20:00']);
        });

        it('/conteo-mensual - Debería retornar agrupciones', async () => {
            db.query.mockResolvedValueOnce([[{ fecha: '2023-10-01', cantidad: 5 }]]);
            const res = await request(app).get('/api/reservas/conteo-mensual');
            expect(res.body[0].cantidad).toBe(5);
        });

        it('/hoy - Debería retornar las reservas del mozo para hoy', async () => {
            db.query.mockResolvedValueOnce([[{ id_reserva: 1 }]]);
            const res = await request(app).get('/api/reservas/hoy?id_mozo=3');
            expect(res.body.length).toBe(1);
        });
    });
});