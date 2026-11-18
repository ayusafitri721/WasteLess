"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User;
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: User }>("/users/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      router.replace("/masuk?s=expired");
    };

    window.addEventListener("wasteless:unauthorized", onUnauthorized);
    return () => {
      window.removeEventListener("wasteless:unauthorized", onUnauthorized);
    };
  }, [router]);

  const value = useMemo(
    () => ({ user, setUser, refresh }),
    [user, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useCurrentUser harus dipakai di dalam AuthProvider.");
  }
  return context;
}
