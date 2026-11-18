# WasteLess Design Direction

## Design Read

Aplikasi redistribusi makanan untuk penyedia dan penerima terverifikasi di Indonesia. Arah visual mengikuti referensi dashboard hijau-putih: rapi, modern, dan operasional, dengan dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

## Identity

WasteLess terasa seperti ruang kerja distribusi yang terang, bukan buku catatan dapur. Rel navigasi hijau gelap menahan identitas merek, sementara area kerja putih membuat listing, reservasi, dan status mudah dipindai.

Aksen hijau menandai aksi dan status berhasil. Angka, badge, dan label tetap berasal dari data nyata. Tidak ada statistik dekoratif atau foto makanan palsu.

## Palette

| Token | Light | Dark | Fungsi |
|---|---|---|---|
| paper | `#F4F7F3` | `#0D1712` | Latar area kerja |
| surface | `#FFFFFF` | `#14211A` | Kartu, panel, topbar |
| ink | `#16261D` | `#EDF5EF` | Teks utama, 14.63:1 / 14.98:1 |
| muted | `#5B6B61` | `#A9BDB0` | Teks sekunder, 5.23:1 / 9.22:1 |
| brand | `#0B7A43` | `#6FE0A5` | Aksi, tautan, status berhasil |
| brand-soft | `#E6F3EA` | `#173427` | Latar aksen ringan |
| sidebar | `#103B27` | `#091D14` | Rel navigasi desktop |
| sidebar-muted | `#B8CBBF` | `#A9BDB0` | Label di rel, 7.35:1 |
| line | `#DEE7E0` | `#2B3D32` | Garis dan batas |

Kontras utama: teks putih di brand 5.41:1, teks sidebar 11.96:1, aksen sidebar `#9AEAC1` di sidebar 8.89:1. Warna status memakai `currentColor` dengan tint tipis agar tetap terbaca di dua tema.

## Typography

**Plus Jakarta Sans** untuk judul, angka, dan antarmuka. Satu keluarga huruf menjaga dashboard terasa kohesif. Judul memakai bobot 700 dengan tracking rapat, teks isi tetap pada ukuran dan tinggi baris yang nyaman.

Tidak memakai serif dekoratif, huruf monospace, atau label uppercase berjarak lebar untuk teks biasa.

## Layout

- Rel navigasi desktop selebar 252px, hijau gelap, berisi wordmark, menu peran, akun, dan tombol keluar.
- Topbar putih setinggi 68px berisi konteks halaman, pengalih tema, dan akun.
- Area kerja maksimal 1440px dengan padding 16px di ponsel, 24px di tablet, dan 32px di desktop.
- Ponsel memakai topbar ringkas dan navigasi bawah berlabel, bukan sidebar sempit.
- Radius 10px untuk tombol dan input, 16px untuk panel, 18px untuk kartu makanan.
- Bayangan hanya dipakai untuk panel yang mengambang atau kartu yang sedang disentuh.

## Cards and Status

- Kartu makanan memakai bidang visual kategori berisi ikon inline, bukan foto stok.
- Status memakai pil dengan tint tipis: hijau untuk selesai, kuning untuk menunggu, merah untuk gagal, biru untuk informasi.
- Angka dampak dan jumlah selalu memakai data API. Keadaan kosong menjelaskan penyebab dan langkah berikutnya.

## Motion

MOTION 1: transisi hover, focus, dan perubahan status saja. Tidak ada animasi masuk otomatis, parallax, pulsing, atau loop tanpa henti.

## Content Rules

- Salinan berbahasa Indonesia, spesifik, dan menyebut tindakan nyata: "Buat listing", "Ajukan reservasi", "Verifikasi kode".
- Tidak ada klaim keamanan pangan. Penyedia mengisi data, penerima tetap memeriksa makanan.
- Foto, logo pihak ketiga, dan avatar buatan tidak dipakai. Wordmark memakai daun inline, avatar memakai inisial.
- Jangan menambah metrik atau testimoni palsu untuk membuat dashboard terlihat penuh.

## States

Setiap tampilan data memiliki keadaan memuat, kosong, dan gagal. Kesalahan API ditampilkan apa adanya. Tidak ada data cadangan palsu.

## Theme

Mode terang adalah default. Mode gelap memakai palet hijau yang sama dengan permukaan lebih gelap dan aksi hijau terang. Preferensi disimpan di perangkat.

## Decisions Log

- Warna: hijau tua untuk rel, hijau cerah untuk aksi, putih untuk area kerja, mengikuti referensi pengguna.
- Tipografi: Plus Jakarta Sans karena modern, ramah, dan terbaca di dashboard padat.
- Layout: sidebar desktop dan bottom nav seluler agar peran dan tujuan navigasi selalu terlihat.
- Visual makanan: ikon kategori sebagai pengganti jujur sampai ada foto asli.
- Tanpa foto stok: belum ada aset asli, jadi tidak dibuat atau dipalsukan.
