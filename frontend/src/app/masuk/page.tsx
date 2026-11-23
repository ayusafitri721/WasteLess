import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

const OAUTH_NOTICES: Record<string, { title: string; body: string }> = {
  oauth_cancelled: {
    title: "Login dibatalkan",
    body: "Proses masuk dengan Google atau GitHub dibatalkan.",
  },
  oauth_not_configured: {
    title: "Login sosial belum aktif",
    body: "Kredensial OAuth belum diisi di server. Gunakan email dan password.",
  },
  oauth_unverified: {
    title: "Email belum terverifikasi",
    body: "Verifikasi email di akun Google atau GitHub Anda, lalu coba lagi.",
  },
  oauth_expired: {
    title: "Tautan login kedaluwarsa",
    body: "Kode login sudah dipakai atau habis masa berlakunya. Coba lagi.",
  },
  oauth_failed: {
    title: "Login sosial gagal",
    body: "Coba lagi, atau gunakan email dan password.",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const oauthNotice = s ? OAUTH_NOTICES[s] : undefined;

  return (
    <AuthShell
      mode="login"
      title="Masuk ke Akun Anda"
      description="Lanjutkan perjalanan untuk mengurangi food waste bersama kami."
    >
      {s === "reset" ? (
        <div className="notice notice-success mt-5">
          <p className="notice-title">Password berhasil diganti</p>
          <p className="notice-body">Silakan masuk dengan password baru Anda.</p>
        </div>
      ) : null}
      {oauthNotice ? (
        <div className="notice notice-warning mt-5">
          <p className="notice-title">{oauthNotice.title}</p>
          <p className="notice-body">{oauthNotice.body}</p>
        </div>
      ) : null}
      {s === "registered" ? (
        <div className="notice notice-success mt-5">
          <p className="notice-title">Akun berhasil dibuat</p>
          <p className="notice-body">Silakan masuk dengan akun baru Anda.</p>
        </div>
      ) : null}
      <LoginForm expired={s === "expired"} />
    </AuthShell>
  );
}
