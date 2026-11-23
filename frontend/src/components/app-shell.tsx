"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { initials } from "@/lib/format";
import { roleLabels } from "@/lib/labels";
import type { Role, User } from "@/lib/types";
import { Wordmark } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { Icon, LeafMark, type IconName } from "./ui/icons";

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

const SIDEBAR_STORAGE_KEY = "wasteless-sidebar-collapsed";

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
  const [collapsed, setCollapsed] = useState(false);
  const items = navigation[user.role];
  const activeItem =
    items.find((item) => isActive(pathname, item.href)) ?? items[0];

  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  }

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

      <div className="app-frame" data-sidebar-collapsed={collapsed}>
        <aside
          className="app-sidebar"
          data-collapsed={collapsed}
          aria-label="Navigasi utama"
        >
          <div className="sidebar-header">
            {collapsed ? (
              <Link
                href={`/${user.role}`}
                className="sidebar-leaf"
                aria-label="WasteLess, ke beranda"
                title="WasteLess"
              >
                <LeafMark />
              </Link>
            ) : (
              <Wordmark href={`/${user.role}`} tone="light" />
            )}
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-expanded={!collapsed}
              aria-controls="sidebar-navigation"
              aria-label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
              title={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
            >
              <Icon name={collapsed ? "chevronsRight" : "chevronsLeft"} size={18} />
            </button>
          </div>

          <span className="sidebar-role">{roleLabels[user.role]}</span>

          <nav
            id="sidebar-navigation"
            className="sidebar-nav"
            aria-label="Menu akun"
          >
            <div className="sidebar-section">
              <p className="sidebar-label">Menu utama</p>
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="sidebar-link"
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon name={item.icon} size={19} />
                    <span className="sidebar-link-text">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="sidebar-section">
              <p className="sidebar-label">Akun</p>
              <Link
                href="/akun"
                className="sidebar-link"
                data-active={pathname === "/akun"}
                aria-label={collapsed ? "Pengaturan akun" : undefined}
                title={collapsed ? "Pengaturan akun" : undefined}
              >
                <Icon name="user" size={19} />
                <span className="sidebar-link-text">Pengaturan akun</span>
              </Link>
              <button
                type="button"
                className="sidebar-link w-full text-left"
                onClick={logout}
                disabled={loggingOut}
                aria-label={collapsed ? "Keluar" : undefined}
                title={collapsed ? "Keluar" : undefined}
              >
                <Icon name="logout" size={19} />
                <span className="sidebar-link-text">
                  {loggingOut ? "Keluar..." : "Keluar"}
                </span>
              </button>
            </div>
          </nav>

          <div className="sidebar-footer">
            <Link
              href="/akun"
              className="sidebar-account"
              aria-label={collapsed ? `Akun ${user.name}` : undefined}
              title={collapsed ? user.name : undefined}
            >
              <span className="sidebar-avatar" aria-hidden="true">
                {initials(user.name)}
              </span>
              <span className="sidebar-account-text">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-meta">
                  {user.organizationName ?? roleLabels[user.role]}
                </span>
              </span>
              <Icon name="chevronRight" size={16} className="sidebar-account-chevron" />
            </Link>
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
