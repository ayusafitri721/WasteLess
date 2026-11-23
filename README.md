# WasteLess

WasteLess mencatat makanan berlebih dari penyedia, mengelola reservasi oleh penerima, dan melacak serah terima sampai selesai. Repository ini berisi backend REST API (Node.js, Express, MongoDB) dan frontend Next.js sebagai konsumen API.

Tugas final project Study Club Backend Basic KSM Veterantech UPNVJ 2026 berfokus pada backend. README ini menjelaskan backend terlebih dahulu, lalu tautan ke bukti pengujian Postman di folder `postman/`.

## Teknologi dan dependencies

Backend:

| Paket | Versi | Fungsi |
|---|---|---|
| Node.js | >= 20 | Runtime server |
| express | ^5.3.0 | Routing dan HTTP handler |
| mongoose | ^9.12.1 | Model, validasi, dan query MongoDB |
| mongodb | via mongoose | Transaksi multi-dokumen |
| zod | ^4.6.7 | Validasi request |
| jsonwebtoken | ^9.0.3 | Token akses |
| bcryptjs | ^3.0.3 | Hash password dan kode pengambilan |
| helmet | ^8.3.0 | Header keamanan HTTP |
| cors | ^2.8.6 | Pembatasan origin |
| express-rate-limit | ^8.7.4 | Pembatasan percobaan login dan verifikasi |
| dotenv | ^18.0.10 | Memuat environment variable |
| swagger-ui-express, yaml | ^5.0.1, ^2.9.1 | Dokumentasi API interaktif |
| node:test, supertest, mongodb-memory-server, swagger-parser | bawaan / dev | Automated test |

Frontend (pendukung integrasi): `next` 16.4.6, `react` 19.3.0, `tailwindcss` 4.3.3, `typescript` ^5.

## Struktur backend

```
backend/
├── docs/openapi.yaml              spesifikasi API 3.0.3
├── scripts/
│   ├── create-admin.js            membuat akun admin
│   └── seed-demo.js               data contoh untuk demo lokal
├── src/
│   ├── config/                    env.js, database.js
│   ├── middlewares/               authenticate, authorize, validate, error-handler
│   ├── modules/                   auth, users, verifications, foods,
│   │                              reservations, distributions, analytics, activity-logs
│   ├── jobs/expiration.job.js     menandai listing kedaluwarsa
│   ├── utils/                     ApiError, transaction, schema validasi
│   ├── app.js                     konfigurasi Express dan mount route
│   └── server.js                  start server, koneksi DB, graceful shutdown
└── tests/                         8 file test API
```

Setiap modul memisahkan `route` (endpoint dan middleware), `controller` (response), `service` (aturan bisnis), `model` (schema MongoDB), dan `validation` (Zod).

## Instalasi dan menjalankan server

Prasyarat: Node.js 20 atau lebih baru, dan MongoDB yang mendukung transaksi.

```bash
cd backend
npm install
cp .env.example .env
```

Isi file `.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/wasteless?replicaSet=rs0
JWT_ACCESS_SECRET=ganti-dengan-rahasia-minimal-32-karakter
JWT_ACCESS_EXPIRES_IN=15m
CLIENT_ORIGIN=http://localhost:3000
EXPIRATION_JOB_INTERVAL_MS=60000
```

Siapkan replica set MongoDB. Semua operasi tulis memakai `session.withTransaction()`, sehingga server akan menolak transaksi jika MongoDB berjalan standalone.

```bash
mongod --replSet rs0 --dbpath /path/ke/db --port 27017
mongosh --eval "rs.initiate()"
```

Alternatif yang lebih praktis: pakai kluster gratis MongoDB Atlas, lalu salin connection string-nya ke `MONGODB_URI`.

Jalankan server:

```bash
npm run dev
```

Alamat yang tersedia:

- API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`
- Swagger UI: `http://localhost:5000/api/docs`
- OpenAPI JSON: `http://localhost:5000/api/docs.json`

Buat akun admin untuk memproses verifikasi:

```bash
ADMIN_EMAIL=admin@wasteless.local ADMIN_PASSWORD=rahasia123 npm run create-admin
```

