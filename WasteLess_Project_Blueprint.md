# WasteLess --- Project Blueprint

> **Status:** Draft spesifikasi dan panduan implementasi\
> **Jenis aplikasi:** Fullstack web application\
> **Fokus utama:** Backend engineering\
> **Backend:** Node.js, Express.js, MongoDB, Mongoose\
> **Frontend:** Next.js\
> **API style:** REST API\
> **Bahasa dokumentasi:** Indonesia

------------------------------------------------------------------------

## 1. Ringkasan Proyek

WasteLess adalah platform untuk membantu menghubungkan penyedia makanan
berlebih dengan organisasi atau komunitas penerima yang dapat
menyalurkannya. Penyedia dapat berupa UMKM kuliner, toko roti, restoran,
katering, atau penyelenggara acara. Penerima dapat berupa yayasan,
komunitas sosial, atau organisasi yang telah diverifikasi.

Masalah yang ingin ditangani bukan hanya makanan berlebih, tetapi juga
kesenjangan informasi dan koordinasi: penyedia belum tentu mengetahui
pihak yang membutuhkan, sementara penerima belum tentu mengetahui
ketersediaan makanan yang masih layak dibagikan.

WasteLess menyediakan alur pencatatan, pencarian, reservasi,
persetujuan, pengambilan, dan pelacakan distribusi makanan.

### Prinsip implementasi

WasteLess harus dibangun sebagai aplikasi yang benar-benar berfungsi,
bukan prototipe visual.

1.  Data aplikasi berasal dari input pengguna atau proses bisnis yang
    sah.
2.  Data operasional disimpan dan dibaca dari MongoDB melalui backend.
3.  Frontend tidak menyimpan salinan data statis untuk berpura-pura
    menjadi hasil API.
4.  Setiap aksi penting harus melewati validasi dan otorisasi backend.
5.  Jika layanan gagal, aplikasi menampilkan error atau keadaan kosong
    yang sebenarnya.
6.  Data seed hanya boleh digunakan untuk pengembangan lokal atau
    automated testing, harus diberi penanda jelas, dan tidak boleh
    tercampur dengan data produksi.

------------------------------------------------------------------------

## 2. Tujuan Produk

-   Memudahkan penyedia mengumumkan ketersediaan makanan berlebih.
-   Membantu penerima menemukan makanan berdasarkan lokasi, kategori,
    dan batas waktu pengambilan.
-   Mengelola reservasi agar jumlah makanan tidak dipesan melebihi stok.
-   Mencatat status distribusi dari pengajuan hingga selesai.
-   Menyediakan riwayat dan laporan dampak berdasarkan transaksi yang
    benar-benar tercatat.

### Di luar cakupan MVP

-   Prediksi permintaan menggunakan machine learning.
-   Dynamic pricing.
-   Pembayaran online.
-   Integrasi otomatis dengan sistem kasir pihak ketiga.
-   Klaim bahwa semua makanan yang terdaftar pasti aman dikonsumsi.

Fitur tersebut dapat dipertimbangkan setelah alur inti stabil dan data
operasional sudah tersedia.

------------------------------------------------------------------------

## 3. Peran Pengguna dan Hak Akses

### 3.1 Food Provider

Penyedia makanan, misalnya UMKM atau restoran.

Hak akses: - Mendaftar dan mengelola profil. - Mengajukan verifikasi
akun penyedia. - Membuat, mengubah, dan menutup listing makanan
miliknya. - Melihat reservasi atas listing miliknya. - Menyetujui atau
menolak permintaan reservasi. - Mengonfirmasi kesiapan pengambilan. -
Melihat riwayat distribusi dan ringkasan aktivitas miliknya.

### 3.2 Food Receiver

Penerima makanan, misalnya yayasan atau komunitas.

Hak akses: - Mendaftar dan mengelola profil organisasi. - Mengajukan
verifikasi organisasi. - Melihat listing yang tersedia. - Mencari
listing berdasarkan kategori, lokasi, dan waktu. - Mengajukan
reservasi. - Membatalkan reservasi sesuai aturan status. - Melihat
jadwal pengambilan dan riwayat penerimaan.

### 3.3 Administrator

Pengelola platform.

Hak akses: - Melihat dan memproses pengajuan verifikasi. - Meninjau akun
dan listing yang dilaporkan. - Mengelola kategori dan konfigurasi
platform. - Melihat ringkasan aktivitas dan laporan. - Melihat audit log
untuk aktivitas penting.

