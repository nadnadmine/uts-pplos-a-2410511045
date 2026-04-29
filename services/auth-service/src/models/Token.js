// services/auth-service/src/models/Token.js
'use strict';

const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class Token {
  // ── Hash token dengan SHA-256 (tidak simpan plain token di DB) ─
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // ── Simpan refresh token baru ───────────────────────────────
  static async saveRefreshToken(userId, refreshToken, expiresAt) {
    const pool = getPool();
    const id = uuidv4();
    const tokenHash = this.hashToken(refreshToken);

    await pool.execute(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
      [id, userId, tokenHash, expiresAt]
    );
    return id;
  }

  // ── Cari refresh token (untuk validasi saat /refresh) ───────
  static async findRefreshToken(refreshToken) {
    const pool = getPool();
    const tokenHash = this.hashToken(refreshToken);

    const [rows] = await pool.execute(
      `SELECT id, user_id, expires_at, revoked
       FROM refresh_tokens
       WHERE token_hash = ? AND revoked = 0 AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  // ── Cabut (revoke) satu refresh token ───────────────────────
  static async revokeRefreshToken(refreshToken) {
    const pool = getPool();
    const tokenHash = this.hashToken(refreshToken);

    await pool.execute(
      'UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?',
      [tokenHash]
    );
  }

  // ── Cabut SEMUA refresh token milik user (untuk logout semua device) ─
  static async revokeAllUserTokens(userId) {
    const pool = getPool();
    await pool.execute(
      'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?',
      [userId]
    );
  }

  // ── Blacklist access token (simpan JTI-nya) ─────────────────
  static async blacklistAccessToken(jti, expiresAt) {
    const pool = getPool();
    const id = uuidv4();

    await pool.execute(
      `INSERT IGNORE INTO token_blacklist (id, token_jti, expires_at)
       VALUES (?, ?, ?)`,
      [id, jti, expiresAt]
    );
  }

  // ── Cek apakah JTI ada di blacklist ─────────────────────────
  static async isBlacklisted(jti) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id FROM token_blacklist
       WHERE token_jti = ? AND expires_at > NOW()
       LIMIT 1`,
      [jti]
    );
    return rows.length > 0;
  }

  // ── Bersihkan token blacklist yang sudah expired (opsional, bisa di-cron) ─
  static async cleanupExpiredBlacklist() {
    const pool = getPool();
    await pool.execute('DELETE FROM token_blacklist WHERE expires_at <= NOW()');
  }
}

module.exports = Token;