"use client";
import { useState, useEffect, useCallback } from "react";
import {
  X, ChevronLeft, ChevronRight,
  ShoppingCart, CheckCircle, ZoomIn,
} from "lucide-react";
import { useShopStore } from "@/store/shop";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

export function ProductModal() {
  const { selectedProduct, setSelectedProduct } = useShopStore();
  const addItem = useCartStore((s) => s.addItem);

  const [imgIdx,    setImgIdx]    = useState(0);
  const [added,     setAdded]     = useState(false);
  const [zoomed,    setZoomed]    = useState(false);

  /* Reset quand le produit change */
  useEffect(() => {
    setImgIdx(0);
    setAdded(false);
    setZoomed(false);
  }, [selectedProduct?.id]);

  /* Touche Escape */
  useEffect(() => {
    if (!selectedProduct) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomed) setZoomed(false);
        else setSelectedProduct(null);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [selectedProduct, zoomed, setSelectedProduct]);

  /* Bloquer le scroll body */
  useEffect(() => {
    document.body.style.overflow = selectedProduct ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedProduct]);

  /* Navigation clavier ← → */
  const images  = selectedProduct?.images ?? [];
  const hasMany = images.length > 1;

  const prev = useCallback(() =>
    setImgIdx((i) => (i - 1 + images.length) % images.length),
  [images.length]);

  const next = useCallback(() =>
    setImgIdx((i) => (i + 1) % images.length),
  [images.length]);

  useEffect(() => {
    if (!selectedProduct || !hasMany) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [selectedProduct, hasMany, prev, next]);

  const handleAddToCart = () => {
    if (!selectedProduct || selectedProduct.stock === 0) return;
    addItem(selectedProduct);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setSelectedProduct(null);   // ferme le modal; le panier s'ouvre auto
    }, 900);
  };

  if (!selectedProduct) return null;

  const inStock = selectedProduct.stock > 0;

  /* ──────────────────────────────────────────────── */
  return (
    <>
      {/* ── Backdrop ─────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={() => setSelectedProduct(null)}
      />

      {/* ── Zoom plein écran ──────────────────────── */}
      {zoomed && images[imgIdx] && (
        <div
          className="fixed inset-0 z-[70] bg-black flex items-center justify-center cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[imgIdx]}
            alt="zoom"
            className="max-w-full max-h-full object-contain select-none"
          />
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20
                       rounded-full text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      )}

      {/* ── Modal centré ─────────────────────────── */}
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6
                   pointer-events-none"
      >
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl
                     max-h-[92vh] flex flex-col sm:flex-row overflow-hidden
                     pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Bouton fermer ─────────────────────── */}
          <button
            onClick={() => setSelectedProduct(null)}
            className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm
                       rounded-full shadow-md text-gray-500 hover:text-gray-900
                       hover:bg-white transition-all hover:scale-110"
          >
            <X size={18} />
          </button>

          {/* ════════════════════════════════════════ */}
          {/* COLONNE GAUCHE — Galerie ════════════════ */}
          {/* ════════════════════════════════════════ */}
          <div className="sm:w-[55%] flex flex-col gap-3 p-4 bg-gray-50 shrink-0">

            {/* Image principale */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-100 group">
              {images.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[imgIdx]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {/* Zoom on hover */}
                  <button
                    onClick={() => setZoomed(true)}
                    className="absolute bottom-3 right-3 p-2 bg-white/90 backdrop-blur-sm
                               rounded-full shadow-md opacity-0 group-hover:opacity-100
                               transition-all hover:scale-110"
                    title="Agrandir"
                  >
                    <ZoomIn size={15} className="text-gray-600" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full brand-gradient flex items-center justify-center">
                  <span className="text-white/20 text-7xl select-none">✦</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {selectedProduct.category && (
                  <span className="bg-white/90 backdrop-blur-sm text-brand-700 text-[10px]
                                   font-semibold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
                    {selectedProduct.category}
                  </span>
                )}
                {!inStock && (
                  <span className="bg-gray-900/80 text-white text-[10px] font-semibold
                                   px-2.5 py-1 rounded-full">
                    Épuisé
                  </span>
                )}
              </div>

              {/* Flèches navigation */}
              {hasMany && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90
                               rounded-full shadow-md flex items-center justify-center
                               hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={18} className="text-gray-700" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90
                               rounded-full shadow-md flex items-center justify-center
                               hover:bg-white transition-colors"
                  >
                    <ChevronRight size={18} className="text-gray-700" />
                  </button>
                </>
              )}

              {/* Dots */}
              {hasMany && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={cn(
                        "rounded-full transition-all",
                        i === imgIdx
                          ? "w-5 h-2 bg-white shadow"
                          : "w-2 h-2 bg-white/50 hover:bg-white/80"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Miniatures */}
            {hasMany && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                      i === imgIdx
                        ? "border-brand-500 shadow-md scale-[1.04]"
                        : "border-transparent hover:border-brand-300 opacity-70 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════ */}
          {/* COLONNE DROITE — Infos ═════════════════ */}
          {/* ════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col gap-4 p-5 sm:p-7 overflow-y-auto">

            {/* Nom */}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 leading-tight">
              {selectedProduct.name}
            </h2>

            {/* Prix */}
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-brand-800">
                {selectedProduct.price.toLocaleString("fr-FR")}
              </span>
              <span className="text-gold-600 text-lg font-semibold">
                {selectedProduct.currency}
              </span>
            </div>

            {/* Stock */}
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 self-start bg-emerald-50
                               border border-emerald-200 text-emerald-700 text-xs
                               font-semibold px-3 py-1.5 rounded-full">
                <CheckCircle size={12} />
                {selectedProduct.stock <= 5
                  ? `Plus que ${selectedProduct.stock} en stock !`
                  : "En stock"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 self-start bg-red-50
                               border border-red-200 text-red-600 text-xs
                               font-semibold px-3 py-1.5 rounded-full">
                Épuisé
              </span>
            )}

            <div className="h-px bg-gray-100" />

            {/* Description */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Description
              </p>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {selectedProduct.description}
              </p>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || added}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-4 rounded-2xl",
                  "text-base font-bold transition-all shadow-lg",
                  added
                    ? "bg-emerald-500 text-white scale-[0.99]"
                    : inStock
                      ? "brand-gradient text-white hover:opacity-95 hover:scale-[1.01]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                )}
              >
                {added ? (
                  <><CheckCircle size={20} /> Ajouté au panier !</>
                ) : (
                  <><ShoppingCart size={20} /> {inStock ? "Ajouter au panier" : "Épuisé"}</>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                💳 Paiement après livraison · Commande sans risque
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
