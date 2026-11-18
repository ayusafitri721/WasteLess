"use client";

import type { ReactNode } from "react";
import { Button } from "./button";

export function LoadingState({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div
      className="panel px-5 py-8 text-sm text-muted"
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="panel border-danger px-5 py-6"
      role="alert"
      aria-live="assertive"
    >
      <p className="font-bold text-danger">Data gagal dimuat</p>
      <p className="mt-1 text-sm text-ink">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="panel border-dashed px-5 py-8">
      <p className="font-display text-xl font-semibold">{title}</p>
      {children ? (
        <div className="mt-2 max-w-xl text-sm text-muted">{children}</div>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "danger" | "warning";
  children: ReactNode;
}) {
  return (
    <div className={`notice notice-${tone}`}>
      <p className="notice-title">
        {tone === "danger" ? "Perlu diperhatikan" : null}
        {tone === "success" ? "Berhasil" : null}
        {tone === "warning" ? "Catatan" : null}
        {tone === "info" ? "Informasi" : null}
      </p>
      <div className="notice-body">{children}</div>
    </div>
  );
}
