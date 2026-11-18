"use client";

import { useMemo, useState } from "react";
import { VerificationDecision } from "@/components/admin/verification-decision";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "@/components/ui/states";
import { withQuery } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { roleLabels } from "@/lib/labels";
import { useApi } from "@/lib/use-api";
import type { Paginated, Verification } from "@/lib/types";

type VerificationFilter = "pending" | "approved" | "rejected" | "all";

const decisionLabels: Record<Exclude<VerificationFilter, "all">, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export default function AdminVerificationsPage() {
  const [status, setStatus] = useState<VerificationFilter>("pending");
  const [page, setPage] = useState(1);
  const [success, setSuccess] = useState("");

  const path = useMemo(
    () =>
      withQuery("/admin/verifications", {
        status,
        page,
        limit: 10,
      }),
    [status, page],
  );
  const verifications = useApi<Paginated<Verification>>(path);

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Verifikasi"
        title="Tinjau organisasi sebelum membuka akses."
        description="Periksa nama organisasi, kontak, dan dokumen pendukung. Penolakan wajib menyertakan alasan agar pengguna dapat memperbaiki pengajuan."
      />

      {success ? (
        <div aria-live="polite">
          <Notice tone="success">{success}</Notice>
        </div>
      ) : null}

      <div className="max-w-xs">
        <label className="field-label" htmlFor="verification-filter">
          Filter status
        </label>
        <select
          id="verification-filter"
          className="field-select"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as VerificationFilter);
            setPage(1);
          }}
        >
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
          <option value="all">Semua</option>
        </select>
      </div>

      {verifications.loading ? (
        <LoadingState label="Memuat pengajuan verifikasi..." />
      ) : verifications.error ? (
        <ErrorState
          message={verifications.error}
          onRetry={verifications.refetch}
        />
      ) : verifications.data && verifications.data.items.length > 0 ? (
        <div className="space-y-4">
          <ul className="space-y-4">
            {verifications.data.items.map((verification) => {
              const applicant =
                typeof verification.userId === "string"
                  ? null
                  : verification.userId;
              return (
                <li key={verification.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="display text-xl">
                          {verification.organizationName}
                        </h2>
                        {verification.status !== "pending" ? (
                          <StatusBadge
                            label={decisionLabels[verification.status]}
                            status={verification.status}
                          />
                        ) : (
                          <StatusBadge
                            label={decisionLabels.pending}
                            status="pending"
                          />
                        )}
                      </div>
                      <p className="mt-2 text-sm">
                        {applicant?.name ?? "Pengguna"}
                        {applicant?.email ? ` · ${applicant.email}` : ""}
                        {applicant ? ` · ${roleLabels[applicant.role]}` : ""}
                      </p>
                      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="inline text-muted">Kontak pengajuan: </dt>
                          <dd className="inline">{verification.contactPhone}</dd>
                        </div>
                        <div>
                          <dt className="inline text-muted">Diajukan: </dt>
                          <dd className="inline">
                            {formatDateTime(verification.createdAt)}
                          </dd>
                        </div>
                        {applicant?.phone ? (
                          <div>
                            <dt className="inline text-muted">Telepon akun: </dt>
                            <dd className="inline">{applicant.phone}</dd>
                          </div>
                        ) : null}
                        {verification.reviewedAt ? (
                          <div>
                            <dt className="inline text-muted">Ditinjau: </dt>
                            <dd className="inline">
                              {formatDateTime(verification.reviewedAt)}
                            </dd>
                          </div>
                        ) : null}
                        {verification.supportingDocumentUrl ? (
                          <div className="sm:col-span-2">
                            <dt className="inline text-muted">Dokumen: </dt>
                            <dd className="inline">
                              <a
                                href={verification.supportingDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="link-underline break-all"
                              >
                                Buka dokumen pendukung
                              </a>
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                      {verification.notes ? (
                        <p className="mt-3 border-l-2 border-line pl-3 text-sm text-muted">
                          Catatan pengaju: {verification.notes}
                        </p>
                      ) : null}
                      {verification.reviewNote ? (
                        <p className="mt-3 border-l-2 border-warning pl-3 text-sm">
                          Catatan admin: {verification.reviewNote}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {verification.status === "pending" ? (
                    <VerificationDecision
                      verification={verification}
                      onDecided={async (message) => {
                        setSuccess(message);
                        await verifications.refetch();
                      }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
          <Pagination
            pagination={verifications.data.pagination}
            onPage={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title={
            status === "pending"
              ? "Antrean verifikasi kosong."
              : "Tidak ada pengajuan pada filter ini."
          }
        >
          {status === "pending"
            ? "Pengajuan baru akan muncul di sini setelah pengguna mengirim data organisasi."
            : "Ubah filter untuk melihat pengajuan dengan status lain."}
        </EmptyState>
      )}
    </div>
  );
}
