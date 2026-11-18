"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "./form-error";

export function RegisterForm({
  initialRole = "provider",
}: {
  initialRole?: Extract<Role, "provider" | "receiver">;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Extract<Role, "provider" | "receiver">>(
    initialRole,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [clientError, setClientError] = useState<string | null>(null);
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
    if (role === "receiver" && organizationName.trim().length < 2) {
      setClientError("Nama organisasi wajib diisi untuk akun penerima.");
      return;
    }
    if (phone.trim() && phone.trim().length < 8) {
      setClientError("Nomor telepon minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          phone: phone.trim() || undefined,
          organizationName: organizationName.trim() || undefined,
        }),
      });

      const login = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!login.ok) {
        router.replace("/masuk?s=registered");
        return;
      }

      router.replace("/verifikasi");
      router.refresh();
    } catch (submitError) {
      setError(submitError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <FormError error={error} />
      {clientError ? (
        <div
          className="border-l-4 border-danger bg-surface px-4 py-3 text-sm"
          role="alert"
        >
          <p className="font-bold text-danger">Periksa isian</p>
          <p className="mt-1">{clientError}</p>
        </div>
      ) : null}

      <fieldset>
        <legend className="field-label">Saya mendaftar sebagai</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: "provider",
                title: "Penyedia",
                body: "Restoran, katering, toko roti, atau acara dengan makanan berlebih.",
              },
              {
                value: "receiver",
                title: "Penerima",
                body: "Yayasan atau komunitas yang menyalurkan makanan.",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-[10px] border p-4 transition-colors ${
                role === option.value
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-transparent hover:border-control-line"
              }`}
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="mt-1 h-4 w-4 accent-[var(--brand)]"
                />
                <span>
                  <span className="block font-bold">{option.title}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {option.body}
                  </span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nama lengkap" htmlFor="name">
          <input
            id="name"
            className="field-input"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Nomor telepon" htmlFor="phone" optional hint="8 sampai 20 karakter.">
          <input
            id="phone"
            className="field-input"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
      </div>

      <Field
        label={role === "receiver" ? "Nama organisasi" : "Nama dapur atau usaha"}
        htmlFor="organizationName"
        optional={role === "provider"}
      >
        <input
          id="organizationName"
          className="field-input"
          autoComplete="organization"
          required={role === "receiver"}
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
        />
      </Field>

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          type="email"
          className="field-input"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Password" htmlFor="password" hint="Minimal 8 karakter.">
          <input
            id="password"
            type="password"
            className="field-input"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Ulangi password" htmlFor="confirmPassword">
          <input
            id="confirmPassword"
            type="password"
            className="field-input"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        Buat akun
      </Button>

      <p className="text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="link-underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
