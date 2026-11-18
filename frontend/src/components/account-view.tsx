"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { roleLabels, verificationLabels } from "@/lib/labels";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { FormError } from "@/components/auth/form-error";
import { useCurrentUser } from "@/components/auth/auth-provider";

export function AccountView() {
  const router = useRouter();
  const { user, setUser } = useCurrentUser();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [organizationName, setOrganizationName] = useState(
    user?.organizationName ?? "",
  );
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const data = await apiFetch<{ user: User }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          phone: phone.trim() || undefined,
          organizationName: organizationName.trim() || undefined,
        }),
      });
      setUser(data.user);
      setSuccess(true);
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div>
          <p className="kicker">Akun</p>
          <h1 className="display mt-2 text-3xl sm:text-4xl">
            Profil dan status verifikasi.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted sm:text-base">
            Nama dan kontak dipakai saat penyedia dan penerima berkoordinasi.
            Email dan peran tidak dapat diubah dari halaman ini.
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold">Status akun</p>
          <p className="mt-1 text-sm text-muted">
            {roleLabels[user.role]} · {verificationLabels[user.verificationStatus]}
          </p>
          {user.verificationStatus !== "verified" ? (
            <Link href="/verifikasi" className="link-underline mt-4 inline-block text-sm">
              {user.verificationStatus === "pending"
                ? "Lihat status pengajuan"
                : "Ajukan verifikasi"}
            </Link>
          ) : null}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
        <section className="panel p-5 sm:p-6" aria-labelledby="profile-title">
          <h2 id="profile-title" className="display text-2xl">
            Data profil
          </h2>
          <p className="mb-6 mt-1 text-sm text-muted">
            Email: <span className="font-bold text-ink">{user.email}</span>
          </p>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <FormError error={error} />
            {success ? <Notice tone="success">Profil diperbarui.</Notice> : null}

            <Field label="Nama lengkap" htmlFor="account-name">
              <input
                id="account-name"
                className="field-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>
            <Field label="Nomor telepon" htmlFor="account-phone" optional>
              <input
                id="account-phone"
                className="field-input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>
            <Field
              label={
                user.role === "receiver"
                  ? "Nama organisasi"
                  : "Nama dapur atau usaha"
              }
              htmlFor="account-org"
              optional={user.role === "provider"}
            >
              <input
                id="account-org"
                className="field-input"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
              />
            </Field>

            <Button type="submit" loading={saving}>
              Simpan profil
            </Button>
          </form>
        </section>

        <section className="panel h-fit p-5 sm:p-6" aria-labelledby="session-title">
          <h2 id="session-title" className="display text-2xl">
            Sesi
          </h2>
          <p className="mt-2 text-sm text-muted">
            Token akses disimpan di cookie httpOnly, bukan di localStorage.
            Sesi berakhir setelah 15 menit.
          </p>
          <Button
            variant="danger"
            className="mt-6 w-full"
            onClick={logout}
            loading={loggingOut}
          >
            Keluar dari akun
          </Button>
        </section>
      </div>
    </div>
  );
}