Pada PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@wasteless.local"
$env:ADMIN_PASSWORD="rahasia123"
npm run create-admin
```

Jalankan automated test:

```bash
npm test
```

Test memakai `mongodb-memory-server`. Saat pertama kali dijalankan, dependensi ini mengunduh binary MongoDB, jadi koneksi internet diperlukan.

## Daftar endpoint API

Semua path diawali dengan `/api`.

### Autentikasi dan profil

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| POST | `/auth/register` | Membuat akun provider atau receiver | Publik |
| POST | `/auth/login` | Login dan mengembalikan token akses | Publik |
| POST | `/auth/forgot-password` | Membuat token reset password | Publik |
| POST | `/auth/reset-password` | Mengganti password memakai token reset | Publik |
| POST | `/auth/logout` | Mencabut token aktif lewat `tokenVersion` | Login |
| GET | `/auth/me` | Menampilkan profil akun aktif | Login |
| GET | `/users/me` | Melihat profil sendiri | Login |
| PATCH | `/users/me` | Memperbarui nama, telepon, nama organisasi, lokasi | Login |

### Lupa password

Halaman `/lupa-password` mengirim email akun ke `POST /auth/forgot-password`. Jika email terdaftar, server menyimpan hash token reset selama 15 menit. Respons selalu sukses dengan pesan yang sama supaya keberadaan email tidak bisa ditebak.

Pengiriman email memakai SMTP. Isi variabel berikut di `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nama@gmail.com
SMTP_PASS=app-password-dari-google
SMTP_SECURE=false
MAIL_FROM="WasteLess <nama@gmail.com>"
```

Untuk Gmail, aktifkan **2-Step Verification** lalu buat **App Password** di https://myaccount.google.com/apppasswords. Gunakan password 16 karakter itu sebagai `SMTP_PASS`, bukan password akun Gmail biasa. Untuk provider lain, sesuaikan host, port, dan `SMTP_SECURE` (`true` untuk port 465).

Cek koneksi dengan:

```bash
npm run test-email
```

Kirim ke alamat lain dengan `TEST_EMAIL_TO=penerima@example.com npm run test-email` (di PowerShell: `$env:TEST_EMAIL_TO="penerima@example.com"; npm run test-email`).

Jika SMTP belum diisi, token ditampilkan di `data.resetToken` dan halaman lupa password menyediakan tombol langsung ke `/reset-password?token=...`. **Setelah SMTP terisi, token tidak lagi dikembalikan di response** dan pengguna harus membuka email mereka. Gunakan mode tanpa SMTP ini untuk uji cepat:

1. Buka `http://localhost:3000/lupa-password`.
2. Masukkan email akun, klik **Kirim tautan reset**.
3. Di kotak **Mode pengembangan**, klik **Buka halaman ganti password**.
4. Isi password baru dan konfirmasinya, lalu klik **Simpan password baru**.
5. Anda diarahkan ke `/masuk` dengan notifikasi sukses dan bisa login memakai password baru.

Token hanya bisa dipakai sekali, kedaluwarsa setelah 15 menit, dan disimpan sebagai hash SHA-256 di database. Setelah password diganti, `tokenVersion` naik sehingga semua token lama otomatis tidak berlaku. Di mode production token tidak pernah dikembalikan di response, jadi SMTP wajib dikonfigurasi.

### Login sosial (Google dan GitHub)

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| GET | `/auth/oauth/:provider/start?role=provider\|receiver` | Memulai alur OAuth dan redirect ke provider | Publik |
| GET | `/auth/oauth/:provider/callback` | Callback provider, verifikasi state, buat kode sekali pakai | Publik |
| POST | `/auth/oauth/exchange` | Menukar kode sekali pakai dengan JWT | Publik |

`provider` bernilai `google` atau `github`. Role pada request start dipakai jika email belum terdaftar.

Tombol Google dan GitHub di halaman `/masuk` sudah aktif, tetapi memerlukan kredensial OAuth. Cara mengaktifkannya:

1. **Google** — buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials), buat OAuth client ID dengan tipe *Web application*. Tambahkan `http://localhost:5000/api/auth/oauth/google/callback` ke *Authorized redirect URIs*. Salin Client ID dan Client Secret.
2. **GitHub** — buka *Settings → Developer settings → OAuth Apps → New OAuth App*. Isi *Authorization callback URL* dengan `http://localhost:5000/api/auth/oauth/github/callback`. Salin Client ID dan buat Client Secret.
3. Isi `backend/.env`:

```env
GOOGLE_CLIENT_ID=client-id-dari-google
GOOGLE_CLIENT_SECRET=client-secret-dari-google
GITHUB_CLIENT_ID=client-id-dari-github
GITHUB_CLIENT_SECRET=client-secret-dari-github
OAUTH_BACKEND_ORIGIN=http://localhost:5000
```

4. Restart backend agar `env.js` membaca nilai baru.
5. Buka `http://localhost:3000/masuk`, pilih peran Penyedia atau Penerima, lalu klik Google atau GitHub.

Alur teknisnya: frontend mengarahkan ke `/api/auth/oauth/start`, backend membuat state bertanda tangan HMAC dan redirect ke provider. Setelah user menyetujui, provider memanggil callback backend. Backend memverifikasi state, menukar kode otorisasi, memastikan email terverifikasi, lalu membuat atau menghubungkan akun berdasarkan email. Token tidak dikirim lewat URL: backend membuat kode sekali pakai yang ditukar route callback frontend menjadi cookie `wasteless_token` httpOnly.

Jika kredensial belum diisi, tombol mengarahkan ke `/masuk?s=oauth_not_configured` dan pesan yang sesuai ditampilkan. Jika email sudah terdaftar lewat register email/password, peran dan status verifikasinya tetap dipertahankan; akun OAuth hanya dihubungkan.

