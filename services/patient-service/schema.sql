CREATE DATABASE IF NOT EXISTS patient_db;
USE patient_db;

CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nik CHAR(16) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender ENUM('L', 'P') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_name VARCHAR(120) NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT NOT NULL,
    visit_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) NOT NULL
);

CREATE TABLE prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    medicine_id INT NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    instruction VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

INSERT INTO medicines (name, unit) VALUES
('Paracetamol', 'tablet'),
('Amoxicillin', 'capsule'),
('Antasida', 'tablet')
ON DUPLICATE KEY UPDATE unit = VALUES(unit);

INSERT INTO patients (id, user_id, nik, name, birth_date, gender, phone, address) VALUES
(1, 4, '3175010101010005', 'Nadia Jasmine Aulia', '2004-01-01', 'P', '081234567890', 'Jakarta Selatan'),
(2, 5, '3175010202020005', 'Bima Pratama', '2003-02-02', 'L', '081234567891', 'Depok'),
(3, 4, '3175010303030005', 'Salsa Kirana', '2018-03-03', 'P', '081234567892', 'Jakarta Timur'),
(4, 5, '3175010404040005', 'Rafi Mahendra', '1998-04-04', 'L', '081234567893', 'Tangerang'),
(5, 4, '3175010505050005', 'Maya Fitriani', '1995-05-05', 'P', '081234567894', 'Bekasi')
ON DUPLICATE KEY UPDATE
user_id = VALUES(user_id),
name = VALUES(name),
birth_date = VALUES(birth_date),
gender = VALUES(gender),
phone = VALUES(phone),
address = VALUES(address);

INSERT INTO medical_records (id, patient_id, doctor_name, diagnosis, treatment, visit_date) VALUES
(1, 1, 'dr. Rania Putri', 'Influenza', 'Istirahat cukup dan minum obat penurun panas', '2026-05-04'),
(2, 2, 'drg. Arif Maulana', 'Karies gigi', 'Tambal gigi dan kontrol ulang', '2026-05-06'),
(3, 3, 'dr. Lestari Ayu', 'Batuk pilek ringan', 'Observasi dan obat simptomatik', '2026-05-05'),
(4, 4, 'dr. Dimas Saputra', 'Dispepsia', 'Pola makan teratur dan antasida', '2026-05-07'),
(5, 5, 'dr. Maya Kartika', 'Konjungtivitis', 'Tetes mata antibiotik', '2026-05-08')
ON DUPLICATE KEY UPDATE
patient_id = VALUES(patient_id),
doctor_name = VALUES(doctor_name),
diagnosis = VALUES(diagnosis),
treatment = VALUES(treatment),
visit_date = VALUES(visit_date);

INSERT INTO medicines (id, name, unit) VALUES
(1, 'Paracetamol', 'tablet'),
(2, 'Amoxicillin', 'capsule'),
(3, 'Antasida', 'tablet'),
(4, 'Obat Batuk Hitam', 'botol'),
(5, 'Tetes Mata Chloramphenicol', 'botol')
ON DUPLICATE KEY UPDATE
name = VALUES(name),
unit = VALUES(unit);

INSERT INTO prescriptions (id, record_id, medicine_id, dosage, instruction, quantity) VALUES
(1, 1, 1, '500mg', '3x sehari setelah makan', 10),
(2, 2, 2, '500mg', '3x sehari setelah makan selama 5 hari', 15),
(3, 3, 4, '10ml', '3x sehari setelah makan', 1),
(4, 4, 3, '1 tablet', '3x sehari sebelum makan', 10),
(5, 5, 5, '1 tetes', '4x sehari pada mata yang sakit', 1)
ON DUPLICATE KEY UPDATE
record_id = VALUES(record_id),
medicine_id = VALUES(medicine_id),
dosage = VALUES(dosage),
instruction = VALUES(instruction),
quantity = VALUES(quantity);