Administrator tidak boleh mengubah riwayat transaksi secara diam-diam.
Perubahan administratif yang memengaruhi data operasional harus
tercatat.

------------------------------------------------------------------------

## 4. Alur Bisnis Utama

### 4.1 Registrasi dan verifikasi

1.  Pengguna mengirim data registrasi.
2.  Backend memvalidasi format dan keunikan email.
3.  Password di-hash sebelum disimpan.
4.  Pengguna memilih tipe akun sesuai perannya.
5.  Akun dibuat dengan status verifikasi yang sesuai.
6.  Untuk peran yang memerlukan verifikasi organisasi, pengguna mengirim
    informasi atau dokumen pendukung.
7.  Administrator memproses pengajuan.
8.  Backend mencatat keputusan dan waktu pemrosesan.

Status verifikasi yang disarankan: - `unverified` - `pending` -
`verified` - `rejected`

### 4.2 Pembuatan listing makanan

Penyedia mengisi: - Nama makanan. - Deskripsi. - Kategori. - Jumlah
tersedia dan satuan. - Waktu produksi atau persiapan. - Batas konsumsi
atau tanggal kedaluwarsa, jika relevan. - Batas waktu pengambilan. -
Informasi alergen. - Kondisi penyimpanan. - Lokasi pengambilan. - Foto
asli makanan, jika fitur unggah sudah tersedia.

Backend memvalidasi data, memastikan akun memiliki hak untuk membuat
listing, lalu menyimpan listing ke MongoDB.

Listing tidak boleh otomatis dianggap aman hanya karena berhasil dibuat.
Informasi keamanan pangan harus ditampilkan berdasarkan data yang diisi
penyedia dan kebijakan platform.

### 4.3 Pencarian makanan

Penerima dapat mencari listing berdasarkan: - Status ketersediaan. -
Kategori. - Jarak dari lokasi penerima. - Batas waktu pengambilan. -
Kata kunci.

Hasil pencarian harus berasal dari query database, bukan array statis di
frontend.

### 4.4 Reservasi

1.  Penerima memilih listing dan jumlah yang diminta.
2.  Backend memeriksa status listing, batas waktu, hak akses, dan jumlah
    tersedia.
3.  Backend mengurangi stok secara aman.
4.  Backend membuat reservasi dengan status `pending`.
5.  Penyedia menerima permintaan.
6.  Penyedia menyetujui atau menolak.
7.  Jika ditolak atau dibatalkan sesuai aturan, stok dikembalikan secara
    konsisten.
8.  Jika disetujui, jadwal pengambilan dapat ditentukan.

**Penting:** Pengurangan stok harus aman terhadap permintaan bersamaan.
Jangan melakukan pola read-then-write sederhana yang memungkinkan dua
permintaan mengambil stok terakhir secara bersamaan.

### 4.5 Pengambilan dan penyelesaian distribusi

1.  Reservasi yang disetujui memiliki jadwal atau instruksi pengambilan.
2.  Backend membuat catatan distribusi.
3.  Pengambilan diverifikasi melalui mekanisme yang ditetapkan, misalnya
    kode sekali pakai.
4.  Pihak terkait mengonfirmasi serah terima.
5.  Distribusi ditandai selesai.
6.  Riwayat dan metrik dampak diperbarui berdasarkan catatan distribusi
    yang valid.

------------------------------------------------------------------------

## 5. Aturan Status

Status listing: - `draft` - `available` - `reserved` - `completed` -
`expired` - `cancelled`

Status reservasi: - `pending` - `approved` - `rejected` - `cancelled` -
`ready_for_pickup` - `picked_up` - `completed` - `expired`

Status distribusi: - `pending` - `pickup_ready` - `verified` -
`completed` - `failed`

Perubahan status harus melalui service backend yang memeriksa status
sebelumnya, aktor yang melakukan aksi, dan aturan transisi. Hindari
endpoint generik yang membolehkan klien mengirim status apa pun.

Contoh aturan: - Hanya penyedia pemilik listing yang dapat menyetujui
atau menolak reservasi. - Penerima hanya dapat membatalkan reservasi
miliknya dan hanya pada status yang diizinkan. - Reservasi yang sudah
selesai tidak dapat dibatalkan. - Listing kedaluwarsa tidak dapat
menerima reservasi baru. - Distribusi hanya dapat diselesaikan setelah
syarat verifikasi pengambilan terpenuhi.

