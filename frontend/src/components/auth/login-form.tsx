"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/errors";
import { homeForRole } from "@/lib/roles";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { AuthInput } from "./auth-input";
import { FormError } from "./form-error";

const REMEMBER_EVENT = "wasteless:remembered-email";

function subscribeRemembered(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(REMEMBER_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(REMEMBER_EVENT, callback);
  };
}

function getRememberedEmail() {
  return localStorage.getItem("wasteless-email") ?? "";
}

function getServerEmail() {
  return "";
}

export function LoginForm({ expired = false }: { expired?: boolean }) {
  const router = useRouter();
  const rememberedEmail = useSyncExternalStore(
    subscribeRemembered,
    getRememberedEmail,
    getServerEmail,
  );
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const email = emailInput ?? rememberedEmail;
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [oauthRole, setOauthRole] = useState<"provider" | "receiver">(
    "receiver",
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as {
        data?: { user: User };
        error?: { code?: string; message?: string; details?: unknown };
      };

      if (!response.ok || !body.data?.user) {
        throw new ApiError(
          response.status,
          body.error?.code ?? "LOGIN_FAILED",
          body.error?.message ?? "Email atau password tidak cocok.",
          body.error?.details,
        );
      }

      if (remember) {
        localStorage.setItem("wasteless-email", email);
      } else {
        localStorage.removeItem("wasteless-email");
      }
      window.dispatchEvent(new Event(REMEMBER_EVENT));

      router.replace(homeForRole(body.data.user.role));
      router.refresh();
    } catch (submitError) {
      setError(submitError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
      {expired ? (
        <div className="notice notice-warning">
          <p className="notice-title">Sesi berakhir</p>
          <p className="notice-body">Masuk lagi untuk melanjutkan.</p>
        </div>
      ) : null}

      <FormError error={error} />

      <AuthInput
        id="email"
        name="email"
        type="email"
        label="Email"
        icon="mail"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmailInput(event.target.value)}
      />

      <AuthInput
        id="password"
        name="password"
        type="password"
        label="Password"
        icon="lock"
        autoComplete="current-password"
        required
        revealable
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <div className="auth-row">
        <label className="auth-check" htmlFor="remember">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          Ingat saya
        </label>
        <Link href="/lupa-password" className="auth-inline-link">
          Lupa password?
        </Link>
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        Masuk
        {!loading ? <Icon name="arrowRight" size={18} /> : null}
      </Button>

      <div className="auth-divider">atau masuk dengan</div>

      <div className="oauth-role">
        <span>Daftar sebagai</span>
        <div className="oauth-role-group" role="group" aria-label="Peran OAuth">
          <button
            type="button"
            className="oauth-role-option"
            data-active={oauthRole === "provider"}
            aria-pressed={oauthRole === "provider"}
            onClick={() => setOauthRole("provider")}
          >
            Penyedia
          </button>
          <button
            type="button"
            className="oauth-role-option"
            data-active={oauthRole === "receiver"}
            aria-pressed={oauthRole === "receiver"}
            onClick={() => setOauthRole("receiver")}
          >
            Penerima
          </button>
        </div>
      </div>

      <div className="grid gap-2.5">
        <a
          className="social-btn"
          href={`/api/auth/oauth/start?provider=google&role=${oauthRole}`}
        >
          <span className="social-google" aria-hidden="true">
            G
          </span>
          Google
        </a>
      </div>

      <p className="auth-help">
        Akun baru memakai peran yang dipilih di atas. Email Google harus
        terverifikasi.
      </p>
    </form>
  );
}
