"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/errors";
import { homeForRole } from "@/lib/roles";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "./form-error";

export function LoginForm({ expired = false }: { expired?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as {
        data?: { user: User };
        error?: { code?: string; message?: string; details?: unknown };
      };

      if (!response.ok || !body.data?.user) {
        throw new ApiError(
          response.status,
          body.error?.code ?? "LOGIN_FAILED",
          body.error?.message ?? "Email atau password tidak cocok.",
          body.error?.details,
        );
      }

      router.replace(homeForRole(body.data.user.role));
      router.refresh();
    } catch (submitError) {
      setError(submitError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {expired ? (
        <div className="border-l-4 border-warning bg-surface px-4 py-3 text-sm">
          <p className="font-bold text-warning">Sesi berakhir</p>
          <p className="mt-1">Masuk lagi untuk melanjutkan.</p>
        </div>
      ) : null}

      <FormError error={error} />

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field-input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field-input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <Button type="submit" className="w-full" loading={loading}>
        Masuk ke akun
      </Button>

      <p className="text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/daftar" className="link-underline">
          Buat akun penyedia atau penerima
        </Link>
      </p>
    </form>
  );
}
