"use client";

import { useCallback, useEffect, useReducer } from "react";
import { apiFetch } from "./api";
import { errorMessage } from "./errors";

type ApiState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

type ApiAction<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "error"; error: string };

function reducer<T>(state: ApiState<T>, action: ApiAction<T>): ApiState<T> {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { data: action.data, error: null, loading: false };
    case "error":
      return { data: null, error: action.error, loading: false };
  }
}

export function useApi<T>(path: string) {
  const [state, dispatch] = useReducer(reducer<T>, {
    data: null,
    error: null,
    loading: true,
  });
  const [version, setVersion] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: "start" });

    apiFetch<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          dispatch({ type: "success", data });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof Error && error.name === "AbortError") return;
        dispatch({ type: "error", error: errorMessage(error) });
      });

    return () => controller.abort();
  }, [path, version]);

  const refetch = useCallback(() => setVersion(), []);

  return { ...state, refetch };
}
