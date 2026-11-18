"use client";

import { Button } from "./button";
import type { Pagination as PaginationShape } from "@/lib/types";

export function Pagination({
  pagination,
  onPage,
}: {
  pagination: PaginationShape;
  onPage: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
      aria-label="Navigasi halaman"
    >
      <p className="text-sm text-muted">
        Halaman {pagination.page} dari {pagination.totalPages}. Total{" "}
        {pagination.total} data.
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          variant="secondary"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </nav>
  );
}
