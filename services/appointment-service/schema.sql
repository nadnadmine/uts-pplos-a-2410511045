CREATE DATABASE IF NOT EXISTS appointment_db;
USE appointment_db;

CREATE TABLE clinics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinic_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    day_of_week ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    quota INT NOT NULL DEFAULT 10,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    patient_id INT NOT NULL,
    schedule_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    complaint TEXT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_patient_schedule_date (patient_id, schedule_id, reservation_date),
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

INSERT INTO clinics (id, clinic_name) VALUES
(1, 'Poli Umum'),
(2, 'Poli Gigi'),
(3, 'Poli Anak'),
(4, 'Poli Penyakit Dalam'),
(5, 'Poli Mata')
ON DUPLICATE KEY UPDATE clinic_name = VALUES(clinic_name);

INSERT INTO doctors (id, clinic_id, name, specialization) VALUES
(1, 1, 'dr. Rania Putri', 'Dokter Umum'),
(2, 2, 'drg. Arif Maulana', 'Dokter Gigi'),
(3, 3, 'dr. Lestari Ayu', 'Spesialis Anak'),
(4, 4, 'dr. Dimas Saputra', 'Spesialis Penyakit Dalam'),
(5, 5, 'dr. Maya Kartika', 'Spesialis Mata')
ON DUPLICATE KEY UPDATE
clinic_id = VALUES(clinic_id),
name = VALUES(name),
specialization = VALUES(specialization);

INSERT INTO schedules (id, doctor_id, day_of_week, start_time, end_time, quota) VALUES
(1, 1, 'Senin', '08:00:00', '12:00:00', 12),
(2, 2, 'Rabu', '13:00:00', '16:00:00', 8),
(3, 3, 'Selasa', '09:00:00', '12:00:00', 10),
(4, 4, 'Kamis', '10:00:00', '14:00:00', 9),
(5, 5, 'Jumat', '08:00:00', '11:00:00', 7)
ON DUPLICATE KEY UPDATE
doctor_id = VALUES(doctor_id),
day_of_week = VALUES(day_of_week),
start_time = VALUES(start_time),
end_time = VALUES(end_time),
quota = VALUES(quota);

INSERT INTO reservations (id, user_id, patient_id, schedule_id, reservation_date, complaint, status) VALUES
(1, 4, 1, 1, '2026-05-04', 'Demam dan pusing', 'confirmed'),
(2, 5, 2, 2, '2026-05-06', 'Sakit gigi', 'pending'),
(3, 4, 3, 3, '2026-05-05', 'Kontrol anak', 'pending'),
(4, 5, 4, 4, '2026-05-07', 'Nyeri lambung', 'completed'),
(5, 4, 5, 5, '2026-05-08', 'Mata merah', 'cancelled')
ON DUPLICATE KEY UPDATE
user_id = VALUES(user_id),
patient_id = VALUES(patient_id),
schedule_id = VALUES(schedule_id),
reservation_date = VALUES(reservation_date),
complaint = VALUES(complaint),
status = VALUES(status);
