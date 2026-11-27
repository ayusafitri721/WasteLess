"use client";

import { ErrorState, LoadingState } from "@/components/ui/states";
import type { PublicStats } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export function ImpactStats() {
  const stats = useApi<PublicStats>("/public/stats");

  return (
    <section className="landing-stats" aria-labelledby="stats-title">
      <div className="shell">
        <p className="kicker">Dampak tercatat</p>
        <h2 id="stats-title" className="display mt-3 max-w-[24ch] text-3xl sm:text-4xl">
          Angka yang berasal dari kegiatan nyata di platform.
        </h2>

        {stats.loading ? (
          <div className="mt-8">
            <LoadingState label="Memuat angka dampak..." />
          </div>
        ) : stats.error ? (
          <div className="mt-8">
            <ErrorState message={stats.error} onRetry={stats.refetch} />
          </div>
        ) : stats.data ? (
          <dl className="impact-stats">
            <div>
              <dt>Penyedia</dt>
              <dd>{stats.data.users.providers}</dd>
            </div>
            <div>
              <dt>Penerima</dt>
              <dd>{stats.data.users.receivers}</dd>
            </div>
            <div>
              <dt>Listing tercatat</dt>
              <dd>{stats.data.listings}</dd>
            </div>
            <div>
              <dt>Distribusi selesai</dt>
              <dd>{stats.data.distributions.completed}</dd>
            </div>
          </dl>
        ) : null}

        <p className="mt-4 text-xs text-muted">
          Dihitung langsung dari data yang tersimpan, bukan perkiraan.
        </p>
      </div>
    </section>
  );
}
