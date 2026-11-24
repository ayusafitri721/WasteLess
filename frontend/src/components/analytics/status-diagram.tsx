"use client";

import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  distributionStatusLabels,
  foodStatusLabels,
  reservationStatusLabels,
  statusTone,
  unitLabels,
} from "@/lib/labels";
import type {
  DistributionStatus,
  FoodUnit,
  PlatformAnalytics,
  ProviderAnalytics,
  ReceiverAnalytics,
  ReservationStatus,
  StatusBreakdown,
} from "@/lib/types";

type Analytics = ProviderAnalytics | ReceiverAnalytics | PlatformAnalytics;
type Tone = "neutral" | "success" | "warning" | "danger" | "info";
type ViewKey = "reservations" | "distributions" | "listings" | "volume";

type Segment = {
  key: string;
  label: string;
  value: number;
  tone: Tone;
  note?: string;
};

const formatNumber = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

const questions: Record<ViewKey, string> = {
  reservations: "Berapa reservasi di tiap tahap?",
  distributions: "Berapa distribusi di tiap tahap?",
  listings: "Berapa listing di tiap status?",
  volume: "Berapa makanan tersalurkan per satuan?",
};

const nouns: Record<ViewKey, string> = {
  reservations: "reservasi",
  distributions: "distribusi",
  listings: "listing",
  volume: "satuan",
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function statusSegments(
  breakdown: StatusBreakdown,
  labels: Record<string, string>,
  toneFor: (key: string) => Tone,
): Segment[] {
  const order = Object.keys(labels);
  return Object.entries(breakdown.byStatus)
    .filter(([, value]) => value > 0)
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([key, value]) => ({
      key,
      label: labels[key] ?? key,
      value,
      tone: toneFor(key),
    }));
}

export function StatusDiagram({
  analytics,
  loading,
  error,
  onRetry,
}: {
  analytics: Analytics | null;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const [view, setView] = useState<ViewKey>("reservations");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const views = useMemo(() => {
    if (!analytics) return [] as { key: ViewKey; label: string }[];

    const result: { key: ViewKey; label: string }[] = [
      { key: "reservations", label: "Reservasi" },
      { key: "distributions", label: "Distribusi" },
    ];
    if ("listings" in analytics) {
      result.push({ key: "listings", label: "Listing" });
    }
    if (analytics.completedQuantityByUnit.length > 0) {
      result.push({ key: "volume", label: "Volume" });
    }
    return result;
  }, [analytics]);

  const segments = useMemo<Segment[]>(() => {
    if (!analytics) return [];

    if (view === "volume") {
      return analytics.completedQuantityByUnit
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          key: item.unit,
          label: unitLabels[item.unit as FoodUnit] ?? item.unit,
          value: item.quantity,
          tone: "success" as Tone,
          note: `${formatNumber.format(item.distributions)} distribusi selesai`,
        }));
    }

    if (view === "listings" && "listings" in analytics) {
      return statusSegments(
        analytics.listings,
        foodStatusLabels,
        (key) => statusTone(key as keyof typeof foodStatusLabels) as Tone,
      );
    }

    if (view === "distributions") {
      return statusSegments(
        analytics.distributions,
        distributionStatusLabels,
        (key) => statusTone(key as DistributionStatus) as Tone,
      );
    }

    return statusSegments(
      analytics.reservations,
      reservationStatusLabels,
      (key) => statusTone(key as ReservationStatus) as Tone,
    );
  }, [analytics, view]);

  const total = useMemo(() => {
    if (!analytics) return 0;
    if (view === "volume") {
      return segments.reduce((sum, segment) => sum + segment.value, 0);
    }
    if (view === "listings" && "listings" in analytics) {
      return analytics.listings.total;
    }
    if (view === "distributions") return analytics.distributions.total;
    return analytics.reservations.total;
  }, [analytics, view, segments]);

  const arcs = useMemo(
    () =>
      segments.reduce<{ segment: Segment; length: number; offset: number }[]>(
        (result, segment) => {
          const length = (segment.value / total) * CIRCUMFERENCE;
          const offset = result.reduce((sum, item) => sum + item.length, 0);
          return [...result, { segment, length, offset }];
        },
        [],
      ),
    [segments, total],
  );

  if (loading) {
    return <LoadingState label="Memuat ringkasan status..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!analytics || segments.length === 0 || total === 0) {
    return (
      <EmptyState title="Belum ada data untuk ditampilkan">
        Angka di sini muncul setelah ada reservasi atau distribusi yang
        tercatat. Mulai dari listing atau pengajuan reservasi pertama.
      </EmptyState>
    );
  }

  const active = segments.find((item) => item.key === activeKey) ?? segments[0];
  const percent = Math.round((active.value / total) * 100);

  return (
    <div>
      <div className="diagram-head">
        <p className="font-bold">{questions[view]}</p>
        {views.length > 1 ? (
          <div className="diagram-tabs" role="group" aria-label="Pilihan data diagram">
            {views.map((item) => (
              <button
                key={item.key}
                type="button"
                className="diagram-tab"
                data-active={view === item.key}
                aria-pressed={view === item.key}
                onClick={() => {
                  setView(item.key);
                  setActiveKey(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="diagram-body">
        <div className="diagram-donut-wrap">
          <svg
            className="diagram-donut"
            viewBox="0 0 140 140"
            role="img"
            aria-label={`${questions[view]} Total ${formatNumber.format(total)} ${nouns[view]}`}
          >
            <circle
              cx="70"
              cy="70"
              r={RADIUS}
              className="diagram-donut-track"
            />
            {arcs.map(({ segment, length, offset }) => (
              <circle
                key={segment.key}
                cx="70"
                cy="70"
                r={RADIUS}
                className="diagram-donut-segment"
                data-tone={segment.tone}
                data-active={segment.key === active.key}
                strokeDasharray={`${Math.max(0, length - 2)} ${CIRCUMFERENCE - Math.max(0, length - 2)}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
                onMouseEnter={() => setActiveKey(segment.key)}
              />
            ))}
          </svg>
          <div className="diagram-donut-center" aria-hidden="true">
            <span className="diagram-donut-value">{percent}%</span>
            <span className="diagram-donut-label">{active.label}</span>
          </div>
        </div>

        <ul className="diagram-legend">
          {segments.map((segment) => (
            <li key={segment.key}>
              <button
                type="button"
                className="diagram-legend-button"
                data-active={segment.key === active.key}
                onMouseEnter={() => setActiveKey(segment.key)}
                onFocus={() => setActiveKey(segment.key)}
                onClick={() => setActiveKey(segment.key)}
              >
                <span
                  className="diagram-swatch"
                  data-tone={segment.tone}
                  aria-hidden="true"
                />
                <span className="diagram-legend-label">{segment.label}</span>
                <span className="diagram-legend-value">
                  {formatNumber.format(segment.value)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="diagram-detail" aria-live="polite">
        <p className="diagram-detail-value">
          <span className="diagram-detail-label">{active.label}</span>{" "}
          {formatNumber.format(active.value)} dari {formatNumber.format(total)}{" "}
          {nouns[view]} · {percent}% dari total
          {active.note ? ` · ${active.note}` : ""}
        </p>
      </div>
    </div>
  );
}
