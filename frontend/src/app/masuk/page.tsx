import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

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
    <AuthShell
      mode="login"
      title="Masuk ke Akun Anda"
      description="Lanjutkan perjalanan untuk mengurangi food waste bersama kami."
    >
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
