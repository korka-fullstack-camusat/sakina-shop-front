"use client";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api";
import { useCartStore, cartTotal, cartCount, CartItem } from "@/store/cart";
import { useShopStore } from "@/store/shop";
import toast from "react-hot-toast";
import {
  X, ShoppingCart, Minus, Plus, Trash2, ArrowRight,
  CheckCircle, Loader2, Package, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CheckoutForm {
  customer_name:    string;
  customer_phone:   string;
  customer_address: string;
  customer_email:   string;
  notes:            string;
}

const emptyForm: CheckoutForm = {
  customer_name:    "",
  customer_phone:   "",
  customer_address: "",
  customer_email:   "",
  notes:            "",
};

// ─── Cart Modal ───────────────────────────────────────────────────────────────

export function CartSidebar() {
  const { items, isOpen, setOpen, removeItem, updateQty, clear } = useCartStore();
  const { checkoutOpen, setCheckoutOpen } = useShopStore();

  const total    = cartTotal(items);
  const count    = cartCount(items);
  const currency = items[0]?.product.currency ?? "FCFA";

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen || checkoutOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, checkoutOpen]);

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (checkoutOpen) setCheckoutOpen(false);
        else setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [checkoutOpen, setCheckoutOpen, setOpen]);

  if (!isOpen && !checkoutOpen) return null;

  return (
    <>
      {/* ── Cart Modal ────────────────────────────────────────────── */}
      {isOpen && !checkoutOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg
                         max-h-[85vh] flex flex-col pointer-events-auto animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart size={18} className="text-brand-700" />
                  <h2 className="font-serif text-lg font-bold text-gray-900">Mon Panier</h2>
                  {count > 0 && (
                    <span className="brand-gradient text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Package size={32} className="text-gray-300" />
                    </div>
                    <p className="text-gray-600 font-semibold mb-1">Votre panier est vide</p>
                    <p className="text-gray-400 text-sm mb-6">Ajoutez des articles depuis la boutique</p>
                    <button
                      onClick={() => setOpen(false)}
                      className="brand-gradient text-white px-6 py-2.5 rounded-full text-sm
                                 font-semibold shadow-md hover:opacity-90 transition-opacity"
                    >
                      Continuer mes achats
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex gap-3 bg-gray-50 rounded-2xl p-3"
                      >
                        {/* Image */}
                        <div className="w-16 h-20 rounded-xl bg-brand-100 flex-shrink-0 overflow-hidden">
                          {product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full brand-gradient flex items-center justify-center">
                              <span className="text-white/30 text-2xl">✦</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                          <p className="text-xs text-brand-700 font-bold mt-0.5">
                            {product.price.toLocaleString("fr-FR")} {product.currency}
                          </p>
                          {/* Qty controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQty(product.id, quantity - 1)}
                              className="w-7 h-7 rounded-full border border-gray-200 bg-white
                                         hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-sm font-bold text-gray-800 w-5 text-center">{quantity}</span>
                            <button
                              onClick={() => updateQty(product.id, quantity + 1)}
                              className="w-7 h-7 rounded-full border border-gray-200 bg-white
                                         hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Subtotal + remove */}
                        <div className="flex flex-col items-end justify-between flex-shrink-0">
                          <button
                            onClick={() => removeItem(product.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                          <p className="text-sm font-bold text-gray-800">
                            {(product.price * quantity).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-gray-100 p-5 shrink-0 space-y-3 bg-white rounded-b-3xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-medium">Total</span>
                    <span className="font-serif text-xl font-bold text-brand-800">
                      {total.toLocaleString("fr-FR")}{" "}
                      <span className="text-sm font-sans font-normal text-gold-600">{currency}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center">
                    💳 Paiement après livraison · Commande sans risque
                  </p>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setTimeout(() => setCheckoutOpen(true), 150);
                    }}
                    className="w-full flex items-center justify-center gap-2 brand-gradient text-white
                               font-semibold py-4 rounded-2xl text-sm shadow-md hover:opacity-95
                               hover:scale-[1.01] transition-all"
                  >
                    Valider la commande
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Checkout Modal ────────────────────────────────────────── */}
      {checkoutOpen && (
        <CheckoutModal
          items={items}
          total={total}
          currency={currency}
          onBack={() => {
            setCheckoutOpen(false);
            setTimeout(() => setOpen(true), 150);
          }}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => {
            clear();
            setCheckoutOpen(false);
          }}
        />
      )}
    </>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

interface CheckoutModalProps {
  items:    CartItem[];
  total:    number;
  currency: string;
  onBack:   () => void;
  onClose:  () => void;
  onSuccess:() => void;
}

function CheckoutModal({ items, total, currency, onBack, onClose, onSuccess }: CheckoutModalProps) {
  const [form, setForm]       = useState<CheckoutForm>(emptyForm);
  const [success, setSuccess] = useState(false);

  const orderMutation = useMutation({
    mutationFn: () =>
      ordersApi.publicOrder({
        customer_name:    form.customer_name,
        customer_phone:   form.customer_phone,
        customer_address: form.customer_address,
        customer_email:   form.customer_email || undefined,
        notes: form.notes
          ? `${form.notes} — Paiement à la livraison`
          : "Paiement à la livraison",
        items: items.map((i) => ({
          product_id:   i.product.id,
          product_name: i.product.name,
          quantity:     i.quantity,
          unit_price:   i.product.price,
          currency:     i.product.currency,
        })),
        total,
        currency,
      }),
    onSuccess: () => {
      setSuccess(true);
      onSuccess();
    },
    onError: () => toast.error("Erreur lors de la commande. Réessayez."),
  });

  const canSubmit = form.customer_name.trim() && form.customer_phone.trim() && form.customer_address.trim();

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg
                     max-h-[90vh] flex flex-col pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            {!success && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-brand-700 font-semibold hover:underline"
              >
                <ChevronLeft size={16} /> Retour au panier
              </button>
            )}
            <h2 className={cn("font-serif text-lg font-bold text-gray-900", success && "mx-auto")}>
              {success ? "Commande confirmée ✅" : "Informations de livraison"}
            </h2>
            {!success && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {success ? (
              /* ── Succès ──────────────────────────────────────── */
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 brand-gradient rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle size={36} className="text-white" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-3">
                  Commande reçue !
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-2">
                  Votre commande a bien été enregistrée.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  Notre équipe vous contactera par téléphone pour confirmer la livraison.{" "}
                  <strong>Le paiement se fait à la réception.</strong>
                </p>
                <button
                  onClick={onClose}
                  className="brand-gradient text-white px-8 py-3.5 rounded-full font-semibold
                             text-sm shadow-md hover:opacity-90 transition-opacity"
                >
                  Retour à la boutique
                </button>
              </div>
            ) : (
              /* ── Formulaire ──────────────────────────────────── */
              <div className="p-6 space-y-4">
                {/* Champs */}
                {[
                  { key: "customer_name",    label: "Nom complet",          type: "text",  ph: "Votre nom",                required: true  },
                  { key: "customer_phone",   label: "Numéro de téléphone",  type: "tel",   ph: "+221 77…",                 required: true  },
                  { key: "customer_address", label: "Adresse de livraison", type: "text",  ph: "Quartier, rue, ville…",    required: true  },
                  { key: "customer_email",   label: "Email (optionnel)",    type: "email", ph: "votre@email.com",          required: false },
                ].map(({ key, label, type, ph, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      {label} {required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type={type}
                      value={(form as unknown as Record<string, string>)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={ph}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                                 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Instructions de livraison, taille, couleur…"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all resize-none"
                  />
                </div>

                {/* Récapitulatif */}
                <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-brand-700 mb-2">Récapitulatif</p>
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex justify-between text-xs text-gray-600">
                      <span>{product.name} × {quantity}</span>
                      <span className="font-medium">
                        {(product.price * quantity).toLocaleString("fr-FR")} {product.currency}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-brand-200 pt-2 flex justify-between font-bold text-sm text-brand-800">
                    <span>Total</span>
                    <span>{total.toLocaleString("fr-FR")} {currency}</span>
                  </div>
                  <p className="text-[10px] text-brand-600 font-medium pt-0.5">
                    💳 Paiement après livraison uniquement
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="border-t border-gray-100 p-5 shrink-0 bg-white rounded-b-3xl">
              <button
                onClick={() => orderMutation.mutate()}
                disabled={!canSubmit || orderMutation.isPending}
                className={cn(
                  "w-full flex items-center justify-center gap-2 font-semibold py-4",
                  "rounded-2xl text-sm shadow-md transition-all",
                  canSubmit && !orderMutation.isPending
                    ? "brand-gradient text-white hover:opacity-90"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                )}
              >
                {orderMutation.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</>
                ) : (
                  <>Confirmer la commande <ArrowRight size={16} /></>
                )}
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                Vous serez contacté pour la livraison · Paiement à réception
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
