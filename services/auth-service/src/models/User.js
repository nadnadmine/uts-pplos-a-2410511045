// services/auth-service/src/models/User.js
'use strict';

const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class User {
  // ── Buat user baru ──────────────────────────────────────────
  static async create({ name, email, password, role = 'patient', oauthProvider = null, oauthId = null, avatarUrl = null }) {
    const pool = getPool();
    const id = uuidv4();
    const passwordHash = password
      ? await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10))
      : null;

    await pool.execute(
      `INSERT INTO users (id, name, email, password_hash, role, oauth_provider, oauth_id, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, passwordHash, role, oauthProvider, oauthId, avatarUrl]
    );
    return this.findById(id);
  }

  // ── Cari user by ID ─────────────────────────────────────────
  static async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, oauth_provider, oauth_id, avatar_url, is_active, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  // ── Cari user by email (termasuk password_hash untuk login) ─
  static async findByEmailWithPassword(email) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, name, email, password_hash, role, oauth_provider, is_active
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  // ── Cari user by email (tanpa password) ─────────────────────
  static async findByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, oauth_provider, oauth_id, avatar_url, is_active
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  // ── Cari user by OAuth provider + oauth_id ──────────────────
  static async findByOAuth(provider, oauthId) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, oauth_provider, oauth_id, avatar_url, is_active
       FROM users WHERE oauth_provider = ? AND oauth_id = ? LIMIT 1`,
      [provider, String(oauthId)]
    );
    return rows[0] || null;
  }

  // ── Verifikasi password ─────────────────────────────────────
  static async verifyPassword(plainPassword, hash) {
    if (!hash) return false;
    return bcrypt.compare(plainPassword, hash);
  }

  // ── Cek apakah email sudah ada ──────────────────────────────
  static async emailExists(email) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows.length > 0;
  }
}

module.exports = User;