import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      mode="forgot"
      title="Lupa Password?"
      description="Masukkan email akun Anda untuk membuat tautan ganti password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
