"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api";
import {
  LayoutDashboard, Package, Film, Globe2,
  ShoppingCart, Users, Settings, LogOut,
  ShoppingBag, X, Sparkles, ChevronRight, Bell,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const SECTIONS = [
  {
    label: "Principal",
    links: [
      { href: "/admin/dashboard",    label: "Dashboard",       icon: LayoutDashboard, badgeKey: null              },
      { href: "/admin/products",     label: "Produits",        icon: Package,         badgeKey: null              },
      { href: "/admin/commandes",    label: "Commandes",       icon: ShoppingCart,    badgeKey: "orders_pending"  },
    ],
  },
  {
    label: "Création & Publication",
    links: [
      { href: "/admin/videos",       label: "Vidéos IA",       icon: Film,   badgeKey: null },
      { href: "/admin/social",       label: "Réseaux Sociaux", icon: Globe2, badgeKey: null },
    ],
  },
  {
    label: "Gestion",
    links: [
      { href: "/admin/utilisateurs", label: "Utilisateurs",    icon: Users,    badgeKey: null },
      { href: "/admin/parametres",   label: "Paramètres",      icon: Settings, badgeKey: null },
    ],
  },
];

// ── Modal de confirmation de déconnexion ──────────────────────────────────────
function LogoutConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-slide-up z-10">
        {/* Icône */}
        <div className="flex items-center justify-center mb-5">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
            <LogOut size={24} className="text-red-500" />
          </div>
        </div>

        {/* Texte */}
        <h2 className="font-serif text-xl font-bold text-gray-900 text-center mb-2">
          Se déconnecter ?
        </h2>
        <p className="text-gray-400 text-sm text-center leading-relaxed mb-7">
          Vous serez redirigé vers la boutique.
          Pour revenir ici, utilisez le bouton{" "}
          <span className="font-semibold text-gray-600">Se connecter</span>.
        </p>

        {/* Warning */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100
                        rounded-2xl px-4 py-3 mb-6">
          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Toutes les données non sauvegardées seront perdues.
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-3 text-sm font-semibold text-gray-600 border border-gray-200
                       rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="py-3 text-sm font-semibold text-white bg-red-500
                       rounded-2xl hover:bg-red-600 transition-colors shadow-md
                       shadow-red-900/20 flex items-center justify-center gap-2"
          >
            <LogOut size={15} /> Déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const logout   = useAuthStore((s) => s.logout);
  const router   = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: orderStats } = useQuery({
    queryKey:        ["orders-stats"],
    queryFn:         () => ordersApi.stats().then((r) => r.data),
    refetchInterval: 20_000,
  });

  const badges: Record<string, number> = {
    orders_pending: orderStats?.pending ?? 0,
  };

  const handleLogoutConfirmed = () => {
    setShowConfirm(false);
    onClose();
    logout();
    router.push("/");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shadow-md">
            <ShoppingBag className="text-white" size={16} />
          </div>
          <div className="leading-none">
            <span className="font-serif font-bold text-white text-base">Sakina</span>
            <span className="font-serif font-bold text-gold-400 text-base"> Shop</span>
            <p className="text-white/30 text-[9px] font-semibold uppercase tracking-widest mt-0.5">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {SECTIONS.map(({ label, links }) => (
          <div key={label}>
            <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">{label}</p>
            <div className="space-y-0.5">
              {links.map(({ href, label: lbl, icon: Icon, badgeKey }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                const count  = badgeKey ? (badges[badgeKey] ?? 0) : 0;
                return (
                  <Link key={href} href={href} onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "gold-gradient text-white shadow-md"
                        : "text-white/55 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    <span className="flex-1">{lbl}</span>
                    {count > 0 && (
                      <span className={cn(
                        "min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center",
                        active ? "bg-white/25 text-white" : "bg-amber-500 text-white animate-pulse"
                      )}>
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                    {active && count === 0 && <ChevronRight size={13} className="opacity-60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Alerte ou tip */}
      {(orderStats?.pending ?? 0) > 0 ? (
        <Link href="/admin/commandes" onClick={onClose}
          className="mx-3 mb-3 p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/30
                     hover:bg-amber-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={13} className="text-amber-300" />
            <span className="text-[11px] text-amber-300 font-semibold">
              {orderStats!.pending} commande{orderStats!.pending > 1 ? "s" : ""} en attente
            </span>
          </div>
          <p className="text-amber-300/60 text-[10px]">Appuyer pour traiter →</p>
        </Link>
      ) : (
        <div className="mx-3 mb-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={12} className="text-gold-400" />
            <span className="text-[11px] text-gold-400 font-semibold">Astuce</span>
          </div>
          <p className="text-white/35 text-[10px] leading-relaxed">
            Générez une vidéo IA puis publiez sur TikTok &amp; Snapchat en 1 clic.
          </p>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-red-400/80
                     hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut size={17} /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-brand-950 min-h-screen flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile backdrop */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-brand-950 flex flex-col",
          "transition-transform duration-300 ease-in-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>

      {/* Logout confirmation modal */}
      {showConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogoutConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
