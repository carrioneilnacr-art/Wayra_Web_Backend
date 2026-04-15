import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Forzamos el uso de la URL completa que es más estable
const pool = mysql.createPool(process.env.DATABASE_URL);

export default pool;
