"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { User } from "@/lib/types";
import { Wordmark } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { Icon } from "./ui/icons";

const sectionLinks = [
  { id: "beranda", href: "/#beranda", label: "Beranda" },
  { id: "tentang", href: "/#tentang", label: "Tentang" },
  { id: "cara-kerja", href: "/#cara-kerja", label: "Cara Kerja" },
  { id: "jelajahi", href: "/#jelajahi", label: "Jelajahi" },
  { id: "fitur", href: "/#fitur", label: "Fitur" },
];

function dashboardHref(user: User) {
  if (user.role === "provider") return "/provider";
  if (user.role === "receiver") return "/receiver";
  return "/admin";
}

export function PublicHeader({ user }: { user?: User | null }) {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState("beranda");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (pathname !== "/") return;

    const visibility = new Map<string, IntersectionObserverEntry>();
    const nodes = sectionLinks
      .map((link) => document.getElementById(link.id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibility.set(entry.target.id, entry);
          } else {
            visibility.delete(entry.target.id);
          }
        }

        const candidates = [...visibility.values()].sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        );
        const current =
          candidates.find((entry) => entry.boundingClientRect.top <= 140) ??
          candidates[0];

        if (current) {
          setActiveId(current.target.id);
        }
      },
      {
        rootMargin: "-80px 0px -45% 0px",
        threshold: [0, 0.01, 0.25, 0.5],
      },
    );

    for (const node of nodes) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function handleSectionClick(
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    if (pathname !== "/") return;

    const node = document.getElementById(id);
    if (!node) return;

    event.preventDefault();
    window.history.replaceState(null, "", `/#${id}`);

    const top = node.getBoundingClientRect().top + window.scrollY - 84;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });

    setActiveId(id);
    setMenuOpen(false);
  }

  function renderLinks() {
    return sectionLinks.map((link) => {
      const active = pathname === "/" && activeId === link.id;
      return (
        <Link
          key={link.id}
          href={link.href}
          className="public-nav-link"
          data-active={active}
          aria-current={active ? "page" : undefined}
          onClick={(event) => handleSectionClick(event, link.id)}
        >
          <span className="public-nav-label" data-label={link.label}>
            <span>{link.label}</span>
          </span>
        </Link>
      );
    });
  }

  return (
    <>
      <span ref={sentinelRef} className="nav-sentinel" aria-hidden="true" />
      <header
        className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur"
        data-scrolled={scrolled}
      >
        <div className="shell public-header-inner">
          <Wordmark />

          <nav className="public-nav" aria-label="Navigasi utama">
            {renderLinks()}
          </nav>

          <div className="public-header-actions">
            <ThemeToggle compact />
            {user ? (
              <>
                <Link href="/akun" className="public-entry-link hidden md:inline-block">
                  Akun
                </Link>
                <Link href={dashboardHref(user)} className="btn btn-primary hidden md:inline-flex">
                  Buka dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/masuk" className="public-entry-link hidden md:inline-block">
                  Masuk
                </Link>
                <Link href="/daftar" className="btn btn-primary hidden md:inline-flex">
                  Buat akun
                </Link>
              </>
            )}
            <button
              type="button"
              className="public-menu-toggle"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            >
              <Icon name={menuOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div id="mobile-navigation" className="mobile-nav-panel">
            <div className="shell">
              <nav className="mobile-nav-list" aria-label="Navigasi seluler">
                {renderLinks()}
              </nav>
              <div className="mobile-nav-actions">
                {user ? (
                  <>
                    <Link href="/akun" className="btn btn-secondary">
                      Akun
                    </Link>
                    <Link href={dashboardHref(user)} className="btn btn-primary">
                      Buka dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/masuk" className="btn btn-secondary">
                      Masuk
                    </Link>
                    <Link href="/daftar" className="btn btn-primary">
                      Buat akun
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </header>
    </>
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
