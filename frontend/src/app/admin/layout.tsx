"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, api } from "@/lib/api";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu, Bell, WifiOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ServerStatus = "checking" | "alive" | "sleeping";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const token    = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const router   = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");

  // ── Wake-up Render : health check avec retry agressif ──────────────────────
  // Render free tier peut mettre 30-60s à démarrer après inactivité
  useQuery({
    queryKey: ["server-health"],
    queryFn:  async () => {
      const r = await api.get("/health");
      setServerStatus("alive");
      return r.data;
    },
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      setServerStatus("sleeping");
      // Continuer à réessayer jusqu'à 20 fois (≈ 5 min max)
      if (status === 502 || status === 503 || !status) return failureCount < 20;
      return false; // autre erreur (4xx) → stop
    },
    retryDelay: (attempt) => {
      // 5s → 10s → 15s → 20s (max) — laisse le temps à Render de démarrer
      return Math.min(5_000 * (attempt + 1), 20_000);
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    enabled: !!token,
  });

  // Badge commandes — même queryKey que sidebar/dashboard → cache partagé
  const { data: orderStats } = useQuery({
    queryKey:        ["orders-stats"],
    queryFn:         () => ordersApi.stats().then((r) => r.data),
    refetchInterval: 60_000,
    enabled:         !!token && serverStatus === "alive",
  });
  const pendingCount = orderStats?.pending ?? 0;

  // Ferme le sidebar mobile au changement de page
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/");
  }, [hydrated, token, pathname, router]);

  // Spinner pendant l'hydratation
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Banner "serveur en démarrage" ───────────────────────────────── */}
        {serverStatus !== "alive" && (
          <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 text-sm font-medium
            ${serverStatus === "sleeping"
              ? "bg-amber-50 border-b border-amber-200 text-amber-800"
              : "bg-blue-50 border-b border-blue-100 text-blue-700"
            }`}
          >
            {serverStatus === "sleeping" ? (
              <>
                <WifiOff size={15} className="flex-shrink-0 text-amber-500" />
                <span>
                  Le serveur Render est en train de démarrer après une période d'inactivité.
                  Les données apparaîtront dans <strong>30–60 secondes</strong>…
                </span>
                <Loader2 size={14} className="flex-shrink-0 animate-spin text-amber-500 ml-auto" />
              </>
            ) : (
              <>
                <Loader2 size={14} className="flex-shrink-0 animate-spin text-blue-500" />
                <span>Connexion au serveur…</span>
              </>
            )}
          </div>
        )}

        {/* ── Mobile top bar ─────────────────────────────────────────────── */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between px-4 h-14">

            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo centré */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm
                              flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Sakina Shop"
                  width={28}
                  height={28}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="font-serif font-bold text-brand-950 text-base">
                Sakina <span className="text-brand-600">Admin</span>
              </span>
            </div>

            {/* Cloche avec badge commandes */}
            <Link
              href="/admin/commandes"
              className="relative p-2 text-gray-500 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors"
              aria-label="Commandes en attente"
            >
              <Bell size={20} />
              {pendingCount > 0 && (
                <>
                  {/* Badge numérique */}
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                                   bg-amber-500 text-white text-[10px] font-bold rounded-full
                                   flex items-center justify-center leading-none shadow-sm">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                  {/* Pulsation */}
                  <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px]
                                   bg-amber-400 rounded-full opacity-60 animate-ping" />
                </>
              )}
            </Link>

          </div>
        </header>

        {/* ── Contenu de la page ─────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
