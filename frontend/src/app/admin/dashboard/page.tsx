"use client";
import { useQuery } from "@tanstack/react-query";
import { productsApi, ordersApi } from "@/lib/api";
import {
  Package, CheckCircle, Archive, Film,
  TrendingUp, Eye, ShoppingCart, Bell,
  ChevronRight, Clock, AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn:  () => productsApi.adminList().then((r) => r.data),
  });

  const { data: orderStats } = useQuery({
    queryKey:        ["orders-stats"],
    queryFn:         () => ordersApi.stats().then((r) => r.data),
    refetchInterval: 60_000,   // 1 min suffit pour les stats admin
  });

  const pending = orderStats?.pending ?? 0;

  const productStats = {
    total:     products.length,
    published: products.filter((p) => p.is_published).length,
    draft:     products.filter((p) => p.status === "draft").length,
    withVideo: products.filter((p) => p.video_url).length,
  };

  const publishRate =
    productStats.total > 0
      ? Math.round((productStats.published / productStats.total) * 100)
      : 0;

  const productCards = [
    { label: "Total produits", value: productStats.total,     icon: Package,      bg: "bg-blue-50",    text: "text-blue-600"    },
    { label: "Publiés",        value: productStats.published, icon: CheckCircle,  bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Brouillons",     value: productStats.draft,     icon: Archive,      bg: "bg-amber-50",   text: "text-amber-600"   },
    { label: "Avec vidéo IA",  value: productStats.withVideo, icon: Film,         bg: "bg-brand-50",   text: "text-brand-600"   },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page title ─────────────────────────────────────────── */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-400 text-sm mt-1">
          Bienvenue dans votre espace d&apos;administration Sakina Shop
        </p>
      </div>

      {/* ── Notification commandes en attente ──────────────────── */}
      {pending > 0 && (
        <Link
          href="/admin/commandes"
          className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 border-amber-200
                     bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all
                     group cursor-pointer shadow-sm"
        >
          {/* Icône animée */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
              <Bell size={20} className="text-white" />
            </div>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-amber-400 opacity-60 animate-ping" />
          </div>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-900 text-sm sm:text-base">
              {pending} nouvelle{pending > 1 ? "s" : ""} commande{pending > 1 ? "s" : ""} en attente
            </p>
            <p className="text-amber-700 text-xs sm:text-sm mt-0.5">
              Cliquez pour consulter et traiter les commandes
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight
            size={20}
            className="text-amber-500 flex-shrink-0 group-hover:translate-x-1 transition-transform"
          />
        </Link>
      )}

      {/* ── Résumé commandes ───────────────────────────────────── */}
      {orderStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Commandes total",   value: orderStats.total,     color: "text-gray-700",    bg: "bg-gray-50"    },
            { label: "En attente",        value: orderStats.pending,   color: "text-amber-700",   bg: "bg-amber-50"   },
            { label: "Livrées",           value: orderStats.delivered, color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "CA livré (FCFA)",   value: orderStats.revenue > 0
                ? orderStats.revenue.toLocaleString("fr-FR")
                : "—",
              color: "text-brand-700", bg: "bg-brand-50"
            },
          ].map(({ label, value, color, bg }) => (
            <Link
              key={label}
              href="/admin/commandes"
              className={`${bg} rounded-2xl p-4 sm:p-5 border border-gray-100 hover:shadow-md
                          transition-all cursor-pointer group`}
            >
              <p className={`text-2xl sm:text-3xl font-bold font-serif ${color} group-hover:scale-105 transition-transform origin-left`}>
                {value}
              </p>
              <p className="text-gray-500 text-xs mt-1">{label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* ── Produits stat cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {productCards.map(({ label, value, icon: Icon, bg, text }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`inline-flex p-2.5 rounded-xl ${bg} ${text}`}>
                <Icon size={18} />
              </div>
              <TrendingUp size={13} className="text-gray-200 mt-1" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Bottom row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Taux de publication */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm">
            <Eye size={15} className="text-brand-600" />
            Taux de publication
          </h2>
          <p className="font-serif text-4xl font-bold text-brand-700 mb-3">{publishRate}%</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="h-2 rounded-full brand-gradient transition-all duration-700"
              style={{ width: `${publishRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {productStats.published} publié(s) sur {productStats.total} produit(s)
          </p>
        </div>

        {/* Commandes récentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <ShoppingCart size={15} className="text-brand-600" />
              Commandes en attente
            </h2>
            <Link
              href="/admin/commandes"
              className="text-xs text-brand-600 hover:underline font-medium"
            >
              Voir toutes →
            </Link>
          </div>

          <RecentOrders />
        </div>
      </div>
    </div>
  );
}

// ── Sous-composant : liste des dernières commandes pending ────────────────────
function RecentOrders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey:        ["orders-recent"],
    queryFn:         () => ordersApi.list(0, 5, "pending").then((r) => r.data),
    refetchInterval: 20_000,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-2" />
        Chargement…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircle size={28} className="text-emerald-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Aucune commande en attente 🎉</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {orders.map((order) => (
        <Link
          key={order.id}
          href="/admin/commandes"
          className="flex items-center gap-3 sm:gap-4 px-5 py-3.5
                     hover:bg-amber-50/60 transition-colors group"
        >
          {/* Alert dot */}
          <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />

          {/* Customer info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-brand-700 transition-colors">
              {order.customer_name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {order.items.length} article{order.items.length > 1 ? "s" : ""}
              {" · "}
              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>

          {/* Total */}
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-sm text-brand-700">
              {order.total.toLocaleString("fr-FR")} {order.currency}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                             bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full mt-0.5">
              <Clock size={9} /> En attente
            </span>
          </div>

          <ChevronRight size={15} className="text-gray-300 group-hover:text-brand-500 flex-shrink-0 transition-colors" />
        </Link>
      ))}
    </div>
  );
}
