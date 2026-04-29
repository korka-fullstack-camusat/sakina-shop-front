"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu, ShoppingBag, Bell } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const token    = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const router   = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Badge commandes — même queryKey que sidebar/dashboard → cache partagé
  const { data: orderStats } = useQuery({
    queryKey:        ["orders-stats"],
    queryFn:         () => ordersApi.stats().then((r) => r.data),
    refetchInterval: 20_000,
    enabled:         !!token,
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

        {/* ── Mobile top bar ─────────────────────────────────── */}
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
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center">
                <ShoppingBag className="text-white" size={13} />
              </div>
              <span className="font-serif font-bold text-brand-950 text-base">
                Sakina <span className="text-gold-600">Admin</span>
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
