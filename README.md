# UTS PPLOS A - Sistem Reservasi Klinik / Manajemen Pasien

Nama: Nadia Jasmine Aulia  
NIM: 2410511045  
Kelas: A  
Digit terakhir NIM: 5  
Studi kasus: Sistem Reservasi Klinik / Manajemen Pasien  
OAuth wajib: GitHub OAuth 2.0 Authorization Code Flow

## Ringkasan Arsitektur

Sistem terdiri dari 3 microservice independen dan 1 API Gateway sebagai single entry point.

| Komponen | Stack | Port | Database | Tanggung Jawab |
| --- | --- | --- | --- | --- |
| API Gateway | Node.js + Express | 3000 | - | Routing, validasi JWT, rate limiting 60 req/menit |
| Auth Service | Node.js + Express | 3001 | `auth_db` | Register, login lokal, refresh token, logout, GitHub OAuth |
| Patient Service | PHP MVC sederhana | 8000 | `patient_db` | Pendaftaran pasien, rekam kunjungan, e-resep |
| Appointment Service | Node.js + Express | 3002 | `appointment_db` | Jadwal dokter dan reservasi online |

Setiap service memiliki schema database sendiri. Appointment Service mengonsumsi Patient Service saat membuat reservasi untuk memastikan pasien valid, sehingga service PHP MVC tidak berdiri sendiri.

## Cara Menjalankan

1. Buat database MySQL/MariaDB:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE patient_db;
CREATE DATABASE appointment_db;
```

2. Import schema:

```bash
mysql -u root -p auth_db < services/auth-service/schema.sql
mysql -u root -p patient_db < services/patient-service/schema.sql
mysql -u root -p appointment_db < services/appointment-service/schema.sql
```

3. Salin konfigurasi environment:

```bash
copy gateway\.env.example gateway\.env
copy services\auth-service\.env.example services\auth-service\.env
copy services\appointment-service\.env.example services\appointment-service\.env
copy services\patient-service\.env.example services\patient-service\.env
```

4. Isi `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, dan konfigurasi database di file `.env`.

5. Install dependency PHP:

```bash
cd services\patient-service
composer install
```

6. Install dependency Node.js:

```bash
cd services\auth-service
npm install
cd ..\appointment-service
npm install
cd ..\..\gateway
npm install
```

7. Jalankan service:

```bash
cd services\auth-service && npm run dev
cd services\appointment-service && npm run dev
cd services\patient-service && php spark serve --host localhost --port 8000
cd gateway && npm run dev
```

Klien hanya memanggil `http://localhost:3000` melalui API Gateway.

## Peta Endpoint Gateway

| Method | Endpoint Gateway | Service Tujuan | Proteksi |
| --- | --- | --- | --- |
| POST | `/auth/register` | Auth Service | Public |
| POST | `/auth/login` | Auth Service | Public |
| GET | `/auth/github` | Auth Service | Public |
| GET | `/auth/github/callback` | Auth Service | Public |
| POST | `/auth/refresh` | Auth Service | Public |
| POST | `/auth/logout` | Auth Service | JWT |
| POST | `/auth/introspect` | Auth Service | JWT/Internal |
| GET | `/patients?page=1&per_page=10&name=&nik=` | Patient Service | JWT |
| POST | `/patients` | Patient Service | JWT |
| GET | `/records/:id` | Patient Service | JWT |
| POST | `/records` | Patient Service | JWT |
| POST | `/prescriptions` | Patient Service | JWT |
| GET | `/doctors/schedule` | Appointment Service | JWT |
| POST | `/reservations` | Appointment Service | JWT |
| GET | `/reservations/me` | Appointment Service | JWT |
| PATCH | `/reservations/:id/status` | Appointment Service | JWT |
| DELETE | `/reservations/:id` | Appointment Service | JWT |

## HTTP Status yang Digunakan

`200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, dan `500 Internal Server Error`.

## GitHub OAuth

Gunakan callback berikut pada GitHub OAuth App:

```text
http://localhost:3000/auth/github/callback
```

Gateway meneruskan callback ke Auth Service. Auth Service menukar `code` ke GitHub, mengambil profil user, lalu membuat atau memperbarui user lokal dengan `oauth_provider = github`, nama, email, dan foto profil.

Catatan pengujian OAuth: endpoint `GET /auth/github` dan `GET /auth/github/callback` tidak memakai Bearer Token. Authorization code GitHub hanya bisa digunakan sekali dan cepat kedaluwarsa. Jika callback mengembalikan `bad_verification_code`, ambil code baru dari alur login GitHub.

## Dokumentasi Pengerjaan

- [Laporan](docs/laporan-uts.pdf)
- [Arsitektur System](docs/architecture.drawio.png)
- [Video Demo](https://www.youtube.com/watch?v=Wvq3t67dvPI)

Tag final yang disarankan: `submission-v1`.