------------------------------------------------------------------------

## 6. Kebutuhan Fungsional

  ID      Kebutuhan                                        Prioritas
  ------- ------------------------------------------------ -----------
  FR-01   Registrasi dan login pengguna                    MVP
  FR-02   Autentikasi token dan endpoint profil pengguna   MVP
  FR-03   Otorisasi berbasis peran                         MVP
  FR-04   Pengajuan dan pemrosesan verifikasi akun         MVP
  FR-05   CRUD listing makanan dengan kepemilikan data     MVP
  FR-06   Pencarian dan filter listing                     MVP
  FR-07   Reservasi dengan pengendalian stok yang aman     MVP
  FR-08   Persetujuan dan penolakan reservasi              MVP
  FR-09   Pencatatan dan konfirmasi distribusi             MVP
  FR-10   Riwayat listing, reservasi, dan distribusi       MVP
  FR-11   Log aktivitas penting                            MVP
  FR-12   Pencarian berdasarkan jarak dengan GeoJSON       Tahap 2
  FR-13   Notifikasi real-time                             Tahap 2
  FR-14   Pekerjaan terjadwal untuk kedaluwarsa listing    Tahap 2
  FR-15   Analitik berbasis transaksi aktual               Tahap 2

------------------------------------------------------------------------

## 7. Kebutuhan Nonfungsional

### Keamanan

-   Password disimpan menggunakan algoritma hashing yang sesuai.
-   Endpoint privat memerlukan autentikasi.
-   Otorisasi diperiksa di backend, bukan hanya dengan menyembunyikan
    tombol frontend.
-   Validasi input dilakukan di server.
-   Batasi percobaan login dan endpoint sensitif.
-   Gunakan konfigurasi CORS yang spesifik.
-   Rahasia aplikasi disimpan melalui environment variables.
-   Jangan mengirim password hash, token rahasia, atau data sensitif ke
    klien.
-   Terapkan prinsip least privilege untuk akses database.

### Konsistensi data

-   Operasi stok harus atomik.
-   Operasi multi-dokumen yang harus berhasil bersama perlu menggunakan
    transaksi MongoDB bila deployment mendukungnya.
-   Operasi pembatalan atau penolakan harus mengembalikan stok tepat
    satu kali.
-   Terapkan idempotency atau mekanisme pencegah pemrosesan ganda pada
    aksi yang berisiko diulang.

### Keandalan

-   Error API memiliki format konsisten.
-   Log server tidak membocorkan rahasia.
-   Endpoint penting memiliki automated tests.
-   Koneksi database dan kegagalan dependency ditangani secara
    eksplisit.

### Kinerja

-   Gunakan pagination untuk daftar data.
-   Tambahkan index berdasarkan pola query nyata.
-   Hindari mengambil seluruh koleksi untuk kebutuhan dashboard.
-   Gunakan aggregation pipeline untuk perhitungan ringkasan yang
    relevan.

------------------------------------------------------------------------

## 8. Rancangan Database MongoDB

Skema berikut adalah rancangan awal. Field final harus disesuaikan
dengan validasi, kebutuhan query, dan aturan bisnis saat implementasi.

### 8.1 `users`

Field inti: - `_id` - `name` - `email` --- unique index -
`passwordHash` - `role` --- `provider`, `receiver`, `admin` - `phone` -
`organizationName` - `verificationStatus` - `location` --- GeoJSON
Point, bila lokasi sudah diaktifkan - `createdAt` - `updatedAt`

### 8.2 `foodListings`

Field inti: - `_id` - `providerId` --- referensi `users` - `name` -
`description` - `category` - `quantity` - `availableQuantity` - `unit` -
`productionDate` - `expiryDate` - `pickupDeadline` - `allergens` -
`storageInstructions` - `pickupAddress` - `location` --- GeoJSON Point -
`status` - `createdAt` - `updatedAt`

### 8.3 `reservations`

Field inti: - `_id` - `listingId` - `providerId` - `receiverId` -
`quantity` - `status` - `pickupSchedule` - `approvedAt` -
`cancelledAt` - `createdAt` - `updatedAt`

### 8.4 `distributions`

