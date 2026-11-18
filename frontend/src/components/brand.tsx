import Link from "next/link";
import { LeafMark } from "./ui/icons";

export function Wordmark({
  href = "/",
  tone = "default",
}: {
  href?: string;
  tone?: "default" | "light";
}) {
  return (
    <Link
      href={href}
      className={`wordmark ${tone === "light" ? "wordmark-light" : ""}`}
      aria-label="WasteLess, ke beranda"
    >
      <LeafMark />
      <span>
        Waste<span className="wordmark-less">Less</span>
      </span>
    </Link>
  );
}
