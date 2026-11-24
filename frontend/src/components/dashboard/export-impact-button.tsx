"use client";

import { unitLabels } from "@/lib/labels";
import type {
  PlatformAnalytics,
  ProviderAnalytics,
  ReceiverAnalytics,
} from "@/lib/types";

type Analytics = ProviderAnalytics | ReceiverAnalytics | PlatformAnalytics;

function cell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildRows(analytics: Analytics) {
  const rows: Array<[string, string | number, string]> = [];

  if ("listings" in analytics) {
    Object.entries(analytics.listings.byStatus).forEach(([status, count]) => {
      rows.push(["Listing", count, status]);
    });
  }

  Object.entries(analytics.reservations.byStatus).forEach(([status, count]) => {
    rows.push(["Reservasi", count, status]);
  });
  Object.entries(analytics.distributions.byStatus).forEach(
    ([status, count]) => {
      rows.push(["Distribusi", count, status]);
    },
  );

  analytics.completedQuantityByUnit.forEach((item) => {
    rows.push([
      `Makanan tersalurkan - ${unitLabels[item.unit] ?? item.unit}`,
      item.quantity,
      `${item.distributions} distribusi selesai`,
    ]);
  });

  if ("users" in analytics) {
    rows.push(["Pengguna terverifikasi", analytics.users.verified, "Admin"]);
  }

  return [["Metrik", "Nilai", "Keterangan"], ...rows];
}

export function ExportImpactButton({ analytics }: { analytics: Analytics }) {
  function exportCsv() {
    const csv = buildRows(analytics)
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wasteless-dampak-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={exportCsv}>
      Unduh CSV
    </button>
  );
}
