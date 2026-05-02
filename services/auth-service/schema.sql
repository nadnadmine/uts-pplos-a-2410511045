CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NULL,
    avatar_url VARCHAR(255) NULL,
    oauth_id VARCHAR(100) NULL,
    oauth_provider ENUM('local', 'github') DEFAULT 'local',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE token_blacklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO roles (role_name) VALUES ('admin'), ('doctor'), ('patient')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

INSERT INTO users (name, email, password, avatar_url, oauth_provider) VALUES
('Admin Klinik', 'admin.klinik@example.com', '$2a$10$iBbisIx4.V7.x3mYYIC7q.xEhG4.tTKDIyV3jsI6xJQ3aa19zx9ga', 'https://avatars.githubusercontent.com/u/1?v=4', 'local'),
('dr. Rania Putri', 'rania.dokter@example.com', '$2a$10$iBbisIx4.V7.x3mYYIC7q.xEhG4.tTKDIyV3jsI6xJQ3aa19zx9ga', 'https://avatars.githubusercontent.com/u/2?v=4', 'local'),
('drg. Arif Maulana', 'arif.dokter@example.com', '$2a$10$iBbisIx4.V7.x3mYYIC7q.xEhG4.tTKDIyV3jsI6xJQ3aa19zx9ga', 'https://avatars.githubusercontent.com/u/3?v=4', 'local'),
('Nadia Jasmine Aulia', 'nadia@example.com', '$2a$10$iBbisIx4.V7.x3mYYIC7q.xEhG4.tTKDIyV3jsI6xJQ3aa19zx9ga', 'https://avatars.githubusercontent.com/u/4?v=4', 'local'),
('Bima Pratama', 'bima@example.com', '$2a$10$iBbisIx4.V7.x3mYYIC7q.xEhG4.tTKDIyV3jsI6xJQ3aa19zx9ga', 'https://avatars.githubusercontent.com/u/5?v=4', 'local')
ON DUPLICATE KEY UPDATE
name = VALUES(name),
password = VALUES(password),
avatar_url = VALUES(avatar_url),
oauth_provider = VALUES(oauth_provider);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.role_name = 'admin' WHERE u.email = 'admin.klinik@example.com';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.role_name = 'doctor' WHERE u.email IN ('rania.dokter@example.com', 'arif.dokter@example.com');

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.role_name = 'patient' WHERE u.email IN ('nadia@example.com', 'bima@example.com');
