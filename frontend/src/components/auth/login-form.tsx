"use client";

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
  const [resetNotice, setResetNotice] = useState(false);
  const [socialNotice, setSocialNotice] = useState(false);

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
        <button
          type="button"
          className="auth-inline-link"
          onClick={() => setResetNotice((value) => !value)}
        >
          Lupa password?
        </button>
      </div>

      {resetNotice ? (
        <p className="auth-help" role="status">
          Reset password belum tersedia. Hubungi operator platform untuk
          bantuan akses.
        </p>
      ) : null}

      <Button type="submit" className="w-full" loading={loading}>
        Masuk
        {!loading ? <Icon name="arrowRight" size={18} /> : null}
      </Button>

      <div className="auth-divider">atau masuk dengan</div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          className="social-btn"
          onClick={() => setSocialNotice(true)}
        >
          <span className="social-google" aria-hidden="true">
            G
          </span>
          Google
        </button>
        <button
          type="button"
          className="social-btn"
          onClick={() => setSocialNotice(true)}
        >
          <Icon name="github" size={18} />
          GitHub
        </button>
      </div>

      {socialNotice ? (
        <p className="auth-help" role="status">
          Login dengan Google atau GitHub belum tersedia. Gunakan email dan
          password.
        </p>
      ) : null}
    </form>
  );
}
