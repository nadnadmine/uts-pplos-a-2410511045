# Arsitektur Sistem Reservasi Klinik / Manajemen Pasien

## Pemisahan Service

Sistem dipisah menjadi service kecil agar setiap bounded context punya data dan tanggung jawab yang jelas.

| Service | Alasan Dipisah | Database |
| --- | --- | --- |
| Auth Service | Autentikasi, token, dan OAuth memiliki risiko keamanan tinggi dan sering dipakai semua service. Jika dibuat monolitik, perubahan login dapat mengganggu fitur klinik lain. | `auth_db` |
| Patient Service | Data pasien, rekam kunjungan, dan e-resep adalah domain klinis yang membutuhkan validasi dan relasi tabel kuat. Service ini dibuat dengan PHP MVC sesuai ketentuan soal. | `patient_db` |
| Appointment Service | Jadwal dokter dan reservasi punya aturan kuota, konflik booking, dan status reservasi sendiri. Service ini mengonsumsi Patient Service untuk validasi pasien. | `appointment_db` |
| API Gateway | Semua request klien melewati satu pintu untuk rate limit, routing, dan validasi JWT sebelum diteruskan. | - |

## Alur Komunikasi

1. Klien login melalui `POST /auth/login` di Gateway.
2. Gateway meneruskan request ke Auth Service.
3. Auth Service mengembalikan access token 15 menit dan refresh token 7 hari.
4. Request terproteksi membawa header `Authorization: Bearer <token>`.
5. Gateway memvalidasi JWT dan menambahkan `x-user-id`, `x-user-email`, dan `x-user-role`.
6. Appointment Service memanggil Patient Service pada saat `POST /reservations` untuk memastikan `patient_id` valid.

## Peta Routing Gateway

| Prefix | Service Tujuan |
| --- | --- |
| `/auth/*` | Auth Service |
| `/patients/*`, `/records/*`, `/prescriptions/*` | Patient Service |
| `/doctors/*`, `/reservations/*` | Appointment Service |

## Perbandingan dengan Monolitik

Pendekatan monolitik lebih sederhana untuk deployment awal, tetapi semua modul berbagi satu database dan satu codebase. Pada studi kasus klinik, perubahan aturan reservasi, perubahan skema rekam medis, dan perubahan keamanan login bisa saling berdampak. Dengan microservice, tiap service memiliki database terpisah dan kontrak REST yang jelas. Konsekuensinya, integrasi menjadi lebih kompleks dan butuh API Gateway, tetapi desain ini lebih sesuai dengan tujuan mata kuliah service-oriented.
