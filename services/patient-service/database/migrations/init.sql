-- ============================================================
-- patient_db — Database untuk patient-service (CodeIgniter 4)
-- Tabel: patients, medical_records, prescriptions, prescription_items
-- MINIMAL 4 TABEL TER-RELASI (memenuhi syarat UTS)
-- ============================================================

CREATE DATABASE IF NOT EXISTS patient_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE patient_db;

-- ── Patients ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id                CHAR(36)     NOT NULL,
  user_id           CHAR(36)     NULL COMMENT 'Referensi ke users.id di auth_db',
  nik               VARCHAR(16)  NOT NULL,
  name              VARCHAR(100) NOT NULL,
  date_of_birth     DATE         NOT NULL,
  gender            ENUM('male','female') NOT NULL,
  blood_type        ENUM('A','B','AB','O') NULL,
  phone             VARCHAR(20)  NOT NULL,
  address           TEXT         NOT NULL,
  emergency_contact VARCHAR(100) NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME     NULL COMMENT 'Soft delete',
  PRIMARY KEY (id),
  UNIQUE KEY uq_nik (nik),
  KEY idx_name (name),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Medical Records (Rekam Kunjungan) ────────────────────────
CREATE TABLE IF NOT EXISTS medical_records (
  id              CHAR(36)  NOT NULL,
  patient_id      CHAR(36)  NOT NULL,
  doctor_id       CHAR(36)  NOT NULL COMMENT 'Referensi ke doctors.id di clinic_db',
  reservation_id  CHAR(36)  NULL     COMMENT 'Referensi ke reservations.id di clinic_db',
  visit_date      DATE      NOT NULL,
  chief_complaint TEXT      NOT NULL COMMENT 'Keluhan utama pasien',
  diagnosis       TEXT      NOT NULL,
  notes           TEXT      NULL,
  created_at      DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_patient_id (patient_id),
  KEY idx_visit_date (visit_date),
  CONSTRAINT fk_mr_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Prescriptions (E-Resep) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id                CHAR(36)  NOT NULL,
  medical_record_id CHAR(36)  NOT NULL,
  created_at        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_medical_record (medical_record_id) COMMENT '1 resep per rekam medis',
  CONSTRAINT fk_presc_mr FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Prescription Items (Item Obat dalam Resep) ───────────────
CREATE TABLE IF NOT EXISTS prescription_items (
  id              CHAR(36)     NOT NULL,
  prescription_id CHAR(36)     NOT NULL,
  drug_name       VARCHAR(150) NOT NULL,
  dosage          VARCHAR(100) NOT NULL  COMMENT 'misal: 1 tablet, 500mg',
  frequency       VARCHAR(100) NOT NULL  COMMENT 'misal: 3x sehari',
  duration_days   TINYINT      NOT NULL  DEFAULT 3,
  notes           TEXT         NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prescription_id (prescription_id),
  CONSTRAINT fk_item_presc FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;