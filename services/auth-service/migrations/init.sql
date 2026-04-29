-- ============================================================
-- auth_db — Database untuk auth-service
-- Tabel: users, refresh_tokens, token_blacklist
-- ============================================================

CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auth_db;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)      NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL,
  password_hash VARCHAR(255)  NULL COMMENT 'NULL jika user OAuth-only',
  role          ENUM('admin','doctor','staff','patient') NOT NULL DEFAULT 'patient',
  oauth_provider VARCHAR(30)  NULL COMMENT 'github | null',
  oauth_id      VARCHAR(100)  NULL,
  avatar_url    TEXT          NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email),
  UNIQUE KEY uq_oauth (oauth_provider, oauth_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Refresh Tokens ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          CHAR(36)    NOT NULL,
  user_id     CHAR(36)    NOT NULL,
  token_hash  VARCHAR(255) NOT NULL COMMENT 'SHA-256 dari refresh token',
  expires_at  DATETIME    NOT NULL,
  revoked     TINYINT(1)  NOT NULL DEFAULT 0,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_token_hash (token_hash),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Token Blacklist (untuk logout / invalidasi access token) ─
CREATE TABLE IF NOT EXISTS token_blacklist (
  id          CHAR(36)    NOT NULL,
  token_jti   VARCHAR(36) NOT NULL COMMENT 'JWT ID (jti claim)',
  expires_at  DATETIME    NOT NULL COMMENT 'Hapus saat expired untuk hemat storage',
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_jti (token_jti),
  KEY idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Admin default ──────────────────────────────────────
-- Password: Admin@12345 (bcrypt hash, ganti setelah deploy)
INSERT INTO users (id, name, email, password_hash, role) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Administrator',
  'admin@klinik.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewzFpq7RjcXtIm.2',
  'admin'
);