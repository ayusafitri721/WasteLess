import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Daftar",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const initialRole = role === "receiver" ? "receiver" : "provider";

  return (
    <AuthShell
      mode="register"
      title="Buat Akun Anda"
      description="Mulai catat makanan berlebih dan salurkan ke organisasi yang membutuhkan."
    >
      <RegisterForm initialRole={initialRole} />
    </AuthShell>
  );
}
