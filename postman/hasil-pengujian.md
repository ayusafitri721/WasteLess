# Bukti Pengujian API WasteLess

Isi kolom **Status Aktual**, **Hasil**, dan **Bukti** dengan hasil percobaan Anda di Postman. Kolom yang masih berisi `[isi]` adalah tempat yang belum diisi. Simpan screenshot di folder `postman/bukti/` dan tuliskan nama filenya di kolom bukti.

Tanggal pengujian: `[isi]`
Nama penguji: `[isi]`
Base URL yang dipakai: `http://localhost:5000/api`

## Hasil per request

| No | Endpoint | Method | Status Diharapkan | Status Aktual | Hasil | Bukti |
|---|---|---|---|---|---|---|
| 1 | `/health` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 2 | `/auth/register` provider | POST | 201 atau 409 | `[isi]` | `[isi]` | `[isi]` |
| 3 | `/auth/register` receiver | POST | 201 atau 409 | `[isi]` | `[isi]` | `[isi]` |
| 4 | `/auth/login` admin | POST | 200 | `[isi]` | `[isi]` | `[isi]` |
| 5 | `/verifications` provider | POST | 201 atau 409 | `[isi]` | `[isi]` | `[isi]` |
| 6 | `/verifications` receiver | POST | 201 atau 409 | `[isi]` | `[isi]` | `[isi]` |
| 7 | `/admin/verifications?status=pending` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 8 | `/admin/verifications/:id` provider | PATCH | 200 | `[isi]` | `[isi]` | `[isi]` |
| 9 | `/admin/verifications/:id` receiver | PATCH | 200 | `[isi]` | `[isi]` | `[isi]` |
| 10 | `/auth/login` provider | POST | 200 | `[isi]` | `[isi]` | `[isi]` |
| 11 | `/foods` | POST | 201 | `[isi]` | `[isi]` | `[isi]` |
| 12 | `/foods?category=makanan_matang&q=nasi` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 13 | `/foods/:id` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 14 | `/foods/:id` | PATCH | 200 | `[isi]` | `[isi]` | `[isi]` |
| 15 | `/foods/mine?status=available` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 16 | `/foods/:id` | DELETE | 200 | `[isi]` | `[isi]` | `[isi]` |
| 17 | `/foods` untuk reservasi | POST | 201 | `[isi]` | `[isi]` | `[isi]` |
| 18 | `/auth/login` receiver | POST | 200 | `[isi]` | `[isi]` | `[isi]` |
| 19 | `/reservations` | POST | 201 | `[isi]` | `[isi]` | `[isi]` |
| 20 | `/auth/login` provider | POST | 200 | `[isi]` | `[isi]` | `[isi]` |
| 21 | `/reservations/my?status=pending` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 22 | `/reservations/:id` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 23 | `/reservations/:id/approve` | PATCH | 200 | `[isi]` | `[isi]` | `[isi]` |
| 24 | `/reservations/:id/ready` | PATCH | 200 | `[isi]` | `[isi]` | `[isi]` |
| 25 | `/distributions/:id/verify-pickup` | PATCH | 200 | `[isi]` | `[isi]` | `[isi]` |
| 26 | `/auth/login` receiver | POST | 200 | `[isi]` | `[isi]` | `[isi]` |
| 27 | `/distributions/:id/complete` | PATCH | 200 | `[isi]` | `[isi]` | `[isi]` |
| 28 | `/distributions/history?status=completed` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 29 | `/analytics/receiver` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 30 | `/auth/login` admin | POST | 200 | `[isi]` | `[isi]` | `[isi]` |
| 31 | `/analytics/platform` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 32 | `/docs.json` | GET | 200 | `[isi]` | `[isi]` | `[isi]` |
| 33 | `/foods` tanpa token | GET | 401 | `[isi]` | `[isi]` | `[isi]` |
| 34 | `/foods/000000000000000000000000` | GET | 404 | `[isi]` | `[isi]` | `[isi]` |
| 35 | `/foods?category=tidak_ada` | GET | 422 | `[isi]` | `[isi]` | `[isi]` |
| 36 | `/auth/logout` | POST | 204 | `[isi]` | `[isi]` | `[isi]` |

## Ringkasan operasi CRUD

| Operasi | Request | Endpoint contoh | Status sukses | Terpenuhi |
|---|---|---|---|---|
| CREATE | 11, 17, 19 | `POST /foods`, `POST /reservations` | 201 | `[isi]` |
| READ | 1, 7, 12, 13, 15, 21, 22, 28, 29, 31, 32 | `GET /foods/:id`, `GET /foods?q=` | 200 | `[isi]` |
| UPDATE | 8, 9, 14, 23, 24, 25, 27 | `PATCH /foods/:id`, `PATCH /reservations/:id/approve` | 200 | `[isi]` |
| DELETE | 16 | `DELETE /foods/:id` | 200 | `[isi]` |

## Path parameter yang diuji

| Endpoint | Nilai contoh | Hasil | Bukti |
|---|---|---|---|
| `/foods/:id` | id dari request 11 | `[isi]` | `[isi]` |
| `/admin/verifications/:id` | id dari request 7 | `[isi]` | `[isi]` |
| `/reservations/:id` | id dari request 19 | `[isi]` | `[isi]` |
| `/distributions/:id/verify-pickup` | id dari request 24 | `[isi]` | `[isi]` |

## Query parameter yang diuji

| Endpoint | Query | Hasil | Bukti |
|---|---|---|---|
| `/foods` | `?category=makanan_matang&q=nasi&page=1&limit=5` | `[isi]` | `[isi]` |
| `/foods/mine` | `?status=available&page=1&limit=10` | `[isi]` | `[isi]` |
| `/reservations/my` | `?status=pending&page=1&limit=10` | `[isi]` | `[isi]` |
| `/admin/verifications` | `?status=pending&page=1&limit=20` | `[isi]` | `[isi]` |
| `/distributions/history` | `?status=completed&page=1&limit=10` | `[isi]` | `[isi]` |

## Status error yang diuji

| Kondisi | Endpoint | Status Diharapkan | Status Aktual | Bukti |
|---|---|---|---|---|
| Tanpa token | `GET /foods` | 401 | `[isi]` | `[isi]` |
| Id tidak ditemukan | `GET /foods/000000000000000000000000` | 404 | `[isi]` | `[isi]` |
| Query tidak valid | `GET /foods?category=tidak_ada` | 422 | `[isi]` | `[isi]` |
| Role tidak sesuai | `POST /foods` dengan token receiver | 403 | `[isi]` | `[isi]` |
| Stok tidak cukup | `POST /reservations` quantity melebihi stok | 409 | `[isi]` | `[isi]` |

## Checklist sebelum demonstrasi

- [ ] Semua request dijalankan dan tabel di atas terisi
- [ ] Screenshot disimpan di folder `postman/bukti/`
- [ ] Status sukses dan status error sesuai dengan harapan
- [ ] Path parameter dan query parameter sudah diuji
- [ ] Alur reservasi sampai distribusi selesai tercatat di analitik
