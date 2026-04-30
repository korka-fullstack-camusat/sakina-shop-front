"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  ShoppingCart, CheckCircle, Truck, Package,
  XCircle, Clock, Printer, Search, X,
  Phone, MapPin, Calendar, ChevronRight,
} from "lucide-react";
import { printInvoice } from "@/lib/invoice";
import { cn } from "@/lib/utils";

// ── Statut config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Order["status"], { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:   { label: "En attente",  color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-500",   icon: Clock       },
  confirmed: { label: "Confirmée",   color: "bg-blue-50 text-blue-700 border-blue-200",        dot: "bg-blue-500",    icon: CheckCircle },
  shipped:   { label: "Expédiée",    color: "bg-indigo-50 text-indigo-700 border-indigo-200",  dot: "bg-indigo-500",  icon: Truck       },
  delivered: { label: "Livrée",      color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: Package   },
  cancelled: { label: "Annulée",     color: "bg-red-50 text-red-600 border-red-200",            dot: "bg-red-500",     icon: XCircle    },
};

const STATUS_FLOW: Order["status"][] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

// ── Bottom sheet — détail commande ────────────────────────────────────────────
function OrderDetailSheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient();
  const cfg = STATUS_CONFIG[order.status];
  const Icon = cfg.icon;

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: Order["status"] }) =>
      ordersApi.updateStatus(order.id, status),
    onSuccess: (res) => {
      const updated = res.data;
      toast.success(
        updated.invoice_number
          ? `Commande confirmée — Reçu ${updated.invoice_number} prêt`
          : "Statut mis à jour"
      );
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders-stats"] });
      onClose();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const isPending = order.status === "pending";
  const isConfirmed = order.status === "confirmed" || order.status === "shipped" || order.status === "delivered";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
                      max-h-[90vh] overflow-y-auto animate-slide-up lg:max-w-2xl lg:mx-auto">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-3 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">
              Commande de {order.customer_name}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
                cfg.color
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </span>
              {order.invoice_number && (
                <span className="text-xs text-gold-700 bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-full font-semibold">
                  {order.invoice_number}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Client info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Informations client
            </h3>
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <Phone size={14} className="text-brand-500 flex-shrink-0" />
              <span>{order.customer_phone}</span>
            </div>
            {order.customer_email && (
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <span className="text-brand-500 flex-shrink-0 text-xs">@</span>
                <span>{order.customer_email}</span>
              </div>
            )}
            <div className="flex items-start gap-2.5 text-sm text-gray-700">
              <MapPin size={14} className="text-brand-500 flex-shrink-0 mt-0.5" />
              <span>{order.customer_address}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-400">
              <Calendar size={14} className="flex-shrink-0" />
              <span>{new Date(order.created_at).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit"
              })}</span>
            </div>
            {order.payment_method && (
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <span className="text-brand-500 flex-shrink-0 text-xs">💳</span>
                <span className="capitalize">{order.payment_method.replace("_", " ")}</span>
              </div>
            )}
          </div>

          {/* Produits commandés */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Produits commandés
            </h3>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-gray-100
                                        rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.product_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.unit_price.toLocaleString("fr-FR")} {item.currency} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand-700">
                    {(item.unit_price * item.quantity).toLocaleString("fr-FR")} {item.currency}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between mt-3 px-4 py-3.5
                            brand-gradient rounded-xl text-white">
              <span className="font-semibold text-sm">Total commande</span>
              <span className="font-serif font-bold text-xl">
                {order.total.toLocaleString("fr-FR")} {order.currency}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
              <p className="text-xs font-bold text-amber-600 mb-1">Note</p>
              <p className="text-sm text-amber-800">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-8 pt-2 space-y-3 border-t border-gray-100">
          {/* Pending → Valider / Rejeter */}
          {isPending && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => statusMutation.mutate({ status: "confirmed" })}
                disabled={statusMutation.isPending}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl
                           brand-gradient text-white font-semibold text-sm shadow-md
                           hover:opacity-90 disabled:opacity-60 transition-all"
              >
                <CheckCircle size={17} />
                {statusMutation.isPending ? "…" : "Valider"}
              </button>
              <button
                onClick={() => statusMutation.mutate({ status: "cancelled" })}
                disabled={statusMutation.isPending}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl
                           bg-red-500 text-white font-semibold text-sm shadow-md
                           hover:bg-red-600 disabled:opacity-60 transition-all"
              >
                <XCircle size={17} />
                {statusMutation.isPending ? "…" : "Rejeter"}
              </button>
            </div>
          )}

          {/* Confirmed → mark as shipped */}
          {order.status === "confirmed" && (
            <button
              onClick={() => statusMutation.mutate({ status: "shipped" })}
              disabled={statusMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                         bg-indigo-500 text-white font-semibold text-sm shadow-md
                         hover:bg-indigo-600 disabled:opacity-60 transition-all"
            >
              <Truck size={17} />
              Marquer comme expédiée
            </button>
          )}

          {/* Shipped → mark as delivered */}
          {order.status === "shipped" && (
            <button
              onClick={() => statusMutation.mutate({ status: "delivered" })}
              disabled={statusMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                         bg-emerald-500 text-white font-semibold text-sm shadow-md
                         hover:bg-emerald-600 disabled:opacity-60 transition-all"
            >
              <Package size={17} />
              Marquer comme livrée
            </button>
          )}

          {/* Print receipt — once confirmed/delivered */}
          {(isConfirmed || order.status === "delivered") && order.invoice_number && (
            <button
              onClick={() => printInvoice(order)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                         bg-gold-50 border border-gold-200 text-gold-700 font-semibold text-sm
                         hover:bg-gold-100 transition-all"
            >
              <Printer size={17} />
              Imprimer le reçu — {order.invoice_number}
            </button>
          )}

          {/* Close */}
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm text-gray-500 hover:bg-gray-100 transition-colors font-medium">
            Fermer
          </button>
        </div>
      </div>
    </>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function CommandesPage() {
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<Order["status"] | "all">("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn:  () => ordersApi.list().then((r) => r.data),
    refetchInterval: 20_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["orders-stats"],
    queryFn:  () => ordersApi.stats().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const filtered = orders.filter((o) => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Commandes</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gérez et suivez toutes les commandes client</p>
      </div>

      {/* Stats — masquées sur mobile */}
      {stats && (
        <div className="hidden sm:grid sm:grid-cols-6 gap-3">
          {[
            { label: "Total",      value: stats.total,     color: "text-gray-700"    },
            { label: "Attente",    value: stats.pending,   color: "text-amber-600"   },
            { label: "Confirmées", value: stats.confirmed, color: "text-blue-600"    },
            { label: "Expédiées",  value: stats.shipped,   color: "text-indigo-600"  },
            { label: "Livrées",    value: stats.delivered, color: "text-emerald-600" },
            { label: "Annulées",   value: stats.cancelled, color: "text-red-500"     },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-center">
              <p className={`text-2xl font-bold font-serif ${color}`}>{value}</p>
              <p className="text-gray-400 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue */}
      {stats && stats.revenue > 0 && (
        <div className="brand-gradient rounded-2xl p-4 sm:p-5 flex items-center justify-between text-white shadow-md">
          <div>
            <p className="text-white/70 text-xs sm:text-sm">Chiffre d&apos;affaires (livraisons)</p>
            <p className="font-serif text-2xl sm:text-3xl font-bold mt-0.5">
              {stats.revenue.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
          <ShoppingCart size={36} className="text-white/20" />
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
          />
        </div>

        {/* Filtre mobile → select compact */}
        <div className="sm:hidden">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="w-full py-2.5 px-4 text-sm font-semibold border border-gray-200 rounded-xl
                       bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
          >
            <option value="all">Toutes les commandes</option>
            {STATUS_FLOW.map((s) => {
              const count = stats ? (stats as Record<string, number>)[s] : 0;
              return (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label}{count > 0 ? ` (${count})` : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* Filtre desktop → boutons tabs */}
        <div className="hidden sm:flex gap-2 flex-wrap">
          {(["all", ...STATUS_FLOW] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                filter === s
                  ? "brand-gradient text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300"
              )}
            >
              {s === "all" ? "Toutes" : STATUS_CONFIG[s].label}
              {s !== "all" && stats && (stats as Record<string, number>)[s] > 0 && (
                <span className="ml-1.5 bg-white/25 text-white rounded-full px-1.5 text-[10px]">
                  {(stats as Record<string, number>)[s]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          Chargement des commandes…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-14 text-center shadow-sm border border-gray-100">
          <ShoppingCart size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">Aucune commande</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((order) => {
            const cfg  = STATUS_CONFIG[order.status];
            const Icon = cfg.icon;
            return (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100
                           hover:border-brand-200 hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                  {/* Status dot */}
                  <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cfg.dot)} />

                  {/* Customer */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">{order.customer_name}</p>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        cfg.color
                      )}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                      {order.invoice_number && (
                        <span className="text-[10px] text-gold-700 bg-gold-50 px-1.5 py-0.5 rounded-full font-semibold">
                          {order.invoice_number}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{order.customer_phone} · {order.items.length} article{order.items.length > 1 ? "s" : ""}</p>
                  </div>

                  {/* Total + date + arrow */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-serif font-bold text-brand-700">
                        {order.total.toLocaleString("fr-FR")} <span className="text-xs font-sans font-normal">{order.currency}</span>
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail sheet */}
      {selected && (
        <OrderDetailSheet
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
