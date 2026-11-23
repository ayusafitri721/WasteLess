import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Ganti Password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      mode="reset"
      title="Ganti Password"
      description="Buat password baru untuk akun WasteLess Anda."
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="notice notice-danger mt-5">
          <p className="notice-title">Tautan tidak valid</p>
          <p className="notice-body">
            Tautan ganti password tidak ditemukan atau sudah rusak.
          </p>
          <Link href="/lupa-password" className="auth-link">
            Minta tautan baru
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
