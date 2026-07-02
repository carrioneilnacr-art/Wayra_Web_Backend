import express from 'express';
import cors from 'cors';

// --- IMPORTACIÓN DE RUTAS (Intactas al 100%) ---
import mesaRoutes from './routes/mesa.routes.js';
import authRoutes from './routes/auth.routes.js';
import reservaRoutes from './routes/reserva.routes.js';
import pedidoRoutes from './routes/pedido.routes.js';
import productoRoutes from './routes/producto.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// --- 1. PARCHE DE SEGURIDAD: Ocultar identidad del servidor ---
app.disable('x-powered-by');

// --- 2. PARCHE DE SEGURIDAD: Lista blanca estricta para CORS ---
const origenesPermitidos = [
  'http://localhost:5173',                  // Frontend local en Vite
  'http://localhost:3000',                  // Pruebas locales
  'https://wayra-web-fronted.vercel.app'         // <-- pon aquí tu link exacto de Vercel
];

app.use(cors({
  origin: origenesPermitidos,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`🚀 SERVIDOR WAYRA NIKKEI ACTIVO EN PUERTO ${PORT}`));
}

// Exportamos 'app' para que Supertest pueda consumirlo
export default app;