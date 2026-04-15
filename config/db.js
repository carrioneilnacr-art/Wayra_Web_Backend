import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Si existe DATABASE_URL (en Render), la usa. Si no, usa el objeto de configuración (Local).
const pool = process.env.DATABASE_URL 
  ? mysql.createPool(process.env.DATABASE_URL)
  : mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root', 
      password: process.env.DB_PASSWORD || '1234', 
      database: process.env.DB_NAME || 'restaurante_wayra1',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,    
      connectionLimit: 10,         
      queueLimit: 0                
    });

export default pool;
