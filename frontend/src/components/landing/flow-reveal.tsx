"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Reveal tiap langkah sekali saat alur masuk viewport untuk memandu urutan,
// bukan animasi berulang.
export function FlowReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.dataset.visible = "true";
        observer.disconnect();
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flow-reveal">
      {children}
    </div>
  );
}
