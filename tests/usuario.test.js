import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import db from '../config/db.js';

jest.spyOn(db, 'query');

describe('🧪 Suite de Pruebas - Módulo de Usuarios', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.end();
    });

    describe('GET /api/admin/usuarios (Staff Reactivo)', () => {
        it('Debería devolver la lista de staff con sus métricas calculadas (Status 200)', async () => {
            // 1. Usuarios en DB
            db.query.mockResolvedValueOnce([[
                { id_usuario: 1, nombre: 'Mozo Uno', rol: 'mozo' },
                { id_usuario: 2, nombre: 'Recepcionista', rol: 'recepcionista' }
            ]]);
            // 2. Pedidos activos (Mozo 1 tiene 2 mesas)
            db.query.mockResolvedValueOnce([[{ id_mozo: 1 }, { id_mozo: 1 }]]);
            // 3. Reservas activas (Recepcionista 2 hizo 1 check-in)
            db.query.mockResolvedValueOnce([[{ id_recepcionista: 2 }]]);

            const res = await request(app).get('/api/admin/usuarios');

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
            // Validamos que el cruce de datos funcionó
            expect(res.body[0].mesas_assigned).toBe(2);
            expect(res.body[1].checkins_hoy).toBe(1);
        });

        it('Debería manejar error 500 al listar', async () => {
            db.query.mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app).get('/api/admin/usuarios');
            expect(res.statusCode).toBe(500);
        });
    });

    describe('GET /api/asignar-mozo', () => {
        it('Debería devolver un mozo disponible', async () => {
            db.query.mockResolvedValueOnce([[{ id_usuario: 3, nombre: 'Mozo Libre' }]]);

            const res = await request(app).get('/api/asignar-mozo');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.mozo.nombre).toBe('Mozo Libre');
        });

        it('Debería avisar si no hay mozos disponibles', async () => {
            db.query.mockResolvedValueOnce([[]]); // DB vacía

            const res = await request(app).get('/api/asignar-mozo');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('No hay mozos disponibles');
        });

        it('Debería manejar error 500 al asignar mozo', async () => {
            db.query.mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app).get('/api/asignar-mozo');
            expect(res.statusCode).toBe(500);
        });
    });

    describe('POST & PUT /api/admin/usuarios', () => {
        it('Debería crear un usuario nuevo', async () => {
            db.query.mockResolvedValueOnce([{ insertId: 5 }]);

            const res = await request(app)
                .post('/api/admin/usuarios')
                .send({ nombre: 'Nuevo', usuario: 'nuevo', password: '123', rol: 'admin' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('Debería actualizar un usuario con cambio de contraseña', async () => {
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .put('/api/admin/usuarios/1')
                .send({ nombre: 'Update', usuario: 'upd', rol: 'mozo', password: 'new' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('Debería eliminar un usuario', async () => {
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app).delete('/api/admin/usuarios/1');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('Debería manejar error 500 al crear usuario sin datos', async () => {
            const res = await request(app).post('/api/admin/usuarios').send({});
            expect(res.statusCode).toBe(500);
        });

        it('Debería manejar error 500 en crear usuario', async () => {
            db.query.mockRejectedValueOnce(new Error('DB error'));
            const res = await request(app).post('/api/admin/usuarios').send({ nombre: 'Nuevo', usuario: 'nuevo', password: '123', rol: 'admin' });
            expect(res.statusCode).toBe(500);
        });

        it('Debería manejar error 500 en actualizar usuario', async () => {
            db.query.mockRejectedValueOnce(new Error('DB error'));
            const res = await request(app).put('/api/admin/usuarios/1').send({ nombre: 'Upd', usuario: 'upd', rol: 'mozo' });
            expect(res.statusCode).toBe(500);
        });

        it('Debería manejar error 500 en eliminar usuario', async () => {
            db.query.mockRejectedValueOnce(new Error('DB error'));
            const res = await request(app).delete('/api/admin/usuarios/1');
            expect(res.statusCode).toBe(500);
        });
    });
});