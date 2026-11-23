"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { AuthInput } from "./auth-input";
import { FormError } from "./form-error";

type ResetRequest = {
  message: string;
  resetToken?: string;
  expiresAt?: string;
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetRequest | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const data = await apiFetch<ResetRequest>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResult(data);
    } catch (submitError) {
      setError(submitError);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="mt-5 space-y-4">
        <div className="reset-sent">
          <span className="reset-sent-icon" aria-hidden="true">
            <Icon name="mail" size={22} />
          </span>
          <div>
            <p className="reset-sent-title">
              {result.resetToken ? "Permintaan diterima" : "Cek email Anda"}
            </p>
            <p className="reset-sent-body">{result.message}</p>
            {result.resetToken ? null : (
              <ol className="reset-sent-steps">
                <li>Buka email dari WasteLess di kotak masuk Anda.</li>
                <li>
                  Klik tombol <strong>Ganti password</strong> sebelum 15 menit.
                </li>
                <li>Cek folder spam jika email tidak muncul.</li>
              </ol>
            )}
          </div>
        </div>

        {result.resetToken ? (
          <div className="notice notice-warning">
            <p className="notice-title">Mode pengembangan</p>
            <p className="notice-body">
              Tautan reset belum dikirim lewat email. Lanjutkan dengan tombol
              ini untuk mencoba alur ganti password.
            </p>
            <Link
              className="auth-link"
              href={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}
            >
              Buka halaman ganti password
            </Link>
          </div>
        ) : null}

        <Link href="/masuk" className="auth-link">
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
      <FormError error={error} />

      <AuthInput
        id="email"
        name="email"
        type="email"
        label="Email akun"
        icon="mail"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Button type="submit" className="w-full" loading={loading}>
        Kirim tautan reset
      </Button>

      <p className="auth-help">
        Tautan hanya berlaku 15 menit dan bisa dipakai sekali.
      </p>
    </form>
  );
}
