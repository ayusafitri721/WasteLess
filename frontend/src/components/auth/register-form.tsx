"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { AuthInput } from "./auth-input";
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
    <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
      <FormError error={error} />
      {clientError ? (
        <div className="notice notice-danger" role="alert">
          <p className="notice-title">Periksa isian</p>
          <p className="notice-body">{clientError}</p>
        </div>
      ) : null}

      <fieldset>
        <legend className="field-label">Daftar sebagai</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(
            [
              {
                value: "provider",
                title: "Penyedia",
                note: "Restoran, katering, toko",
                icon: "bowl",
              },
              {
                value: "receiver",
                title: "Penerima",
                note: "Yayasan atau komunitas",
                icon: "users",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="auth-role"
              data-active={role === option.value}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              <span className="auth-role-icon" aria-hidden="true">
                <Icon name={option.icon} size={18} />
              </span>
              <span>
                <span className="auth-role-title">{option.title}</span>
                <span className="auth-role-note">{option.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthInput
          id="name"
          label="Nama lengkap"
          icon="user"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <AuthInput
          id="phone"
          label="Nomor telepon"
          placeholder="Nomor telepon (opsional)"
          icon="phone"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>

      <AuthInput
        id="organizationName"
        label={
          role === "receiver" ? "Nama organisasi" : "Nama dapur atau usaha"
        }
        placeholder={
          role === "receiver"
            ? "Nama organisasi"
            : "Nama dapur atau usaha (opsional)"
        }
        icon="building"
        autoComplete="organization"
        required={role === "receiver"}
        value={organizationName}
        onChange={(event) => setOrganizationName(event.target.value)}
      />

      <AuthInput
        id="email"
        type="email"
        label="Email"
        icon="mail"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <AuthInput
        id="password"
        type="password"
        label="Password"
        icon="lock"
        autoComplete="new-password"
        required
        revealable
        hint="Minimal 8 karakter."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <AuthInput
        id="confirmPassword"
        type="password"
        label="Ulangi password"
        placeholder="Ulangi password"
        icon="lock"
        autoComplete="new-password"
        required
        revealable
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <Button type="submit" className="w-full" loading={loading}>
        Buat akun
        {!loading ? <Icon name="arrowRight" size={18} /> : null}
      </Button>
    </form>
  );
}
