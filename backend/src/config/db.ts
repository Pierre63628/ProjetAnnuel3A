import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Création du pool de connexions PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'rootpass',
    database: process.env.DB_NAME || 'nextdoorbuddy',
    max: 20,
    idleTimeoutMillis: 30000
});

export default pool;
