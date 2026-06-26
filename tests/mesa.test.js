import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import db from '../config/db.js';

jest.spyOn(db, 'query');

describe('🧪 Suite de Pruebas - Módulo de Mesas', () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.end();
    });

    describe('GET /api/mesas', () => {
        it('Debería obtener todas las mesas (Status 200)', async () => {
            db.query.mockResolvedValueOnce([[{ id_mesa: 1, estado: 'disponible' }]]);
            
            const res = await request(app).get('/api/mesas');
            expect(res.statusCode).toBe(200);
            expect(res.body[0].id_mesa).toBe(1);
        });

        it('Debería retornar 500 si la DB falla', async () => {
            db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));
            const res = await request(app).get('/api/mesas');
            expect(res.statusCode).toBe(500);
        });
    });

    // Nota: Asumimos que la ruta en mesa.routes.js es PUT /api/mesas/:id/liberar
    describe('PUT /api/mesas/:id/liberar', () => {
        it('Debería liberar una mesa correctamente', async () => {
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            
            const res = await request(app).put('/api/mesas/1/liberar');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('Debería lanzar error 500 si la mesa no existe', async () => {
            db.query.mockResolvedValueOnce([{ affectedRows: 0 }]); // Simula que no encontró la mesa
            
            const res = await request(app).put('/api/mesas/999/liberar');
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Error al liberar mesa');
        });
    });

    // Nota: Asumimos que la ruta es POST /api/mesas/asignar o PUT /api/mesas/asignar
    describe('POST /api/mesas/asignar', () => {
        it('Debería asignar un mozo a una mesa', async () => {
            db.query.mockResolvedValueOnce([[{ total: 2 }]]); // Tiene 2 mesas, pasa validación
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update exitoso
            
            const res = await request(app)
                .post('/api/mesas/asignar') // Cambia a .put si tu ruta es PUT
                .send({ id_mesa: 3, id_mozo: 1 });
                
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('Debería rechazar por límite de mesas (Status 403)', async () => {
            db.query.mockResolvedValueOnce([[{ total: 4 }]]); // Ya tiene 4 mesas
            
            const res = await request(app)
                .post('/api/mesas/asignar')
                .send({ id_mesa: 3, id_mozo: 1 });
                
            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('El mozo ya tiene el límite de 4 mesas');
        });

        it('Debería retornar 400 si faltan datos en el body', async () => {
            const res = await request(app)
                .post('/api/mesas/asignar')
                .send({ id_mesa: 3 }); // Falta id_mozo
                
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('Faltan datos obligatorios');
        });
    });
});