Field inti: - `_id` - `reservationId` - `listingId` - `providerId` -
`receiverId` - `quantity` - `pickupVerification` --- simpan hash kode
bila memakai kode verifikasi - `verifiedAt` - `completedAt` - `status` -
`createdAt` - `updatedAt`

### 8.5 `notifications`

Field inti: - `_id` - `userId` - `type` - `title` - `message` -
`readAt` - `relatedResource` - `createdAt`

### 8.6 `activityLogs`

Field inti: - `_id` - `actorId` - `action` - `resourceType` -
`resourceId` - `metadata` --- hindari menyimpan rahasia atau data
sensitif - `createdAt`

### Index yang perlu dipertimbangkan

-   `users.email` unique.
-   `foodListings.providerId`.
-   `foodListings.status`, `foodListings.category`, dan
    `foodListings.pickupDeadline` sesuai query.
-   `foodListings.location` dengan `2dsphere` jika pencarian radius
    digunakan.
-   `reservations.providerId`, `reservations.receiverId`, dan
    `reservations.listingId`.
-   `distributions.reservationId`.
-   `notifications.userId` dan `notifications.readAt`.

Jangan menambahkan index tanpa memahami pola query. Periksa query plan
ketika data dan beban meningkat.

------------------------------------------------------------------------

## 9. Rancangan REST API

Prefix: `/api`

### Auth

  --------------------------------------------------------------------------
  Method            Endpoint           Fungsi              Akses
  ----------------- ------------------ ------------------- -----------------
  POST              `/auth/register`   Membuat akun        Publik

  POST              `/auth/login`      Login               Publik

  POST              `/auth/logout`     Logout/invalidate   Login
                                       sesi sesuai         
                                       strategi token      

  GET               `/auth/me`         Profil pengguna     Login
                                       aktif               
  --------------------------------------------------------------------------

### Users dan verifikasi

  Method   Endpoint                     Fungsi                  Akses
  -------- ---------------------------- ----------------------- -------------------
  GET      `/users/me`                  Melihat profil          Login
  PATCH    `/users/me`                  Memperbarui profil      Login
  POST     `/verifications`             Mengajukan verifikasi   Provider/Receiver
  GET      `/admin/verifications`       Melihat pengajuan       Admin
  PATCH    `/admin/verifications/:id`   Memproses pengajuan     Admin

### Food listings

  -------------------------------------------------------------------------
  Method            Endpoint          Fungsi              Akses
  ----------------- ----------------- ------------------- -----------------
  POST              `/foods`          Membuat listing     Provider
                                                          terverifikasi

  GET               `/foods`          Mencari listing     Login

  GET               `/foods/:id`      Detail listing      Login

  PATCH             `/foods/:id`      Mengubah listing    Pemilik
                                      milik sendiri       

  DELETE            `/foods/:id`      Menutup/menghapus   Pemilik
                                      listing sesuai      
                                      aturan              

  GET               `/foods/nearby`   Pencarian           Login, tahap 2
                                      berdasarkan radius  
  -------------------------------------------------------------------------

### Reservations

  Method   Endpoint                      Fungsi                       Akses
  -------- ----------------------------- ---------------------------- ------------------------
  POST     `/reservations`               Membuat reservasi            Receiver terverifikasi
  GET      `/reservations/my`            Riwayat reservasi pengguna   Login
  GET      `/reservations/:id`           Detail reservasi             Pihak terkait
  PATCH    `/reservations/:id/approve`   Menyetujui                   Provider pemilik
  PATCH    `/reservations/:id/reject`    Menolak                      Provider pemilik
  PATCH    `/reservations/:id/cancel`    Membatalkan                  Pihak yang berhak

### Distributions

  ------------------------------------------------------------------------------------------
  Method            Endpoint                             Fungsi            Akses
  ----------------- ------------------------------------ ----------------- -----------------
  POST              `/distributions/:id/verify-pickup`   Memverifikasi     Pihak terkait
                                                         pengambilan       sesuai aturan

  PATCH             `/distributions/:id/complete`        Menyelesaikan     Pihak yang berhak
                                                         distribusi        

  GET               `/distributions/history`             Riwayat           Pihak terkait
                                                         distribusi        
  ------------------------------------------------------------------------------------------

