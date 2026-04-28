# 🏥 Sistem Reservasi Klinik & Manajemen Pasien

> UTS Pembangunan Perangkat Lunak Berorientasi Service (SE.2)  
> Kelas A — NIM: `<NIM_KAMU>` — Nama: `<NAMA_KAMU>`

---

## 📐 Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Postman)                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP :8000
┌──────────────────────▼──────────────────────────────────┐
│                   API GATEWAY                            │
│         (Node.js — Port 8000)                            │
│  • Routing per service                                   │
│  • JWT Validation (sebelum forward)                      │
│  • Rate Limiting (60 req/menit per IP)                   │
└───────┬─────────────────┬──────────────────┬────────────┘
        │ :3001           │ :8080            │ :3002
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│ auth-service │  │patient-service│  │clinic-service│
│  (Node.js)   │  │ (CodeIgniter4)│  │  (Node.js)   │
│              │  │               │  │              │
│  auth_db     │  │  patient_db   │  │  clinic_db   │
│  MySQL :3307 │  │  MySQL :3308  │  │  MySQL :3309 │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Justifikasi pemisahan service:**  
- **auth-service**: Cross-cutting concern, perlu diakses semua service. Isolasi keamanan; jika service ini diperbarui, tidak mengganggu domain bisnis lain.  
- **patient-service**: Data medis bersifat sensitif (privasi pasien). Scaling terpisah dari modul klinik. Dibangun PHP/CodeIgniter4 agar tim backend medis bisa bekerja mandiri.  
- **clinic-service**: Data jadwal dokter dan reservasi bersifat high-write dan high-contention (banyak pasien booking bersamaan). Perlu scaling berbeda dari data statis pasien.

Pendekatan monolitik tidak dipilih karena: (1) perubahan di modul reservasi bisa merusak modul rekam medis tanpa isolasi, (2) tidak bisa scale per-beban, (3) tim tidak bisa deploy independen.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| API Gateway | Node.js 20 + Express |
| Auth Service | Node.js 20 + Express |
| Patient Service | PHP 8.2 + CodeIgniter 4 |
| Clinic Service | Node.js 20 + Express |
| Database | MySQL 8.0 (4 instance terpisah) |
| Auth | JWT (access ≤15 menit, refresh ≤7 hari) |
| OAuth | GitHub OAuth 2.0 (Authorization Code Flow) |
| Container | Docker + Docker Compose |

---

## ⚡ Cara Menjalankan

### Prasyarat
- Docker Desktop ≥ 24.x
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/<USERNAME>/uts-pplos-a-<NIM>.git
cd uts-pplos-a-<NIM>
```

### 2. Konfigurasi Environment

```bash
# Auth Service
cp services/auth-service/.env.example services/auth-service/.env

# Patient Service
cp services/patient-service/.env.example services/patient-service/.env

# Clinic Service
cp services/clinic-service/.env.example services/clinic-service/.env

# API Gateway
cp gateway/.env.example gateway/.env
```

Edit setiap `.env` dan isi nilai yang diperlukan (terutama `GITHUB_CLIENT_ID` dan `GITHUB_CLIENT_SECRET`).

### 3. Jalankan dengan Docker

```bash
docker-compose up --build -d
```

Tunggu hingga semua container `healthy`:
```bash
docker-compose ps
```

### 4. Verifikasi

```bash
# Health check gateway
curl http://localhost:8000/health

# Health check per service
curl http://localhost:3001/health   # auth-service
curl http://localhost:8080/health   # patient-service
curl http://localhost:3002/health   # clinic-service
```

### Tanpa Docker (Development Manual)

Lihat [SETUP_MANUAL.md](./docs/SETUP_MANUAL.md) untuk instruksi instalasi manual.

---

## 🗺️ Peta Endpoint (API Gateway — Base URL: `http://localhost:8000`)

### 🔐 Auth (`/auth`) → auth-service:3001

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/auth/register` | ❌ | Registrasi user baru |
| POST | `/auth/login` | ❌ | Login, dapatkan JWT |
| POST | `/auth/refresh` | ❌ | Perbarui access token |
| POST | `/auth/logout` | ✅ | Invalidasi token |
| GET | `/auth/me` | ✅ | Data user aktif |
| GET | `/auth/oauth/github` | ❌ | Redirect ke GitHub OAuth |
| GET | `/auth/oauth/github/callback` | ❌ | Callback GitHub OAuth |

### 👤 Pasien (`/patients`) → patient-service:8080

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/patients` | ✅ admin,staff | List pasien (paging+filter) |
| POST | `/patients` | ✅ | Daftarkan pasien baru |
| GET | `/patients/:id` | ✅ | Detail pasien |
| PUT | `/patients/:id` | ✅ | Update data pasien |
| DELETE | `/patients/:id` | ✅ admin | Hapus pasien |
| GET | `/patients/:id/medical-records` | ✅ | Riwayat rekam medis |
| POST | `/patients/:id/medical-records` | ✅ doctor,staff | Buat rekam kunjungan |
| GET | `/patients/:id/medical-records/:rid` | ✅ | Detail rekam medis |
| POST | `/patients/:id/medical-records/:rid/prescriptions` | ✅ doctor | Buat e-resep |
| GET | `/patients/:id/medical-records/:rid/prescriptions` | ✅ | Lihat e-resep |

