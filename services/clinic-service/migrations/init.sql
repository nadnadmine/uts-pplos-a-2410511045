-- ============================================================
-- clinic_db — Database untuk clinic-service
-- Tabel: doctors, doctor_schedules, reservations
-- ============================================================

CREATE DATABASE IF NOT EXISTS clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinic_db;

-- ── Doctors ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id              CHAR(36)     NOT NULL,
  user_id         CHAR(36)     NULL COMMENT 'Referensi ke users.id di auth_db',
  name            VARCHAR(100) NOT NULL,
  specialization  VARCHAR(100) NOT NULL,
  str_number      VARCHAR(50)  NOT NULL COMMENT 'Nomor STR dokter',
  phone           VARCHAR(20)  NULL,
  is_active       TINYINT(1)  NOT NULL DEFAULT 1,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_str (str_number),
  KEY idx_specialization (specialization),
  KEY idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Doctor Schedules (Jadwal Praktik) ────────────────────────
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id           CHAR(36)   NOT NULL,
  doctor_id    CHAR(36)   NOT NULL,
  day_of_week  TINYINT    NOT NULL COMMENT '0=Minggu, 1=Senin, ..., 6=Sabtu',
  start_time   TIME       NOT NULL,
  end_time     TIME       NOT NULL,
  max_patients SMALLINT   NOT NULL DEFAULT 20,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_doctor_id (doctor_id),
  KEY idx_day (day_of_week),
  CONSTRAINT fk_sched_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT chk_day CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT chk_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Reservations (Antrian Pasien) ────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id               CHAR(36)   NOT NULL,
  patient_id       CHAR(36)   NOT NULL COMMENT 'Referensi ke patients.id di patient_db',
  doctor_id        CHAR(36)   NOT NULL,
  schedule_id      CHAR(36)   NOT NULL,
  reservation_date DATE       NOT NULL,
  queue_number     SMALLINT   NOT NULL COMMENT 'Nomor antrian pada hari itu',
  status           ENUM('pending','confirmed','cancelled','done') NOT NULL DEFAULT 'pending',
  complaint        TEXT       NOT NULL,
  created_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_patient_id (patient_id),
  KEY idx_doctor_date (doctor_id, reservation_date),
  KEY idx_status (status),
  CONSTRAINT fk_res_doctor   FOREIGN KEY (doctor_id)   REFERENCES doctors(id),
  CONSTRAINT fk_res_schedule FOREIGN KEY (schedule_id) REFERENCES doctor_schedules(id),
  CONSTRAINT uq_patient_date UNIQUE (patient_id, doctor_id, reservation_date)
    COMMENT 'Satu pasien hanya boleh reservasi 1x per dokter per hari'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Dokter contoh ───────────────────────────────────────
INSERT INTO doctors (id, name, specialization, str_number, phone) VALUES
('d0000000-0000-0000-0000-000000000001', 'dr. Siti Rahayu', 'Umum', 'STR-001-2024', '081234567890'),
('d0000000-0000-0000-0000-000000000002', 'dr. Budi Pratama, Sp.PD', 'Penyakit Dalam', 'STR-002-2024', '081234567891');

-- Jadwal dokter contoh
INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, max_patients) VALUES
('s0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, '08:00:00', '12:00:00', 20),
('s0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 3, '08:00:00', '12:00:00', 20),
('s0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 2, '13:00:00', '17:00:00', 15),
('s0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 4, '13:00:00', '17:00:00', 15);