# Pengujian API WasteLess dengan Postman

Folder ini berisi collection dan environment untuk menguji seluruh endpoint WasteLess, serta template bukti hasil pengujian.

## Isi folder

| File | Kegunaan |
|---|---|
| `WasteLess.postman_collection.json` | 36 request yang dikelompokkan sesuai alur bisnis |
| `WasteLess.postman_environment.json` | Base URL dan kredensial uji |
| `hasil-pengujian.md` | Template tabel bukti hasil pengujian yang perlu diisi |

## Prasyarat

1. Server backend berjalan di `http://localhost:5000`.
2. MongoDB aktif sebagai replica set. Cek lewat `GET /api/health`, nilai `database` harus `connected`.
3. Akun admin sudah dibuat dengan `npm run create-admin`. Kredensialnya harus sama dengan `adminEmail` dan `adminPassword` di environment.
4. Koneksi internet tersedia saat pertama kali menjalankan automated test, bukan saat memakai Postman.

## Cara import

1. Buka Postman, klik **Import**.
2. Pilih `WasteLess.postman_collection.json` dan `WasteLess.postman_environment.json`.
3. Di pojok kanan atas, pilih environment **WasteLess Local**.
4. Jika backend berjalan di alamat lain, ubah nilai `baseUrl` di environment.

## Urutan menjalankan

Jalankan request dari atas ke bawah. Nomor di bawah sesuai dengan nama request di collection.

| Folder | Nomor | Tujuan |
|---|---|---|
| 01 Persiapan | 1 sampai 4 | Cek health, daftar akun provider dan receiver, login admin |
| 02 Verifikasi | 5 sampai 10 | Ajukan dan setujui verifikasi, lalu login provider |
| 03 Foods | 11 sampai 17 | CREATE, READ, UPDATE, DELETE listing, plus filter dan path parameter |
| 04 Reservasi | 18 sampai 24 | Login receiver, buat reservasi, setujui, tandai siap diambil |
| 05 Distribusi | 25 sampai 28 | Verifikasi kode, konfirmasi selesai, lihat riwayat |
| 06 Analitik | 29 sampai 32 | Ringkasan receiver, platform, dan spesifikasi OpenAPI |
| 07 Uji Error | 33 sampai 36 | Status 401, 404, 422, dan logout |

Token berpindah mengikuti request login. Setiap login menimpa variabel `token`, jadi jangan menjalankan request di luar urutan tanpa login ulang sesuai peran yang dibutuhkan.

## Variabel yang diisi otomatis

Collection menyimpan nilai ini lewat test script, jadi tidak perlu diisi manual:

- `token`, token aktif hasil login terakhir.
- `demoListingId`, id listing untuk uji CRUD.
- `listingId`, id listing untuk alur reservasi.
- `reservationId`, id reservasi hasil request 19.
- `distributionId` dan `pickupCode`, hasil request 24.
- `verificationProviderId` dan `verificationReceiverId`, hasil request 7.
- `productionDate`, `pickupDeadline`, `approveSchedule`, tanggal yang dihitung saat request dijalankan.

## Yang perlu dicatat saat demonstrasi

- Request 1 harus mengembalikan `database: connected`. Jika tidak, cek konfigurasi replica set MongoDB.
- Request 2 dan 3 akan mengembalikan `409` jika email sudah terdaftar dari percobaan sebelumnya. Ini masih dianggap sukses oleh test script. Ganti email di environment jika ingin alur bersih dari awal.
- Kode pickup hanya muncul sekali di response request 24. Salin nilainya sebelum menjalankan request lain.
- Request 33 sampai 35 sengaja menguji kegagalan. Status `401`, `404`, dan `422` adalah hasil yang benar.
- Jalankan request 36 paling akhir karena logout mencabut token aktif.

## Bukti pengujian

Isi tabel di `hasil-pengujian.md` dengan status code aktual hasil percobaan Anda. Simpan screenshot Postman di folder `postman/bukti/` lalu sebutkan nama filenya di kolom bukti.
