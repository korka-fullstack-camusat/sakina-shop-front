"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // ── Données considérées fraîches pendant 5 min ─────────────────────────
        staleTime: 5 * 60 * 1000,

        // ── Garde le cache 15 min après que la query est inactive ──────────────
        gcTime: 15 * 60 * 1000,

        // ── Retry adaptatif ────────────────────────────────────────────────────
        // 4xx → jamais ; 502/503 (Render cold-start) → jusqu'à 5 essais
        retry: (failureCount, error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status && status >= 400 && status < 500) return false;   // 4xx → stop
          if (status === 502 || status === 503) return failureCount < 5; // Render dormant
          return failureCount < 2;                                       // autres 5xx / réseau
        },
        retryDelay: (attempt, error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response?.status;
          // 502/503 : intervalles longs — Render peut mettre 30-60s à démarrer
          if (status === 502 || status === 503) return Math.min(6_000 * (attempt + 1), 20_000);
          return Math.min(1000 * 2 ** attempt, 10_000);
        },

        // ── Pas de refetch au focus par défaut ────────────────────────────────
        refetchOnWindowFocus: false,

        // ── Refetch à la reconnexion réseau ───────────────────────────────────
        refetchOnReconnect: "always",
      },
      mutations: {
        retry: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: "14px" },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
