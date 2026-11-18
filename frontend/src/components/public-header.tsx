import Link from "next/link";
import type { User } from "@/lib/types";
import { Wordmark } from "./brand";
import { ThemeToggle } from "./theme-toggle";

export function PublicHeader({ user }: { user?: User | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="shell flex min-h-16 items-center justify-between gap-2 sm:gap-4">
        <Wordmark />
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          {user ? (
            <>
              <Link href="/akun" className="btn btn-quiet whitespace-nowrap px-2 text-sm sm:px-3">
                Akun
              </Link>
              <Link
                href={
                  user.role === "provider"
                    ? "/provider"
                    : user.role === "receiver"
                      ? "/receiver"
                      : "/admin"
                }
                className="btn btn-primary whitespace-nowrap px-3 text-sm sm:px-4"
              >
                Buka dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/masuk"
                className="btn btn-quiet whitespace-nowrap px-2 text-sm max-[419px]:hidden sm:px-3"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="btn btn-primary whitespace-nowrap px-3 text-sm sm:px-4"
              >
                Buat akun
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="shell flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Wordmark />
          <p className="mt-2 max-w-md text-sm text-muted">
            Pencatatan makanan berlebih, reservasi, dan distribusi untuk
            penyedia serta penerima terverifikasi.
          </p>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm" aria-label="Navigasi kaki">
          <Link href="/masuk" className="link-underline">
            Masuk
          </Link>
          <Link href="/daftar" className="link-underline">
            Buat akun
          </Link>
        </nav>
      </div>
    </footer>
  );
}