### Verifikasi

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| POST | `/verifications` | Mengajukan verifikasi organisasi | Provider, receiver |
| GET | `/admin/verifications` | Daftar pengajuan, filter `?status=`, pagination | Admin |
| PATCH | `/admin/verifications/:id` | Menyetujui atau menolak pengajuan | Admin |

### Listing makanan

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| POST | `/foods` | Membuat listing makanan | Provider terverifikasi |
| GET | `/foods` | Mencari listing tersedia, `?q=&category=&page=&limit=` | Login |
| GET | `/foods/mine` | Listing milik sendiri, `?status=&category=&q=&page=&limit=` | Provider |
| GET | `/foods/:id` | Detail listing | Login, pemilik, admin |
| PATCH | `/foods/:id` | Mengubah listing | Provider pemilik |
| DELETE | `/foods/:id` | Menutup listing | Provider pemilik |

Kategori yang diterima: `makanan_matang`, `roti_dan_kue`, `buah_dan_sayur`, `makanan_kemasan`, `minuman`, `lainnya`.

### Reservasi

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| POST | `/reservations` | Membuat reservasi, stok dikurangi atomik | Receiver terverifikasi |
| GET | `/reservations/my` | Riwayat reservasi sendiri, `?status=&page=&limit=` | Login |
| GET | `/reservations/:id` | Detail reservasi | Pihak terkait, admin |
| PATCH | `/reservations/:id/approve` | Menyetujui dan menentukan jadwal ambil | Provider pemilik |
| PATCH | `/reservations/:id/reject` | Menolak reservasi, stok dikembalikan | Provider pemilik |
| PATCH | `/reservations/:id/cancel` | Membatalkan reservasi, stok dikembalikan | Receiver atau provider terkait |
| PATCH | `/reservations/:id/ready` | Menandai siap diambil dan membuat kode pickup | Provider pemilik |

### Distribusi

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| GET | `/distributions/history` | Riwayat distribusi, `?status=&page=&limit=` | Login |
| PATCH | `/distributions/:id/verify-pickup` | Memverifikasi kode pickup 6 digit | Provider terkait |
| PATCH | `/distributions/:id/complete` | Mengonfirmasi makanan sudah diterima | Receiver terkait |

### Analitik

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| GET | `/analytics/provider` | Ringkasan listing, reservasi, distribusi, dampak | Provider |
| GET | `/analytics/receiver` | Ringkasan reservasi, distribusi, dampak | Receiver |
| GET | `/analytics/platform` | Ringkasan seluruh platform | Admin |

### Dokumentasi dan health check

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| GET | `/health` | Status server dan koneksi database | Publik |
| GET | `/docs` | Swagger UI | Publik |
| GET | `/docs.json` | Spesifikasi OpenAPI dalam bentuk JSON | Publik |

## Format response

Sukses:

```json
{
  "success": true,
  "data": {
    "listing": { "id": "...", "name": "Nasi Kotak" }
  }
}
```

Gagal:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data permintaan tidak valid",
    "details": [{ "path": "quantity", "message": "Jumlah harus lebih dari 0" }]
  }
}
```

Status code yang dipakai: `200` (sukses), `201` (dibuat), `204` (tanpa body), `400` (JSON tidak valid), `401` (belum login), `403` (tidak punya akses), `404` (tidak ditemukan), `409` (konflik status atau data duplikat), `422` (validasi gagal), `429` (rate limit), `500` (error server).

## Alur status

- Listing: `available` -> `reserved` -> `completed`, atau `expired`, `cancelled`.
- Reservasi: `pending` -> `approved` -> `ready_for_pickup` -> `picked_up` -> `completed`. Cabang lain: `rejected`, `cancelled`, `expired`.
- Distribusi: `pickup_ready` -> `verified` -> `completed`, atau `failed`.

Stok dikurangi saat reservasi dibuat dan dikembalikan tepat satu kali saat reservasi ditolak, dibatalkan, atau kedaluwarsa. Kode pengambilan disimpan sebagai hash bcrypt dan hanya muncul sekali saat status siap diambil dibuat.

## Pengujian API dengan Postman

- `postman/README.md`: cara import collection dan urutan menjalankan request.
- `postman/WasteLess.postman_collection.json`: collection berisi seluruh alur API.
- `postman/WasteLess.postman_environment.json`: environment berisi base URL dan kredensial uji.
- `postman/hasil-pengujian.md`: template tabel bukti hasil pengujian yang perlu diisi.

## Catatan

- Jangan commit file `.env`. Gunakan `.env.example` sebagai contoh.
- `npm run seed-demo` hanya untuk data demo lokal. Script ini memerlukan akun yang sudah ada dan flag `SEED_VERIFY=1` atau `SEED_WORKFLOW=1`.
- Frontend menyimpan token di cookie `httpOnly` bernama `wasteless_token`, bukan di `localStorage`. Semua request data browser melewati route proxy Next.js.
- Spesifikasi lengkap ada di `WasteLess_Project_Blueprint.md`, arah visual ada di `DESIGN.md`.
