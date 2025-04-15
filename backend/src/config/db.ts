import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Création du pool de connexions
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'userpass',
    database: process.env.DB_NAME || 'nextdoorbuddy',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;
