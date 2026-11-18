import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { LoginForm } from "@/components/auth/login-form";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Masuk",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;

  return (
    <>
      <PublicHeader />
      <main className="shell grid gap-6 py-8 sm:py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-10">
        <aside className="auth-panel lg:sticky lg:top-24">
          <p className="text-xs font-bold text-[#9aeac1]">Akses akun</p>
          <h1 className="display mt-3 text-3xl text-sidebar-ink sm:text-4xl">
            Masuk ke alur distribusi Anda.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-muted">
            Gunakan email dan password akun WasteLess. Setelah masuk, Anda
            diarahkan ke ringkasan sesuai peran: penyedia, penerima, atau
            admin.
          </p>

          <div className="mt-7 grid gap-4">
            <p className="auth-fact">
              <Icon name="shield" size={18} />
              Sesi berlaku 15 menit. Setelah itu Anda perlu masuk lagi.
            </p>
            <p className="auth-fact">
              <Icon name="user" size={18} />
              Penyedia, penerima, dan admin memakai pintu masuk yang sama.
            </p>
          </div>

          <div className="mt-8 border-t border-sidebar-line pt-5">
            <p className="text-sm font-bold text-sidebar-ink">
              Belum punya akun?
            </p>
            <p className="mt-1 text-sm text-sidebar-muted">
              Pendaftaran terbuka untuk penyedia makanan dan organisasi
              penerima. Akun admin dibuat oleh operator platform.
            </p>
            <Link
              href="/daftar"
              className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#9aeac1]"
            >
              Buat akun sekarang
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </aside>

        <section
          className="panel h-fit p-5 sm:p-7"
          aria-labelledby="login-title"
        >
          <h2 id="login-title" className="display text-2xl">
            Masuk
          </h2>
          <p className="mb-6 mt-1 text-sm text-muted">
            Masukkan email dan password yang terdaftar.
          </p>
          <LoginForm expired={s === "expired"} />
          {s === "registered" ? (
            <p className="mt-4 text-sm text-success">
              Akun berhasil dibuat. Silakan masuk.
            </p>
          ) : null}
        </section>
      </main>
    </>
  );
}
