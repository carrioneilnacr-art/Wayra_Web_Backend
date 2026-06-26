import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import db from '../config/db.js';

jest.spyOn(db, 'query');

describe('🧪 Suite de Pruebas - Módulo de Productos', () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.end();
    });

    // 1. Cobertura para obtenerActivos (Líneas 4-7 del Service / 4-5 del Controller)
    describe('GET /api/productos', () => {
        it('Debería retornar los productos activos (Status 200)', async () => {
            db.query.mockResolvedValueOnce([[{ id_producto: 1, nombre: 'Maki', estado: 1 }]]);

            const res = await request(app).get('/api/productos');
            expect(res.statusCode).toBe(200);
            expect(res.body[0].nombre).toBe('Maki');
        });

        it('Debería manejar error en BD retornando array vacío', async () => {
            db.query.mockRejectedValueOnce(new Error('Caída de DB'));

            const res = await request(app).get('/api/productos');
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    // 2. Cobertura para obtenerTodos (Líneas 11-14 del Service / 9-12 del Controller)
    describe('GET /api/admin/productos/todos', () => {
        it('Debería retornar todos los productos (Status 200)', async () => {
            db.query.mockResolvedValueOnce([[{ id_producto: 1, nombre: 'Ramen' }]]);

            const res = await request(app).get('/api/admin/productos/todos');
            expect(res.statusCode).toBe(200);
            expect(res.body[0].nombre).toBe('Ramen');
        });

        it('Debería atrapar el error 500 si la base de datos falla', async () => {
            db.query.mockRejectedValueOnce(new Error('Error interno DB'));

            const res = await request(app).get('/api/admin/productos/todos');
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Error DB: Error interno DB');
        });
    });

    // 3. Cobertura para crearProducto (Líneas 18-22 del Service / 16-19 del Controller)
    describe('POST /api/admin/productos', () => {
        it('Debería crear un producto con éxito (Status 200)', async () => {
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .post('/api/admin/productos')
                .send({ nombre: 'Gyozas', precio: 15, categoria: 'Entrada', tiempo_estimado: 10 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('Debería atrapar el error 500 al fallar la creación', async () => {
            db.query.mockRejectedValueOnce(new Error('Datos inválidos'));

            const res = await request(app).post('/api/admin/productos').send({});
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Error al crear producto');
        });
    });

    // 4. Cobertura para actualizarProducto (Líneas 26-31 del Service / 23-26 del Controller)
    describe('PUT /api/admin/productos/:id', () => {
        it('Debería actualizar los campos dinámicos correctamente (Status 200)', async () => {
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .put('/api/admin/productos/1')
                .send({ precio: 20, estado: 0 }); 

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('Debería atrapar el error 500 al fallar la actualización', async () => {
            db.query.mockRejectedValueOnce(new Error('Producto no encontrado'));

            const res = await request(app).put('/api/admin/productos/99').send({ precio: 10 });
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Error DB: Producto no encontrado');
        });
    });
});