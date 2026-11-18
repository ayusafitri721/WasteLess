import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { RegisterForm } from "@/components/auth/register-form";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Buat akun",
};

const steps = [
  "Isi data akun dan pilih peran.",
  "Ajukan verifikasi organisasi dari halaman akun.",
  "Setelah disetujui admin, alur utama terbuka.",
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const initialRole = role === "receiver" ? "receiver" : "provider";

  return (
    <>
      <PublicHeader />
      <main className="shell grid gap-6 py-8 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-10">
        <aside className="auth-panel lg:sticky lg:top-24">
          <p className="text-xs font-bold text-[#9aeac1]">Akun baru</p>
          <h1 className="display mt-3 text-3xl text-sidebar-ink sm:text-4xl">
            Mulai mencatat makanan yang bisa disalurkan.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-muted">
            Pilih peran yang sesuai. Setelah mendaftar, Anda perlu mengajukan
            verifikasi organisasi sebelum dapat membuat listing atau
            reservasi.
          </p>

          <ol className="mt-7 space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="auth-step">
                <span className="auth-step-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex items-start gap-2 border-t border-sidebar-line pt-5 text-sm text-sidebar-muted">
            <Icon
              name="shield"
              size={18}
              className="mt-0.5 shrink-0 text-[#9aeac1]"
            />
            <p>
              Data organisasi diperiksa admin. Verifikasi menjaga alur tetap
              jelas untuk penyedia dan penerima.
            </p>
          </div>
        </aside>

        <section
          className="panel h-fit p-5 sm:p-7"
          aria-labelledby="register-title"
        >
          <h2 id="register-title" className="display text-2xl">
            Buat akun
          </h2>
          <p className="mb-6 mt-1 text-sm text-muted">
            Data dikirim ke backend dan disimpan di MongoDB.
          </p>
          <RegisterForm initialRole={initialRole} />
        </section>
      </main>
    </>
  );
}