### Analytics

  -----------------------------------------------------------------------------
  Method            Endpoint                Fungsi            Akses
  ----------------- ----------------------- ----------------- -----------------
  GET               `/analytics/provider`   Ringkasan         Provider
                                            aktivitas         
                                            penyedia          

  GET               `/analytics/receiver`   Ringkasan         Receiver
                                            penerimaan        

  GET               `/analytics/platform`   Ringkasan         Admin
                                            platform          
  -----------------------------------------------------------------------------

Semua endpoint harus memiliki request validation,
authentication/authorization yang sesuai, response schema yang
konsisten, dan pengujian.

------------------------------------------------------------------------

## 10. Aturan Teknis Backend Penting

### 10.1 Atomic stock reservation

Jangan melakukan: 1. Membaca stok. 2. Memeriksa stok di aplikasi. 3.
Mengurangi stok melalui update terpisah.

Pola tersebut rentan race condition.

Gunakan conditional atomic update pada dokumen listing, dengan syarat
stok masih mencukupi dan listing masih tersedia. Jika update tidak
menemukan dokumen yang memenuhi syarat, reservasi harus ditolak.

Contoh konsep operasi MongoDB:

``` js
const updatedListing = await FoodListing.findOneAndUpdate(
  {
    _id: listingId,
    status: "available",
    availableQuantity: { $gte: requestedQuantity },
    pickupDeadline: { $gt: new Date() }
  },
  {
    $inc: { availableQuantity: -requestedQuantity }
  },
  { new: true }
);
```

Kode ini hanya ilustrasi operasi atomik pada listing. Pembuatan
reservasi dan penanganan kegagalan lintas dokumen harus dirancang dengan
transaksi atau strategi konsistensi yang tepat.

### 10.2 Pengembalian stok

Ketika reservasi ditolak atau dibatalkan: - Pastikan transisi status
memang diizinkan. - Pastikan stok belum pernah dikembalikan untuk
reservasi tersebut. - Kembalikan stok satu kali. - Catat perubahan
status dan aktivitas. - Gunakan transaksi atau mekanisme idempotensi
agar retry tidak menggandakan stok.

### 10.3 State transition

Buat service khusus untuk transisi status. Controller tidak boleh
menjadi tempat seluruh aturan bisnis ditumpuk.

### 10.4 GeoJSON

Untuk pencarian lokasi, simpan koordinat dalam format GeoJSON Point
dengan urutan `[longitude, latitude]`, lalu gunakan index `2dsphere`.
Validasi rentang koordinat sebelum disimpan.

### 10.5 Expiration job

Pekerjaan terjadwal dapat menandai listing kedaluwarsa setelah melewati
batas waktu. Proses harus idempotent dan tidak boleh mengubah listing
yang sudah selesai atau dibatalkan.

------------------------------------------------------------------------

## 11. Arsitektur Backend

Struktur awal yang disarankan:

``` text
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.model.js
│   │   │   ├── auth.route.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   ├── users/
│   │   ├── verifications/
│   │   ├── foods/
│   │   ├── reservations/
│   │   ├── distributions/
│   │   ├── notifications/
│   │   └── analytics/
│   ├── middlewares/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── validate.js
│   │   └── error-handler.js
│   ├── jobs/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── tests/
├── .env.example
├── package.json
└── README.md
```

Pemisahan tanggung jawab: - **Route:** mendefinisikan endpoint dan
middleware. - **Controller:** menerima request dan membentuk response. -
**Service:** menjalankan aturan bisnis. - **Model:** mendefinisikan
schema dan index database. - **Validation:** memvalidasi input. -
**Middleware:** autentikasi, otorisasi, dan penanganan lintas endpoint.

------------------------------------------------------------------------

## 12. Frontend dan Integrasi API

Frontend menggunakan Next.js, tetapi tidak boleh menjadi sumber
kebenaran data bisnis.

Ketentuan: - Gunakan base URL backend dari environment variable. - Semua
data listing, profil, reservasi, dan riwayat diambil dari API. - Semua
perubahan data dikirim ke API. - Tampilkan loading, empty state,
success, dan error berdasarkan respons nyata. - Jangan menanam daftar
makanan, pengguna, reservasi, statistik, atau notifikasi palsu di source
code aplikasi. - Jangan membuat fallback yang mengembalikan data statis
ketika API gagal. - Jangan menyimpan token atau data sensitif secara
tidak aman. - Komponen UI tidak boleh menentukan sendiri apakah pengguna
berhak melakukan aksi; backend tetap memvalidasi hak akses.

