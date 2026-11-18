import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { getCurrentUser } from "@/lib/auth";

const flow = [
  {
    title: "Penyedia mencatat",
    detail: "Jumlah, batas ambil, alergen, dan lokasi masuk ke listing.",
    marker: "Listing tersedia",
  },
  {
    title: "Penerima mengajukan",
    detail: "Jumlah yang diminta langsung mengurangi stok secara aman.",
    marker: "Reservasi menunggu",
  },
  {
    title: "Penyedia menyetujui",
    detail: "Jadwal pengambilan ditentukan, lalu status siap diambil.",
    marker: "Jadwal disepakati",
  },
  {
    title: "Kode diverifikasi",
    detail: "Pengambilan dicatat, penerima mengonfirmasi serah terima.",
    marker: "Distribusi selesai",
  },
];

const recorded = [
  "Nama dan deskripsi makanan",
  "Jumlah serta satuan",
  "Waktu produksi",
  "Batas waktu pengambilan",
  "Alergen",
  "Kondisi penyimpanan",
  "Alamat pengambilan",
];

export default async function HomePage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  return (
    <>
      <PublicHeader user={user} />
      <main>
        <section className="shell grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16">
          <div>
            <p className="kicker">Redistribusi makanan</p>
            <h1 className="display mt-3 max-w-[13ch] text-[clamp(2.8rem,7vw,5.6rem)]">
              Makanan berlebih masih punya tujuan.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Catat makanan sisa, ajukan reservasi, dan lacak pengambilan
              sampai diterima. Setiap perubahan tersimpan di alur yang sama,
              dari dapur sampai organisasi penerima.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/daftar?role=provider" className="btn btn-primary">
                Daftar sebagai penyedia
              </Link>
              <Link
                href="/daftar?role=receiver"
                className="btn btn-secondary"
              >
                Daftar sebagai penerima
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              Sudah punya akun?{" "}
              <Link href="/masuk" className="link-underline">
                Masuk
              </Link>
            </p>
          </div>

          <div className="panel panel-shadow p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="kicker">Alur reservasi</p>
              <span className="status status-neutral">4 langkah</span>
            </div>
            <p className="display mt-2 text-2xl">Dari catatan ke serah terima</p>
            <ol className="mt-5 space-y-4">
              {flow.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="display-soft mt-0.5 w-7 shrink-0 text-lg text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 pb-4">
                    <p className="font-bold">{step.title}</p>
                    <p className="mt-1 text-sm text-muted">{step.detail}</p>
                    <p className="mt-2 text-xs font-bold text-brand">
                      {step.marker}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 border-t border-line pt-4 text-sm text-muted">
              Riwayat dan angka dampak dihitung dari catatan yang benar-benar
              selesai.
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="shell py-14 sm:py-18">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
              <div>
                <p className="kicker">Dua peran</p>
                <h2 className="display mt-3 text-3xl sm:text-4xl">
                  Satu catatan, dua pekerjaan yang berbeda.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                  Penyedia mengelola stok dan jadwal. Penerima mencari makanan
                  dan menyalurkannya. Keduanya memakai data yang sama.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
                <article className="panel p-5 sm:p-6">
                  <p className="kicker">Penyedia</p>
                  <h3 className="display mt-2 text-2xl">
                    Untuk dapur yang punya sisa layak dibagikan
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    <li>Buat dan tutup listing makanan.</li>
                    <li>Setujui atau tolak reservasi masuk.</li>
                    <li>Tentukan jadwal dan kode pengambilan.</li>
                    <li>Lihat jumlah yang benar-benar tersalurkan.</li>
                  </ul>
                </article>
                <article className="panel border-brand p-5 sm:p-6">
                  <p className="kicker">Penerima</p>
                  <h3 className="display mt-2 text-2xl">
                    Untuk organisasi yang menyalurkan
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    <li>Cari makanan berdasarkan kategori dan tenggat.</li>
                    <li>Ajukan jumlah sesuai kebutuhan.</li>
                    <li>Pantau status persetujuan dan jadwal ambil.</li>
                    <li>Konfirmasi distribusi setelah diterima.</li>
                  </ul>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
          <div>
            <p className="kicker">Yang dicatat</p>
            <h2 className="display mt-3 max-w-[18ch] text-3xl sm:text-4xl">
              Informasi yang dibutuhkan sebelum makanan berpindah.
            </h2>
            <ul className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {recorded.map((item) => (
                <li
                  key={item}
                  className="border-b border-line pb-3 text-sm font-bold"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel h-fit p-5 sm:p-6">
            <p className="kicker">Batas yang jelas</p>
            <p className="display mt-2 text-2xl">Keamanan pangan bukan klaim otomatis.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              WasteLess tidak menilai apakah makanan pasti aman. Penyedia
              mengisi informasi produksi, alergen, dan penyimpanan. Penerima
              tetap memeriksa kondisi makanan saat mengambil.
            </p>
            <Link href="/daftar" className="link-underline mt-5 inline-block text-sm">
              Buat akun untuk mulai mencatat
            </Link>
          </div>
        </section>

        <section className="bg-sidebar text-sidebar-ink">
          <div className="shell flex flex-col gap-6 py-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-sidebar-muted">Mulai dari peran Anda</p>
              <h2 className="display mt-2 max-w-[20ch] text-3xl sm:text-4xl">
                Catat yang berlebih. Salurkan yang masih layak.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/daftar?role=provider"
                className="btn border-white bg-white text-brand hover:bg-brand-soft"
              >
                Buat akun penyedia
              </Link>
              <Link
                href="/daftar?role=receiver"
                className="btn border-white/35 bg-transparent text-sidebar-ink hover:bg-sidebar-active"
              >
                Buat akun penerima
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
