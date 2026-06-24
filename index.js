import express from 'express';
import cors from 'cors';

// --- IMPORTACIÓN DE RUTAS ---
import mesaRoutes from './routes/mesa.routes.js';
import authRoutes from './routes/auth.routes.js';
import reservaRoutes from './routes/reserva.routes.js';
import pedidoRoutes from './routes/pedido.routes.js';
import productoRoutes from './routes/producto.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express(); 

// Configuración de CORS y Parseo
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type, Authorization']
}));
app.use(express.json());

// --- REGISTRO DE ENDPOINTS ---
app.use('/api/mesas', mesaRoutes);
app.use('/api/reservas', reservaRoutes);

// El resto usa la raíz '/api' porque sus URLs ya vienen pre-configuradas 
app.use('/api', authRoutes);
app.use('/api', pedidoRoutes);
app.use('/api', productoRoutes);
app.use('/api', usuarioRoutes);
app.use('/api', dashboardRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 SERVIDOR WAYRA NIKKEI ACTIVO EN PUERTO ${PORT}`));