Jika API belum dibuat, halaman terkait sebaiknya menampilkan keadaan
belum tersedia atau error koneksi, bukan mengarang hasil.

------------------------------------------------------------------------

## 13. Konfigurasi Environment

Contoh `.env.example`:

``` env
NODE_ENV=development
PORT=5000
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
CLIENT_ORIGIN=http://localhost:3000
```

Isi nilai rahasia hanya pada `.env` lokal atau secret manager
deployment. Jangan commit `.env` ke Git.

Tambahkan validasi environment saat server dijalankan. Jika konfigurasi
wajib tidak tersedia, server harus gagal dengan pesan yang jelas, bukan
berjalan dalam keadaan setengah aktif.

------------------------------------------------------------------------

## 14. Strategi Pengujian

Pengujian harus memverifikasi perilaku backend, bukan hanya memastikan
endpoint merespons status sukses.

### Unit tests

-   Validasi input listing.
-   Aturan transisi status.
-   Perhitungan jumlah stok.
-   Aturan otorisasi.

### Integration tests

-   Registrasi dan login.
-   Provider membuat listing.
-   Receiver membuat reservasi.
-   Provider menyetujui atau menolak.
-   Pembatalan mengembalikan stok tepat satu kali.
-   Pengguna tidak dapat mengakses resource milik pengguna lain.
-   Listing kedaluwarsa tidak dapat dipesan.

### Concurrency tests

-   Dua permintaan reservasi bersamaan tidak boleh menyebabkan stok
    negatif.
-   Reservasi yang sama tidak boleh diproses dua kali.
-   Retry request tidak boleh menggandakan perubahan stok.

### Data testing

-   Gunakan database testing terpisah.
-   Seed data hanya untuk test dan development.
-   Bersihkan data test secara terkontrol.
-   Jangan menggunakan data testing sebagai isi dashboard atau
    demonstrasi produksi.

------------------------------------------------------------------------

## 15. Roadmap Pengembangan

### Tahap 1 --- Fondasi

-   Inisialisasi repository dan backend.
-   Konfigurasi Express dan koneksi MongoDB.
-   Validasi environment.
-   Registrasi, login, hashing password.
-   Middleware autentikasi dan role authorization.
-   Test dasar auth.

**Kriteria selesai:** akun dapat dibuat dan login; endpoint privat
terlindungi; data pengguna benar-benar tersimpan di MongoDB.

### Tahap 2 --- Food listing

-   Model dan validasi listing.
-   CRUD listing.
-   Pembatasan kepemilikan listing.
-   Pagination dan filter.
-   Test akses dan validasi.

**Kriteria selesai:** provider dapat mengelola listing miliknya dan
receiver dapat membaca listing yang tersedia dari database.

### Tahap 3 --- Reservation engine

-   Model reservasi.
-   Atomic stock update.
-   Persetujuan, penolakan, dan pembatalan.
-   Pengembalian stok yang idempotent.
-   Transaksi MongoDB jika diperlukan.
-   Concurrency tests.

**Kriteria selesai:** stok tidak pernah menjadi negatif dan tidak
berubah ganda akibat retry atau aksi berulang.

### Tahap 4 --- Distribution tracking

-   Model distribusi.
-   Verifikasi pengambilan.
-   Konfirmasi penyelesaian.
-   Riwayat berdasarkan transaksi nyata.
-   Audit log.

**Kriteria selesai:** setiap distribusi memiliki keterkaitan yang dapat
ditelusuri ke reservasi dan listing.

### Tahap 5 --- Fitur lanjutan

-   Geospatial search.
-   Notifikasi.
-   Expiration jobs.
-   Analytics aggregation.
-   Dokumentasi OpenAPI/Swagger.
-   Deployment dan monitoring.

**Kriteria selesai:** fitur lanjutan memakai data operasional yang valid
dan memiliki pengujian.

### Tahap 6 --- Frontend integration

-   Integrasi autentikasi.
-   Dashboard berdasarkan peran.
-   Form listing dan pencarian.
-   Alur reservasi dan distribusi.
-   Penanganan loading/error/empty state.
-   End-to-end tests.

**Kriteria selesai:** alur utama dapat dilakukan melalui UI dan setiap
perubahan tersimpan melalui API backend.

