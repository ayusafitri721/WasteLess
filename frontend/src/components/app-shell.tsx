"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { initials } from "@/lib/format";
import { roleLabels } from "@/lib/labels";
import type { Role, User } from "@/lib/types";
import { Wordmark } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { Icon, type IconName } from "./ui/icons";

type NavItem = { href: string; label: string; shortLabel?: string; icon: IconName };

const navigation: Record<Role, NavItem[]> = {
  provider: [
    { href: "/provider", label: "Ringkasan", icon: "home" },
    { href: "/provider/listing", label: "Listing", icon: "plus" },
    { href: "/provider/reservasi", label: "Reservasi", icon: "calendar" },
    { href: "/provider/distribusi", label: "Distribusi", icon: "truck" },
  ],
  receiver: [
    { href: "/receiver", label: "Ringkasan", icon: "home" },
    { href: "/receiver/makanan", label: "Cari makanan", shortLabel: "Makanan", icon: "search" },
    { href: "/receiver/reservasi", label: "Reservasi", icon: "calendar" },
    { href: "/receiver/distribusi", label: "Distribusi", icon: "truck" },
  ],
  admin: [
    { href: "/admin", label: "Ringkasan", icon: "home" },
    { href: "/admin/verifikasi", label: "Verifikasi", icon: "shield" },
  ],
};

function isActive(pathname: string, href: string) {
  if (href.split("/").filter(Boolean).length === 1) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const items = navigation[user.role];
  const activeItem =
    items.find((item) => isActive(pathname, item.href)) ?? items[0];

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/masuk");
      router.refresh();
    }
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Lewati ke konten utama
      </a>

      <div className="app-frame">
        <aside className="app-sidebar" aria-label="Navigasi utama">
          <div className="px-2">
            <Wordmark href={`/${user.role}`} tone="light" />
            <span className="role-pill mt-3">
              {roleLabels[user.role]}
            </span>
          </div>

          <nav className="sidebar-nav" aria-label="Menu akun">
            <p className="sidebar-label">Menu</p>
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="sidebar-link"
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={item.icon} size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <Link href="/akun" className="sidebar-account">
              <span className="sidebar-avatar" aria-hidden="true">
                {initials(user.name)}
              </span>
              <span className="min-w-0">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-meta">
                  {user.organizationName ?? roleLabels[user.role]}
                </span>
              </span>
            </Link>
            <button
              type="button"
              className="sidebar-link w-full text-left"
              onClick={logout}
              disabled={loggingOut}
            >
              <Icon name="logout" size={19} />
              {loggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </aside>

        <div className="app-body">
          <header className="app-topbar">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <Wordmark href={`/${user.role}`} />
              </div>
              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-xs text-muted">
                  {roleLabels[user.role]} / {activeItem.label}
                </p>
                <p className="truncate text-sm font-bold">
                  Halo, {user.name.split(" ")[0]}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <ThemeToggle compact />
              <Link
                href="/akun"
                className="topbar-user"
                aria-label={`Akun ${user.name}, ${roleLabels[user.role]}`}
              >
                <span className="topbar-avatar" aria-hidden="true">
                  {initials(user.name)}
                </span>
                <span className="hidden pr-2 sm:block">
                  <span className="topbar-user-name">
                    {user.name.split(" ")[0]}
                  </span>
                  <span className="topbar-user-role">
                    {user.organizationName ?? roleLabels[user.role]}
                  </span>
                </span>
              </Link>
            </div>
          </header>

          <main id="main" className="app-main">
            {children}
          </main>
        </div>
      </div>

      <nav className="bottom-nav lg:hidden" aria-label="Navigasi utama seluler">
        <div className="bottom-nav-inner">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bottom-nav-link"
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={item.icon} size={20} />
                {item.shortLabel ?? item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
