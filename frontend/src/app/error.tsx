"use client";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="shell flex min-h-dvh max-w-2xl flex-col justify-center py-16">
      <Wordmark />
      <p className="kicker mt-10">Koneksi terputus</p>
      <h1 className="display mt-3 text-4xl">
        Halaman ini tidak bisa memuat data.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
        Server backend mungkin belum berjalan atau koneksi sedang terganggu.
        Tidak ada data cadangan yang ditampilkan. Anda bisa mencoba memuat
        ulang halaman.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Coba muat ulang</Button>
      </div>
    </main>
  );
}
