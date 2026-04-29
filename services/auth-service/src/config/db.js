// services/auth-service/src/config/db.js
'use strict';

const mysql = require('mysql2/promise');

let pool = null;

/**
 * Membuat connection pool MySQL.
 * Menggunakan pool agar koneksi di-reuse, tidak membuka koneksi baru tiap request.
 */
const createPool = () => {
  pool = mysql.createPool({
    host:               process.env.DB_HOST,
    port:               parseInt(process.env.DB_PORT || '3306', 10),
    database:           process.env.DB_NAME,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           '+07:00',
    charset:            'utf8mb4',
  });
  return pool;
};

const getPool = () => {
  if (!pool) createPool();
  return pool;
};

/**
 * Uji koneksi ke database saat startup.
 */
const testConnection = async () => {
  const conn = await getPool().getConnection();
  console.log('✅ [auth-service] Database connected:', process.env.DB_NAME);
  conn.release();
};

module.exports = { getPool, testConnection };