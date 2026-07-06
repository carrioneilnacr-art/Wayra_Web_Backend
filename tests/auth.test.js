import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import db from '../config/db.js';

jest.spyOn(db, 'query');

describe('🧪 Suite de Pruebas - Módulo de Autenticación', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.end(); // Cerramos conexión
    });

    describe('POST /api/login', () => {
        it('Debería iniciar sesión correctamente (Status 200)', async () => {
            // Simulamos las 3 consultas del loginUsuario en orden:
            // 1. Encuentra al usuario
            db.query.mockResolvedValueOnce([[{ id_usuario: 1, nombre: 'Admin', rol: 'admin' }]]);
            // 2. Actualiza estado_sesion
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            // 3. Inserta en historial_sesiones
            db.query.mockResolvedValueOnce([{ insertId: 10 }]);

            const res = await request(app)
                .post('/api/login')
                .send({ user: 'admin', pass: '123456' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.usuario.nombre).toBe('Admin');
        });

        it('Debería rechazar login con credenciales incorrectas (Status 401)', async () => {
            // 1. No encuentra a nadie en la DB
            db.query.mockResolvedValueOnce([[]]);

            const res = await request(app)
                .post('/api/login')
                .send({ user: 'admin', pass: 'clave_mala' });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Usuario o clave incorrecta');
        });

        it('Debería rechazar la petición si faltan datos (Status 400)', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ user: 'admin' }); // Falta la contraseña

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Faltan credenciales');
        });

        it('Debería manejar error interno de la DB en login (Status 500)', async () => {
            db.query.mockRejectedValueOnce(new Error('DB Error'));

            const res = await request(app)
                .post('/api/login')
                .send({ user: 'admin', pass: '123456' });

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Error en Login');
        });
    });

    describe('POST /api/logout', () => {
        it('Debería cerrar sesión correctamente (Status 200)', async () => {
            // Simulamos los dos updates de DB del logout
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update estado
            db.query.mockResolvedValueOnce([{ insertId: 11 }]);    // Insert historial

            const res = await request(app)
                .post('/api/logout')
                .send({ id_usuario: 1 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('Debería dar error si no se envía el ID (Status 400)', async () => {
            const res = await request(app).post('/api/logout').send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Falta ID de usuario');
        });

        it('Debería manejar error interno de la DB en logout (Status 500)', async () => {
            db.query.mockRejectedValueOnce(new Error('DB Error'));

            const res = await request(app)
                .post('/api/logout')
                .send({ id_usuario: 1 });

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Error en Logout');
        });
    });
});