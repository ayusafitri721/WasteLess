"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/format";

export type PickupEvent = {
  id: string;
  listingName: string;
  schedule: string;
  statusLabel: string;
  href: string;
};

const dayFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "short" });
const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function PickupCalendar({
  events,
  loading,
}: {
  events: PickupEvent[];
  loading?: boolean;
}) {
  const scheduled = events.filter((event) => event.schedule);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      key: dayKey(date),
      label: dayFormatter.format(date),
      date: dateFormatter.format(date),
      events: scheduled.filter(
        (event) => dayKey(new Date(event.schedule)) === dayKey(date),
      ),
    };
  });

  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="pickup-calendar-title">
      <p className="kicker">Jadwal ambil</p>
      <h2 id="pickup-calendar-title" className="display mt-1 text-2xl">
        Tujuh hari ke depan
      </h2>
      {loading ? (
        <p className="mt-4 text-sm text-muted">Memuat jadwal pengambilan...</p>
      ) : scheduled.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Belum ada jadwal pengambilan. Reservasi yang disetujui akan muncul di
          sini.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => (
            <div
              key={day.key}
              className="rounded-xl border border-line p-3"
              data-today={day.key === dayKey(today)}
            >
              <p className="text-xs font-bold text-muted">{day.label}</p>
              <p className="display-soft mt-0.5 text-sm">{day.date}</p>
              <div className="mt-2 space-y-1.5">
                {day.events.length === 0 ? (
                  <span className="text-xs text-muted">Kosong</span>
                ) : (
                  day.events.map((event) => (
                    <Link
                      key={event.id}
                      href={event.href}
                      className="block rounded-lg bg-brand-soft p-2 text-xs transition-colors hover:bg-brand-soft/70"
                      title={`${event.listingName} · ${formatDateTime(event.schedule)} · ${event.statusLabel}`}
                    >
                      <span className="block font-bold text-brand-deep">
                        {event.listingName}
                      </span>
                      <span className="mt-0.5 block text-muted">
                        {event.statusLabel}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
