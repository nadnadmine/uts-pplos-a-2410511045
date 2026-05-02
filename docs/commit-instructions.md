# Alur Commit, Branch, dan Pull Request

Dokumen ini menggabungkan instruksi commit dan daftar Pull Request agar riwayat Git rapi, berurutan, dan sesuai ketentuan soal UTS. Format commit menggunakan Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, dan `chore:`.

## Query Git Dasar

Gunakan query ini selama pengerjaan:

```bash
git status
git branch
git log --oneline --graph --decorate --all
git diff
git diff --staged
git remote -v
```

Untuk membuat branch fitur:

```bash
git checkout main
git pull origin main
git checkout -b feature/gateway-baseline
```

Untuk push branch:

```bash
git push -u origin feature/gateway-baseline
```

Untuk melihat tag final:

```bash
git tag
git show submission-v1
```

## PR 1 - feature/gateway-baseline

Judul Pull Request: `feat: setup gateway routing and rate limiting`

Tujuan:
- Membuat API Gateway sebagai single entry point.
- Menambahkan routing ke Auth, Patient, dan Appointment Service.
- Menambahkan rate limiting 60 request per menit.

Perintah:

```bash
git checkout main
git pull origin main
git checkout -b feature/gateway-baseline

git add .gitignore docker-compose.yml README.md gateway
git commit -m "chore: initial repository structure and docker-compose setup"

git add gateway/server.js gateway/routes/gatewayRoutes.js gateway/package.json gateway/.env.example
git commit -m "feat: setup express api gateway with basic routing"

git add gateway/server.js gateway/package.json gateway/.env.example
git commit -m "feat: implement express-rate-limit on gateway"

git push -u origin feature/gateway-baseline
```

Pull Request:
- Base: `main`
- Compare: `feature/gateway-baseline`
- Checklist: `/health` gateway aktif, routing prefix service tersedia, rate limit aktif.

Merge:

```bash
git checkout main
git pull origin main
git merge --no-ff feature/gateway-baseline
git push origin main
```

## PR 2 - feature/jwt-auth-github-oauth

Judul Pull Request: `feat: implement jwt auth and github oauth`

Tujuan:
- Register dan login lokal.
- Access token maksimal 15 menit.
- Refresh token maksimal 7 hari.
- Refresh token rotation dan logout blacklist.
- GitHub OAuth Authorization Code Flow.

Perintah:

```bash
git checkout main
git pull origin main
git checkout -b feature/jwt-auth-github-oauth

git add services/auth-service/schema.sql services/auth-service/config services/auth-service/package.json services/auth-service/.env.example
git commit -m "feat: init auth-service and database migration for users"

git add services/auth-service/controllers/authController.js services/auth-service/models/userModel.js services/auth-service/routes/authRoutes.js services/auth-service/server.js
git commit -m "feat: implement jwt generation and login logic in auth-service"

git add services/auth-service/controllers/oauthController.js services/auth-service/routes/authRoutes.js services/auth-service/schema.sql
git commit -m "feat: add github oauth2 flow with authorization code"

git add services/auth-service/controllers/authController.js services/auth-service/schema.sql services/auth-service/routes/authRoutes.js
git commit -m "fix: handle refresh token and token invalidation logout"

git push -u origin feature/jwt-auth-github-oauth
```

Pull Request:
- Base: `main`
- Compare: `feature/jwt-auth-github-oauth`
- Checklist: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, dan `GET /auth/github` berjalan.

Merge:

```bash
git checkout main
git pull origin main
git merge --no-ff feature/jwt-auth-github-oauth
git push origin main
```

## PR 3 - feature/patient-codeigniter

Judul Pull Request: `feat: build codeigniter patient records and prescriptions`

Tujuan:
- Membuat Patient Service dengan CodeIgniter 4.
- Menggunakan `firebase/php-jwt`.
- Membuat tabel `patients`, `medical_records`, `medicines`, dan `prescriptions`.
- Menambahkan paging dan filtering pasien.
- Menambahkan rekam kunjungan dan e-resep.

