import { jest } from '@jest/globals';

describe('Servidor Principal (index.js)', () => {
    it('Debería iniciar el servidor cuando NODE_ENV no es test', async () => {
        // Guardar valores originales
        const originalEnv = process.env.NODE_ENV;
        const originalPort = process.env.PORT;

        // Forzar entorno de producción y puerto seguro
        process.env.NODE_ENV = 'production';
        process.env.PORT = 8888;

        // Importación dinámica con timestamp para evadir caché de módulos
        const module = await import(`../index.js?update=${Date.now()}`);

        // El servidor debió haberse iniciado y retornado
        expect(module.server).toBeDefined();

        // Cerrar el servidor para que Jest no se quede colgado
        if (module.server) {
            module.server.close();
        }

        // Restaurar entorno original
        process.env.NODE_ENV = originalEnv;
        process.env.PORT = originalPort;
    });
});
