"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Verification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";

type Decision = "approved" | "rejected" | null;

export function VerificationDecision({
  verification,
  onDecided,
}: {
  verification: Verification;
  onDecided: (message: string) => Promise<void> | void;
}) {
  const [decision, setDecision] = useState<Decision>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision) return;
    setError(null);
    setLoading(true);

    try {
      await apiFetch<{ verification: Verification }>(
        `/admin/verifications/${verification.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            decision,
            reviewNote: reviewNote.trim() || undefined,
          }),
        },
      );
      const label = decision === "approved" ? "disetujui" : "ditolak";
      setDecision(null);
      setReviewNote("");
      await onDecided(
        `Pengajuan ${verification.organizationName} ${label}. Status pengguna sudah diperbarui.`,
      );
    } catch (submitError) {
      setError(submitError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4">
        <Button variant="primary" onClick={() => setDecision("approved")}>
          Setujui
        </Button>
        <Button variant="danger" onClick={() => setDecision("rejected")}>
          Tolak
        </Button>
      </div>

      <Dialog
        open={decision !== null}
        title={
          decision === "approved"
            ? "Setujui verifikasi?"
            : "Tolak pengajuan verifikasi?"
        }
        onClose={() => {
          if (!loading) setDecision(null);
        }}
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          {decision === "approved" ? (
            <p className="text-sm text-muted">
              Pengguna akan berstatus terverifikasi dan dapat memakai alur
              utama sesuai perannya.
            </p>
          ) : (
            <p className="text-sm text-muted">
              Tulis alasan yang dapat dibaca pengguna agar mereka dapat
              memperbaiki pengajuan.
            </p>
          )}

          <Field
            label={
              decision === "approved" ? "Catatan untuk pengguna" : "Alasan penolakan"
            }
            htmlFor={`review-note-${verification.id}`}
            optional={decision === "approved"}
          >
            <textarea
              id={`review-note-${verification.id}`}
              className="field-textarea"
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              maxLength={1000}
              required={decision === "rejected"}
            />
          </Field>

          {error ? (
            <Notice tone="danger">{errorMessage(error)}</Notice>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              variant={decision === "rejected" ? "danger" : "primary"}
              loading={loading}
            >
              {decision === "approved" ? "Setujui pengajuan" : "Tolak pengajuan"}
            </Button>
            <Button
              type="button"
              variant="quiet"
              disabled={loading}
              onClick={() => {
                setDecision(null);
                setError(null);
              }}
            >
              Kembali
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