Perintah:

```bash
git checkout main
git pull origin main
git checkout -b feature/patient-codeigniter

git add services/patient-service/composer.json services/patient-service/composer.lock services/patient-service/app services/patient-service/public services/patient-service/spark services/patient-service/.env.example
git commit -m "feat: setup patient-service with codeigniter 4 framework"

git add services/patient-service/schema.sql
git commit -m "feat: create migration for patients, records, and prescriptions"

git add services/patient-service/app/Controllers/Patient.php services/patient-service/app/Models/PatientModel.php
git commit -m "feat: implement patient list with paging and filtering"

git add services/patient-service/app/Controllers/MedicalRecord.php services/patient-service/app/Models/RecordModel.php services/patient-service/app/Controllers/Prescription.php services/patient-service/app/Models/PrescriptionModel.php services/patient-service/app/Models/MedicineModel.php
git commit -m "feat: implement input validation for medical records"

git push -u origin feature/patient-codeigniter
```

Pull Request:
- Base: `main`
- Compare: `feature/patient-codeigniter`
- Checklist: `GET /patients` mendukung `page`, `per_page`, `name`, `nik`; `POST /patients` validasi NIK; `GET /records/:id`; `POST /records`; `POST /prescriptions`.

Merge:

```bash
git checkout main
git pull origin main
git merge --no-ff feature/patient-codeigniter
git push origin main
```

## PR 4 - feature/appointment-reservation

Judul Pull Request: `feat: add doctor schedule and online reservation`

Tujuan:
- Membuat jadwal dokter.
- Membuat reservasi online.
- Membuat riwayat reservasi pasien.
- Menambahkan inter-service communication dari Appointment Service ke Patient Service.

Perintah:

```bash
git checkout main
git pull origin main
git checkout -b feature/appointment-reservation

git add services/appointment-service
git commit -m "feat: init appointment-service for doctor scheduling"

git add services/appointment-service/controllers/appointmentController.js services/appointment-service/models/appointmentModel.js services/appointment-service/package.json
git commit -m "feat: implement inter-service communication via axios"

git push -u origin feature/appointment-reservation
```

Pull Request:
- Base: `main`
- Compare: `feature/appointment-reservation`
- Checklist: `GET /doctors/schedule`, `POST /reservations`, `GET /reservations/me`, dan `PATCH /reservations/:id/status` berjalan.

Merge:

```bash
git checkout main
git pull origin main
git merge --no-ff feature/appointment-reservation
git push origin main
```

## PR 5 - docs/submission-readiness

Judul Pull Request: `docs: finalize uts documentation and submission tag`

Tujuan:
- Melengkapi README.
- Melengkapi dokumentasi arsitektur.
- Melengkapi Postman collection.
- Membuat tag final `submission-v1`.

Perintah:

```bash
git checkout main
git pull origin main
git checkout -b docs/submission-readiness

git add README.md docs postman
git commit -m "docs: add api documentation and architecture diagram"

git add .
git commit -m "feat: final configuration for submission-v1"

git push -u origin docs/submission-readiness
```

Pull Request:
- Base: `main`
- Compare: `docs/submission-readiness`
- Checklist: README berisi identitas, cara menjalankan, endpoint, OAuth callback, link demo jika sudah ada, dan Postman collection tersedia.

Merge dan tag:

```bash
git checkout main
git pull origin main
git merge --no-ff docs/submission-readiness
git tag submission-v1
git push origin main --tags
```

## Alternatif Membuat PR dengan GitHub CLI

Jika `gh` sudah login:

```bash
gh pr create --base main --head feature/gateway-baseline --title "feat: setup gateway routing and rate limiting" --body "Setup API Gateway, routing service, and rate limiting."
gh pr list
gh pr view
gh pr merge --merge
```
