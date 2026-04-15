import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Creamos un objeto con la configuración
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Si por alguna razón Render no lee las variables individuales, 
// intentamos usar la URL completa si existe.
const pool = process.env.DATABASE_URL 
  ? mysql.createPool(process.env.DATABASE_URL) 
  : mysql.createPool(dbConfig);

export default pool;
