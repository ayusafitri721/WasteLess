import Link from "next/link";

export type ActionItem = {
  label: string;
  detail: string;
  href: string;
};

export function ActionNeeded({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <section className="panel p-5 sm:p-6">
        <p className="kicker">Perlu tindakan</p>
        <p className="mt-2 font-bold">Semua sudah tertangani.</p>
        <p className="mt-1 text-sm text-muted">
          Tidak ada reservasi, pengambilan, atau verifikasi yang menunggu Anda
          sekarang.
        </p>
      </section>
    );
  }

  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="action-title">
      <p className="kicker">Perlu tindakan</p>
      <h2 id="action-title" className="display mt-1 text-2xl">
        Yang menunggu Anda
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={`${item.label}-${item.href}`}>
            <Link
              href={item.href}
              className="block h-full rounded-xl border border-line p-4 transition-colors hover:bg-surface-soft"
            >
              <span className="block font-bold">{item.label}</span>
              <span className="mt-1 block text-sm text-muted">
                {item.detail}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
