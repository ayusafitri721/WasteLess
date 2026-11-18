"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./ui/icons";

const THEME_EVENT = "wasteless:theme";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): "light" | "dark" {
  return "light";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const label =
    theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap";

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("wasteless-theme", next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  if (compact) {
    return (
      <button
        type="button"
        className="btn btn-quiet btn-icon"
        onClick={toggle}
        aria-label={label}
        title={label}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-quiet whitespace-nowrap px-2 text-sm sm:px-3"
      onClick={toggle}
      aria-label={label}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
      <span className="sm:hidden">{theme === "dark" ? "Terang" : "Gelap"}</span>
      <span className="hidden sm:inline">
        {theme === "dark" ? "Mode terang" : "Mode gelap"}
      </span>
    </button>
  );
}
