"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AuthInput } from "./auth-input";
import { FormError } from "./form-error";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setClientError(null);

    if (password.length < 8) {
      setClientError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setClientError("Konfirmasi password belum sama.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.replace("/masuk?s=reset");
      router.refresh();
    } catch (submitError) {
      setError(submitError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
      <FormError error={error} />
      {clientError ? (
        <div className="notice notice-danger" role="alert">
          <p className="notice-title">Periksa isian</p>
          <p className="notice-body">{clientError}</p>
        </div>
      ) : null}

      <AuthInput
        id="new-password"
        name="password"
        type="password"
        label="Password baru"
        icon="lock"
        autoComplete="new-password"
        required
        revealable
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <AuthInput
        id="confirm-password"
        name="confirmPassword"
        type="password"
        label="Konfirmasi password"
        icon="lock"
        autoComplete="new-password"
        required
        revealable
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <Button type="submit" className="w-full" loading={loading}>
        Simpan password baru
      </Button>
    </form>
  );
}
