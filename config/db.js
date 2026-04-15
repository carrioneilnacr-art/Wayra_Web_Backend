import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Creamos la configuración basándonos en si existe la URL completa o variables separadas
const dbConfig = process.env.DATABASE_URL || {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'restaurante_wayra1',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

export default pool;
