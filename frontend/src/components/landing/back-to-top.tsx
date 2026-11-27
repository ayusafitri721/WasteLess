"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icons";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      setVisible(window.scrollY > 400);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!visible) return null;

  function scrollToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      className="back-to-top"
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
    >
      <Icon name="arrowUp" size={18} />
    </button>
  );
}
