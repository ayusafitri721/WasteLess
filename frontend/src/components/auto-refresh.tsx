"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function AutoRefresh() {
  const router = useRouter();
  const lastRefresh = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    function refresh() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefresh.current < 5000) return;
      lastRefresh.current = now;
      router.refresh();
    }

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return null;
}
