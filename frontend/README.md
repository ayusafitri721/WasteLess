# WasteLess frontend

Next.js App Router frontend untuk alur penyedia, penerima, dan admin WasteLess.

## Menjalankan

Backend harus aktif di `http://localhost:5000` dengan MongoDB yang mendukung transaksi.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3000`.

`BACKEND_API_URL` di `.env.local` menentukan alamat API backend. Nilai default:
`http://localhost:5000/api`.

## Arsitektur sesi

- Login ditangani route handler Next.js di `src/app/api/auth/login/route.ts`.
- Token backend disimpan sebagai cookie `httpOnly` bernama `wasteless_token`.
- Request data dari browser melewati `src/app/api/proxy/[...path]/route.ts`, yang
  menambahkan Bearer token dari cookie.
- Token tidak disimpan di `localStorage` dan tidak dikirim ke komponen client.

## Pemeriksaan

```bash
npm run lint
npm run build
```

Dokumentasi API backend tersedia di `http://localhost:5000/api/docs`.