### 🏥 Klinik (`/clinic`) → clinic-service:3002

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/clinic/doctors` | ❌ | List dokter (publik) |
| POST | `/clinic/doctors` | ✅ admin | Tambah dokter |
| GET | `/clinic/doctors/:id` | ❌ | Detail dokter |
| PUT | `/clinic/doctors/:id` | ✅ admin | Update dokter |
| DELETE | `/clinic/doctors/:id` | ✅ admin | Nonaktifkan dokter |
| GET | `/clinic/doctors/:id/schedules` | ❌ | Jadwal dokter |
| POST | `/clinic/doctors/:id/schedules` | ✅ admin | Tambah jadwal |
| PUT | `/clinic/doctors/:id/schedules/:sid` | ✅ admin | Update jadwal |
| DELETE | `/clinic/doctors/:id/schedules/:sid` | ✅ admin | Hapus jadwal |
| GET | `/clinic/reservations` | ✅ admin,staff | Semua reservasi |
| POST | `/clinic/reservations` | ✅ | Buat reservasi |
| GET | `/clinic/reservations/my` | ✅ patient | Reservasi saya |
| GET | `/clinic/reservations/:id` | ✅ | Detail reservasi |
| PATCH | `/clinic/reservations/:id/status` | ✅ admin,staff,doctor | Update status |
| DELETE | `/clinic/reservations/:id` | ✅ | Batalkan reservasi |

---

## 📹 Demo Video

> Link demo YouTube: `<TAMBAHKAN_LINK_YOUTUBE>`

---

## 📁 Struktur Repository

```
uts-pplos-a-2410511045/
│
├── README.md
├── docker-compose.yml
├── .gitignore
│
├── gateway/
│   ├── src/
│   │   ├── index.js
│   │   ├── middleware/
│   │   │   ├── jwtValidation.js
│   │   │   └── rateLimiter.js
│   │   └── config/
│   │       └── routes.js
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── services/
│   │
│   ├── auth-service/           # Node.js — JWT + GitHub OAuth
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── config/
│   │   │   │   └── db.js
│   │   │   ├── middleware/
│   │   │   │   └── authMiddleware.js
│   │   │   ├── models/
│   │   │   │   └── User.js
│   │   │   ├── controllers/
│   │   │   │   ├── AuthController.js
│   │   │   │   └── OAuthController.js
│   │   │   └── routes/
│   │   │       ├── auth.routes.js
│   │   │       └── oauth.routes.js
│   │   ├── migrations/
│   │   │   └── init.sql
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── Dockerfile
│   │
│   ├── patient-service/        # Laravel 11 — PHP MVC (WAJIB)
│   │   ├── app/
│   │   │   ├── Http/
│   │   │   │   ├── Controllers/
│   │   │   │   │   ├── PatientController.php
│   │   │   │   │   ├── MedicalRecordController.php
│   │   │   │   │   └── PrescriptionController.php
│   │   │   │   ├── Middleware/
│   │   │   │   │   └── JwtMiddleware.php
│   │   │   │   └── Requests/
│   │   │   │       ├── StorePatientRequest.php
│   │   │   │       └── StorePrescriptionRequest.php
│   │   │   ├── Models/
│   │   │   │   ├── Patient.php
│   │   │   │   ├── MedicalRecord.php
│   │   │   │   └── Prescription.php
│   │   │   └── Services/
│   │   │       └── AuthServiceClient.php    # inter-service comm
│   │   ├── database/
│   │   │   └── migrations/
│   │   ├── routes/
│   │   │   └── api.php
│   │   ├── .env.example
│   │   └── Dockerfile
│   │
│   └── clinic-service/         # Node.js — Dokter, Jadwal, Reservasi
│       ├── src/
│       │   ├── index.js
│       │   ├── config/
│       │   │   └── db.js
│       │   ├── middleware/
│       │   │   └── authMiddleware.js
│       │   ├── models/
│       │   │   ├── Doctor.js
│       │   │   ├── Schedule.js
│       │   │   └── Reservation.js
│       │   ├── controllers/
│       │   │   ├── DoctorController.js
│       │   │   ├── ScheduleController.js
│       │   │   └── ReservationController.js
│       │   └── routes/
│       │       ├── doctor.routes.js
│       │       ├── schedule.routes.js
│       │       └── reservation.routes.js
│       ├── migrations/
│       │   └── init.sql
│       ├── package.json
│       ├── .env.example
│       └── Dockerfile
│
├── docs/
│   ├── laporan-uts.pdf
│   └── arsitektur.png
│
├── poster/
│   ├── poster-uts.pdf
│   └── poster-uts.png
│
└── postman/
    └── collection.json

```

---

## 👨‍💻 Identitas

| | |
|---|---|
| **Nama** | `Nadia Jasmine Aulia`
| **NIM** | `2410511045`
| **Kelas** | A |
| **Studi Kasus** | Sistem Reservasi Klinik / Manajemen Pasien (digit akhir NIM: 5) |
| **OAuth Provider** | GitHub OAuth 2.0 (NIM Ganjil) |
| **Mata Kuliah** | Pembangunan Perangkat Lunak Berorientasi Service (INF124412) |
| **Dosen** | Muhammad Panji Muslim, S.Pd., M.Kom |