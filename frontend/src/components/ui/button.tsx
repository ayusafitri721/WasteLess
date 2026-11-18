import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "secondary" | "quiet" | "danger";

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  secondary: "btn-secondary",
  quiet: "btn-quiet",
  danger: "btn-danger",
};

export function Button({
  variant = "primary",
  className = "",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
}) {
  return (
    <button
      className={`btn ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? "Memproses..." : children}
    </button>
  );
}
