import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { AuthArtwork } from "./auth-artwork";

export function AuthShell({
  mode,
  title,
  description,
  children,
}: {
  mode: "login" | "register" | "forgot" | "reset";
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <aside className="auth-visual">
        <div className="auth-visual-content">
          <Wordmark href="/" />
          <p className="auth-tagline">
            Kurangi food waste,
            <br />
            berbagi kebaikan.
          </p>
          <AuthArtwork />
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <Wordmark href="/" />
          </div>

          <header>
            <h1 className="display auth-title">{title}</h1>
            <p className="auth-description">{description}</p>
          </header>

          <nav className="auth-tabs" aria-label="Pilihan autentikasi">
            <Link
              href="/masuk"
              className="auth-tab"
              data-active={mode === "login"}
              aria-current={mode === "login" ? "page" : undefined}
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="auth-tab"
              data-active={mode === "register"}
              aria-current={mode === "register" ? "page" : undefined}
            >
              Daftar
            </Link>
          </nav>

          {children}

          <p className="auth-switch">
            {mode === "login" ? (
              <>
                Belum punya akun?{" "}
                <Link href="/daftar" className="auth-link">
                  Daftar sekarang
                </Link>
              </>
            ) : mode === "register" ? (
              <>
                Sudah punya akun?{" "}
                <Link href="/masuk" className="auth-link">
                  Masuk sekarang
                </Link>
              </>
            ) : (
              <>
                Ingin kembali?{" "}
                <Link href="/masuk" className="auth-link">
                  Masuk sekarang
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
