import Image from "next/image";
import Link from "next/link";
import { BackToTop } from "@/components/landing/back-to-top";
import { FlowReveal } from "@/components/landing/flow-reveal";
import { ImpactStats } from "@/components/landing/impact-stats";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { Icon, type IconName } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth";
import { categoryLabels } from "@/lib/labels";

const flow: Array<{ title: string; detail: string; marker: string; icon: IconName }> = [
  {
    title: "Penyedia mencatat",
    detail: "Jumlah, batas ambil, alergen, dan lokasi masuk ke listing.",
    marker: "Listing tersedia",
    icon: "plus",
  },
  {
    title: "Penerima mengajukan",
    detail: "Jumlah yang diminta langsung mengurangi stok secara aman.",
    marker: "Reservasi menunggu",
    icon: "bowl",
  },
  {
    title: "Penyedia menyetujui",
    detail: "Jadwal pengambilan ditentukan, lalu status siap diambil.",
    marker: "Jadwal disepakati",
    icon: "calendar",
  },
  {
    title: "Kode diverifikasi",
    detail: "Pengambilan dicatat, penerima mengonfirmasi serah terima.",
    marker: "Distribusi selesai",
    icon: "shield",
  },
];

const categories: Array<{ key: keyof typeof categoryLabels; icon: IconName }> = [
  { key: "makanan_matang", icon: "bowl" },
  { key: "roti_dan_kue", icon: "bread" },
  { key: "buah_dan_sayur", icon: "leaf" },
  { key: "makanan_kemasan", icon: "package" },
  { key: "minuman", icon: "cup" },
  { key: "lainnya", icon: "grid" },
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
        <section id="beranda" className="shell landing-hero">
          <div>
            <p className="kicker">Redistribusi makanan</p>
            <h1 className="display mt-4 max-w-[12ch] text-[clamp(3rem,7.5vw,5.75rem)]">
              Makanan berlebih masih punya tujuan.
            </h1>
            <p className="landing-lede mt-7">
              Catat makanan sisa, ajukan reservasi, dan lacak pengambilan sampai
              diterima. Penyedia dan penerima memakai satu alur yang sama.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/daftar?role=provider" className="btn btn-primary">
                Daftar sebagai penyedia
              </Link>
              <Link href="/daftar?role=receiver" className="btn btn-secondary">
                Daftar sebagai penerima
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              Sudah punya akun?{" "}
              <Link href="/masuk" className="link-underline">
                Masuk
              </Link>
            </p>
          </div>

          <div className="landing-visual">
            <figure className="landing-figure">
              <Image
                src="/illustrasi-redistribusi.svg"
                alt="Wadah makanan berlebih dipindahkan dari dapur ke keranjang organisasi penerima"
                width={800}
                height={450}
                unoptimized
                className="landing-illustration"
              />
              <figcaption>Ilustrasi alur redistribusi makanan.</figcaption>
            </figure>

            <div className="landing-preview" aria-label="Ringkasan alur reservasi">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="kicker">Alur reservasi</p>
                <span className="status status-success">4 langkah</span>
              </div>
              <p className="display mt-3 text-2xl">Dari catatan ke serah terima</p>
              <p className="landing-preview-foot">
                Setiap langkah tercatat dan bisa ditinjau kembali oleh pihak yang
                terlibat.
              </p>
            </div>
          </div>
        </section>

        <ImpactStats />

        <section id="tentang" className="landing-about">
          <div className="shell landing-about-inner">
            <div>
              <p className="kicker">Tentang WasteLess</p>
              <h2 className="display mt-3 max-w-[20ch] text-3xl sm:text-4xl">
                WasteLess merangkum alur redistribusi makanan.
              </h2>
            </div>
            <div className="landing-about-copy">
              <p>
                Makanan berlebih dari penyedia dicatat, dicari oleh penerima,
                lalu serah terimanya dilacak sampai selesai. Setiap perubahan
                tersimpan di satu alur yang sama.
              </p>
              <p>
                Penyedia mengisi informasi produksi, alergen, dan penyimpanan.
                Penerima tetap memeriksa kondisi makanan saat mengambil.
              </p>
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="shell landing-how">
          <div>
            <p className="kicker">Cara kerja</p>
            <h2 className="display mt-3 max-w-[20ch] text-3xl sm:text-4xl">
              Empat langkah dari dapur sampai diterima.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Alur ini dipakai penyedia dan penerima dengan data yang sama,
              sehingga statusnya selalu bisa dilacak.
            </p>
          </div>
          <FlowReveal>
            <ol className="how-steps">
              {flow.map((step, index) => (
                <li key={step.title} className="how-step" data-step>
                  <span className="how-step-icon" aria-hidden="true">
                    <Icon name={step.icon} size={18} />
                  </span>
                  <span className="how-step-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="font-bold">{step.title}</p>
                  <p className="mt-1 text-sm text-muted">{step.detail}</p>
                  <p className="mt-2 text-xs font-bold text-brand">
                    {step.marker}
                  </p>
                </li>
              ))}
            </ol>
          </FlowReveal>
        </section>

        <section id="jelajahi" className="landing-band">
          <div className="shell landing-explore">
            <div>
              <p className="kicker">Jelajahi makanan</p>
              <h2 className="display mt-3 max-w-[18ch] text-3xl sm:text-4xl">
                Kategori yang bisa dicatat dan dicari.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Listing tersedia dibaca dari database, bukan daftar statis. Cari
                berdasarkan kategori, kata kunci, dan batas pengambilan.
              </p>
              <Link href="/daftar?role=receiver" className="btn btn-secondary mt-6">
                Mulai mencari makanan
              </Link>
            </div>
            <ul className="food-category-grid">
              {categories.map((category) => (
                <li key={category.key} className="food-category-card">
                  <span className="food-category-icon" aria-hidden="true">
                    <Icon name={category.icon} size={20} />
                  </span>
                  <span>{categoryLabels[category.key]}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing-band landing-participate">
          <div className="shell landing-roles">
            <div>
              <p className="kicker">Siapa yang bisa berpartisipasi</p>
              <h2 className="display mt-3 max-w-[18ch] text-3xl sm:text-4xl">
                Satu catatan, dua pekerjaan yang berbeda.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Penyedia mengelola stok dan jadwal. Penerima mencari makanan dan
                menyalurkannya. Keduanya memakai data yang sama.
              </p>
            </div>
            <div className="landing-role-list">
              <article className="landing-role" data-primary="true">
                <p className="kicker">Penyedia</p>
                <h3 className="display mt-2 text-2xl">
                  Untuk dapur yang punya sisa layak dibagikan
                </h3>
                <ul className="landing-role-list-items">
                  <li>Buat dan tutup listing makanan.</li>
                  <li>Setujui atau tolak reservasi masuk.</li>
                  <li>Tentukan jadwal dan kode pengambilan.</li>
                  <li>Lihat yang benar-benar tersalurkan.</li>
                </ul>
              </article>
              <article className="landing-role">
                <p className="kicker">Penerima</p>
                <h3 className="display mt-2 text-2xl">
                  Untuk organisasi yang menyalurkan
                </h3>
                <ul className="landing-role-list-items">
                  <li>Cari makanan berdasarkan kategori dan tenggat.</li>
                  <li>Ajukan jumlah sesuai kebutuhan.</li>
                  <li>Pantau status persetujuan dan jadwal ambil.</li>
                  <li>Konfirmasi distribusi setelah diterima.</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="fitur" className="shell landing-record">
          <div>
            <p className="kicker">Fitur platform</p>
            <h2 className="display mt-3 max-w-[20ch] text-3xl sm:text-4xl">
              Informasi yang dibutuhkan sebelum makanan berpindah.
            </h2>
            <ul className="landing-record-list">
              {recorded.map((item, index) => (
                <li key={item}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <aside className="landing-note">
            <p className="kicker">Batas yang jelas</p>
            <p className="display mt-3 text-2xl">
              Keamanan pangan bukan klaim otomatis.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              WasteLess tidak menilai apakah makanan pasti aman. Penyedia mengisi
              informasi produksi, alergen, dan penyimpanan. Penerima tetap
              memeriksa kondisi makanan saat mengambil.
            </p>
            <Link href="/daftar" className="link-underline mt-5 inline-block text-sm">
              Buat akun untuk mulai mencatat
            </Link>
          </aside>
        </section>

        <section id="mulai" className="landing-cta">
          <div className="shell landing-cta-inner">
            <div>
              <p className="kicker">Mulai dari peran Anda</p>
              <h2 className="display mt-3 max-w-[22ch] text-3xl sm:text-4xl">
                Catat yang berlebih. Salurkan yang masih layak.
              </h2>
            </div>
            <div className="landing-cta-actions">
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
      <BackToTop />
      <PublicFooter />
    </>
  );
}
