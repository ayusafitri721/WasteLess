"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { verificationLabels } from "@/lib/labels";
import type { Verification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { FormError } from "@/components/auth/form-error";
import { useCurrentUser } from "@/components/auth/auth-provider";

export function VerificationView() {
  const { user, refresh } = useCurrentUser();
  const [organizationName, setOrganizationName] = useState(
    user?.organizationName ?? "",
  );
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [supportingDocumentUrl, setSupportingDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  if (user.role === "admin") {
    return (
      <div className="panel p-6">
        <p className="display text-2xl">Admin tidak mengajukan verifikasi.</p>
        <p className="mt-2 text-sm text-muted">
          Admin memproses pengajuan pengguna lain.
        </p>
        <Link href="/admin/verifikasi" className="link-underline mt-4 inline-block text-sm">
          Buka antrean verifikasi
        </Link>
      </div>
    );
  }

  const canSubmit =
    user.verificationStatus === "unverified" ||
    user.verificationStatus === "rejected";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await apiFetch<{ verification: Verification }>("/verifications", {
        method: "POST",
        body: JSON.stringify({
          organizationName,
          contactPhone,
          supportingDocumentUrl: supportingDocumentUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      setSuccess(true);
      await refresh();
    } catch (submitError) {
      setError(submitError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr]">
      <div>
        <p className="kicker">Verifikasi</p>
        <h1 className="display mt-2 text-3xl sm:text-4xl">
          Pastikan organisasi Anda dikenal admin.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Verifikasi membuka pembuatan listing untuk penyedia dan reservasi
          untuk penerima. Admin meninjau nama organisasi, kontak, dan dokumen
          pendukung bila ada.
        </p>

        <div className="panel mt-6 p-5">
          <p className="text-sm font-bold">Status saat ini</p>
          <p className="display mt-1 text-2xl">
            {verificationLabels[user.verificationStatus]}
          </p>
          <p className="mt-2 text-sm text-muted">
            {user.verificationStatus === "verified"
              ? "Akun sudah dapat memakai alur utama."
              : user.verificationStatus === "pending"
                ? "Pengajuan sedang menunggu keputusan admin. Anda belum dapat membuat listing atau reservasi."
                : user.verificationStatus === "rejected"
                  ? "Pengajuan sebelumnya ditolak. Periksa data lalu kirim ulang."
                  : "Kirim data organisasi untuk mulai ditinjau."}
          </p>
        </div>

        {success ? (
          <div className="mt-5">
            <Notice tone="success">
              Pengajuan terkirim. Status akun berubah menjadi menunggu
              verifikasi.
            </Notice>
          </div>
        ) : null}

        {canSubmit ? (
          <form
            onSubmit={onSubmit}
            className="panel mt-6 space-y-5 p-5 sm:p-6"
            noValidate
          >
            <h2 className="display text-2xl">Data pengajuan</h2>
            <FormError error={error} />

            <Field label="Nama organisasi atau usaha" htmlFor="verification-org">
              <input
                id="verification-org"
                className="field-input"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                required
              />
            </Field>
            <Field
              label="Nomor kontak"
              htmlFor="verification-phone"
              hint="Nomor yang dapat dihubungi admin."
            >
              <input
                id="verification-phone"
                className="field-input"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                required
              />
            </Field>
            <Field
              label="URL dokumen pendukung"
              htmlFor="verification-document"
              optional
              hint="Tautan http atau https ke dokumen organisasi."
            >
              <input
                id="verification-document"
                type="url"
                className="field-input"
                value={supportingDocumentUrl}
                onChange={(event) =>
                  setSupportingDocumentUrl(event.target.value)
                }
              />
            </Field>
            <Field label="Catatan untuk admin" htmlFor="verification-notes" optional>
              <textarea
                id="verification-notes"
                className="field-textarea"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={1000}
              />
            </Field>

            <Button type="submit" loading={loading}>
              Kirim pengajuan verifikasi
            </Button>
            {error ? (
              <p className="text-sm text-muted">{errorMessage(error)}</p>
            ) : null}
          </form>
        ) : null}

        {user.verificationStatus === "verified" ? (
          <Link
            href={user.role === "provider" ? "/provider/listing/baru" : "/receiver/makanan"}
            className="btn btn-primary mt-6"
          >
            {user.role === "provider"
              ? "Buat listing pertama"
              : "Cari makanan tersedia"}
          </Link>
        ) : null}
      </div>

      <aside className="panel h-fit p-5 sm:p-6">
        <p className="kicker">Yang diperiksa</p>
        <ul className="mt-3 space-y-3 text-sm text-muted">
          <li>Nama organisasi atau usaha yang konsisten dengan profil.</li>
          <li>Nomor kontak yang dapat dihubungi.</li>
          <li>Dokumen pendukung bila pengaju melampirkan tautan.</li>
        </ul>
        <div className="divider my-5" />
        <p className="text-sm text-muted">
          Verifikasi bukan jaminan kualitas makanan. Penerima tetap memeriksa
          kondisi makanan saat mengambil.
        </p>
      </aside>
    </div>
  );
}