------------------------------------------------------------------------

## 16. Definisi MVP Selesai

MVP belum dianggap selesai hanya karena halaman frontend sudah terlihat
bagus.

MVP dinyatakan selesai jika: - \[ \] Registrasi dan login berfungsi
dengan database nyata. - \[ \] Role dan otorisasi diperiksa di
backend. - \[ \] Provider dapat membuat dan mengelola listing. - \[ \]
Receiver dapat melihat listing dari database. - \[ \] Receiver dapat
mengajukan reservasi. - \[ \] Stok dikelola secara atomik. - \[ \]
Provider dapat menyetujui atau menolak reservasi. - \[ \]
Pembatalan/penolakan mengembalikan stok dengan benar. - \[ \] Distribusi
dapat diverifikasi dan diselesaikan. - \[ \] Riwayat menampilkan data
transaksi nyata. - \[ \] Endpoint penting memiliki automated tests. - \[
\] Tidak ada dummy data operasional di frontend. - \[ \] Dokumentasi API
tersedia. - \[ \] Error API ditangani tanpa fallback data palsu.

------------------------------------------------------------------------

## 17. Prinsip Anti-Dummy Data

Aturan ini berlaku untuk seluruh pengembangan WasteLess:

1.  Jangan membuat array statis berisi makanan untuk mengisi halaman.
2.  Jangan membuat statistik dashboard dengan angka hardcoded.
3.  Jangan membuat akun provider atau receiver palsu yang terlihat
    seperti pengguna sungguhan.
4.  Jangan membuat reservasi palsu agar alur demo terlihat berjalan.
5.  Jangan membuat API yang hanya mengembalikan JSON tetap tanpa proses
    bisnis dan database.
6.  Jangan menganggap data berhasil disimpan sebelum database
    mengonfirmasi operasi.
7.  Jangan menyembunyikan kegagalan API dengan data cadangan palsu.
8.  Data seed hanya untuk environment development/testing dan harus
    diberi dokumentasi yang jelas.
9.  Untuk demo, gunakan data yang dimasukkan melalui proses aplikasi
    atau data uji yang secara eksplisit diberi label sebagai data uji.
10. Jika fitur belum terhubung, tandai sebagai belum tersedia; jangan
    berpura-pura fitur sudah berfungsi.

------------------------------------------------------------------------

## 18. Keputusan yang Harus Ditetapkan Sebelum Implementasi

Beberapa keputusan berikut perlu ditentukan sebelum coding agar desain
backend tidak berubah-ubah:

-   Apakah penerima wajib diverifikasi sebelum dapat membuat reservasi?
-   Apakah penyedia boleh mengedit listing setelah ada reservasi?
-   Bagaimana kebijakan pembatalan setelah reservasi disetujui?
-   Apakah satu listing dapat memiliki banyak reservasi?
-   Bagaimana proses konfirmasi serah terima: dua pihak, kode sekali
    pakai, atau keduanya?
-   Informasi keamanan pangan minimum apa yang wajib diisi?
-   Apakah lokasi yang disimpan berupa titik pengambilan atau alamat
    teks saja?
-   Apakah autentikasi menggunakan access token saja atau access dan
    refresh token?
-   Apakah deployment MongoDB mendukung transaksi multi-dokumen?

Keputusan ini harus dicatat dan diterapkan konsisten pada API, model,
UI, serta automated tests.

------------------------------------------------------------------------

## 19. Urutan Implementasi yang Direkomendasikan

Mulai dari backend dan bangun secara vertikal:

1.  Siapkan repository, Express, MongoDB, environment validation, dan
    error handler.
2.  Selesaikan auth, user model, dan role authorization.
3.  Selesaikan verifikasi akun.
4.  Selesaikan food listing dan validasinya.
5.  Selesaikan reservation engine beserta atomic stock management.
6.  Selesaikan distribution tracking.
7.  Tambahkan audit log dan analytics.
8.  Dokumentasikan API dan lengkapi automated tests.
9.  Integrasikan Next.js setelah kontrak API stabil.
10. Tambahkan geospatial, jobs, dan notifikasi setelah MVP teruji.

**Prioritas utama WasteLess adalah konsistensi transaksi dan aturan
bisnis backend.** Fitur yang lebih canggih tidak boleh mengorbankan
kebenaran data.
