import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', 
  password: '1234', 
  database: 'restaurante_wayra1',
  waitForConnections: true,    
  connectionLimit: 10,         // Máximo de conexiones simultáneas
  queueLimit: 0                
});

export default pool;