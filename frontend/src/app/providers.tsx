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
        // Évite de refetcher à chaque navigation (était 30s → inutile)
        staleTime: 5 * 60 * 1000,          // 5 minutes

        // ── Garde le cache 15 min après que la query est inactive ──────────────
        gcTime: 15 * 60 * 1000,            // 15 minutes

        // ── Pas de retry en boucle sur erreur 4xx ─────────────────────────────
        retry: (failureCount, error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status && status >= 400 && status < 500) return false; // 4xx → pas de retry
          return failureCount < 2; // max 2 retries sur erreur réseau/5xx
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000), // backoff exponentiel

        // ── Pas de refetch au focus par défaut (surcharge inutile) ─────────────
        refetchOnWindowFocus: false,

        // ── Pas de refetch automatique à la reconnexion (le cache suffit) ──────
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
