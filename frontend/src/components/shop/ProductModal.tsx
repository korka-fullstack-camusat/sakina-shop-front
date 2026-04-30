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

  const [imgIdx, setImgIdx] = useState(0);
  const [added,  setAdded]  = useState(false);
  const [zoomed, setZoomed] = useState(false);

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

  const images  = selectedProduct?.images ?? [];
  const hasMany = images.length > 1;

  const prev = useCallback(() =>
    setImgIdx((i) => (i - 1 + images.length) % images.length),
  [images.length]);

  const next = useCallback(() =>
    setImgIdx((i) => (i + 1) % images.length),
  [images.length]);

  /* Navigation clavier ← → */
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
      setSelectedProduct(null);
    }, 900);
  };

  if (!selectedProduct) return null;

  const inStock = selectedProduct.stock > 0;

  return (
    <>
      {/* ── Backdrop ─────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
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
            className="absolute top-4 right-4 p-2.5 bg-white/15 hover:bg-white/25
                       rounded-full text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MOBILE  : bottom-sheet qui glisse depuis le bas
          DESKTOP : modal centré (comportement actuel)
      ══════════════════════════════════════════════════════════════ */}

      {/* Container desktop (centré) */}
      <div className="hidden sm:fixed sm:inset-0 sm:z-[60] sm:flex sm:items-center
                      sm:justify-center sm:p-6 sm:pointer-events-none">
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl
                     max-h-[92vh] flex flex-row overflow-hidden
                     pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalContent
            selectedProduct={selectedProduct}
            images={images}
            hasMany={hasMany}
            imgIdx={imgIdx}
            setImgIdx={setImgIdx}
            prev={prev}
            next={next}
            zoomed={zoomed}
            setZoomed={setZoomed}
            added={added}
            inStock={inStock}
            handleAddToCart={handleAddToCart}
            onClose={() => setSelectedProduct(null)}
            isMobile={false}
          />
        </div>
      </div>

      {/* Container mobile (bottom-sheet) */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-[60] pointer-events-none"
        style={{ top: 0 }}
        onClick={() => setSelectedProduct(null)}
      >
        <div
          className="absolute inset-x-0 bottom-0 bg-white rounded-t-[28px] shadow-2xl
                     max-h-[92dvh] flex flex-col overflow-hidden
                     pointer-events-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle pill */}
          <div className="flex justify-center pt-3 pb-0 shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <ModalContent
            selectedProduct={selectedProduct}
            images={images}
            hasMany={hasMany}
            imgIdx={imgIdx}
            setImgIdx={setImgIdx}
            prev={prev}
            next={next}
            zoomed={zoomed}
            setZoomed={setZoomed}
            added={added}
            inStock={inStock}
            handleAddToCart={handleAddToCart}
            onClose={() => setSelectedProduct(null)}
            isMobile={true}
          />
        </div>
      </div>
    </>
  );
}

/* ─── Contenu partagé mobile/desktop ───────────────────────────────────────── */

interface ContentProps {
  selectedProduct: Product;
  images:         string[];
  hasMany:        boolean;
  imgIdx:         number;
  setImgIdx:      (i: number) => void;
  prev:           () => void;
  next:           () => void;
  zoomed:         boolean;
  setZoomed:      (v: boolean) => void;
  added:          boolean;
  inStock:        boolean;
  handleAddToCart:() => void;
  onClose:        () => void;
  isMobile:       boolean;
}

function ModalContent({
  selectedProduct, images, hasMany, imgIdx, setImgIdx,
  prev, next, setZoomed, added, inStock, handleAddToCart, onClose, isMobile,
}: ContentProps) {
  return (
    <>
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className={cn(
          "absolute z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md",
          "text-gray-500 hover:text-gray-900 hover:bg-white transition-all hover:scale-110",
          isMobile ? "top-4 right-4" : "top-3 right-3"
        )}
      >
        <X size={18} />
      </button>

      {/* ══ MOBILE : layout vertical compact ══ */}
      {isMobile ? (
        <div className="flex flex-col overflow-hidden flex-1 min-h-0">

          {/* Image principale — hauteur fixe sur mobile */}
          <div className="relative shrink-0 mx-4 mt-2 rounded-2xl overflow-hidden bg-gray-100 group"
               style={{ height: "42vw", minHeight: 160, maxHeight: 240 }}>
            {images.length > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[imgIdx]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setZoomed(true)}
                  className="absolute bottom-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm
                             rounded-full shadow-md opacity-0 group-hover:opacity-100
                             transition-all"
                >
                  <ZoomIn size={13} className="text-gray-600" />
                </button>
              </>
            ) : (
              <div className="w-full h-full brand-gradient flex items-center justify-center">
                <span className="text-white/20 text-5xl">✦</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {selectedProduct.category && (
                <span className="bg-white/90 text-brand-700 text-[9px] font-semibold
                                 px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                  {selectedProduct.category}
                </span>
              )}
              {!inStock && (
                <span className="bg-gray-900/80 text-white text-[9px] font-semibold
                                 px-2 py-0.5 rounded-full">
                  Épuisé
                </span>
              )}
            </div>

            {/* Flèches */}
            {hasMany && (
              <>
                <button onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90
                             rounded-full shadow-md flex items-center justify-center">
                  <ChevronLeft size={15} className="text-gray-700" />
                </button>
                <button onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90
                             rounded-full shadow-md flex items-center justify-center">
                  <ChevronRight size={15} className="text-gray-700" />
                </button>
              </>
            )}

            {/* Dots */}
            {hasMany && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={cn("rounded-full transition-all",
                      i === imgIdx ? "w-4 h-1.5 bg-white shadow" : "w-1.5 h-1.5 bg-white/50"
                    )} />
                ))}
              </div>
            )}
          </div>

          {/* Infos scrollables */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Nom */}
            <h2 className="font-serif text-xl font-bold text-brand-950 leading-tight pr-8">
              {selectedProduct.name}
            </h2>

            {/* Prix + stock */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-2xl font-bold text-brand-800">
                  {selectedProduct.price.toLocaleString("fr-FR")}
                </span>
                <span className="text-brand-600 text-sm font-semibold">
                  {selectedProduct.currency}
                </span>
              </div>
              {inStock ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200
                                 text-emerald-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                  <CheckCircle size={10} />
                  {selectedProduct.stock <= 5
                    ? `Plus que ${selectedProduct.stock} !`
                    : "En stock"}
                </span>
              ) : (
                <span className="inline-flex items-center bg-red-50 border border-red-200
                                 text-red-600 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                  Épuisé
                </span>
              )}
            </div>

            {/* Description */}
            <div className="h-px bg-gray-100" />
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {selectedProduct.description}
            </p>
          </div>

          {/* CTA collé en bas */}
          <div className="shrink-0 px-4 pb-5 pt-3 border-t border-gray-100 bg-white space-y-2">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || added}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl",
                "text-base font-bold transition-all shadow-lg",
                added
                  ? "bg-emerald-500 text-white"
                  : inStock
                    ? "brand-gradient text-white hover:opacity-95 active:scale-[0.99]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              )}
            >
              {added
                ? <><CheckCircle size={20} /> Ajouté au panier !</>
                : <><ShoppingCart size={20} /> {inStock ? "Ajouter au panier" : "Épuisé"}</>
              }
            </button>
            <p className="text-center text-[10px] text-gray-400">
              💳 Paiement après livraison · Commande sans risque
            </p>
          </div>
        </div>
      ) : (
        /* ══ DESKTOP : layout horizontal existant ══ */
        <>
          {/* COLONNE GAUCHE — Galerie */}
          <div className="w-[55%] flex flex-col gap-3 p-4 bg-gray-50 shrink-0">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-100 group">
              {images.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[imgIdx]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
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

              {hasMany && (
                <>
                  <button onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90
                               rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors">
                    <ChevronLeft size={18} className="text-gray-700" />
                  </button>
                  <button onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90
                               rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors">
                    <ChevronRight size={18} className="text-gray-700" />
                  </button>
                </>
              )}

              {hasMany && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={cn("rounded-full transition-all",
                        i === imgIdx ? "w-5 h-2 bg-white shadow" : "w-2 h-2 bg-white/50 hover:bg-white/80"
                      )} />
                  ))}
                </div>
              )}
            </div>

            {/* Miniatures */}
            {hasMany && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={cn("aspect-square rounded-xl overflow-hidden border-2 transition-all",
                      i === imgIdx
                        ? "border-brand-500 shadow-md scale-[1.04]"
                        : "border-transparent hover:border-brand-300 opacity-70 hover:opacity-100"
                    )}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLONNE DROITE — Infos */}
          <div className="flex-1 flex flex-col gap-4 p-7 overflow-y-auto">
            <h2 className="font-serif text-3xl font-bold text-brand-950 leading-tight">
              {selectedProduct.name}
            </h2>

            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-brand-800">
                {selectedProduct.price.toLocaleString("fr-FR")}
              </span>
              <span className="text-brand-600 text-lg font-semibold">
                {selectedProduct.currency}
              </span>
            </div>

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

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Description
              </p>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {selectedProduct.description}
              </p>
            </div>

            <div className="flex-1" />

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
                {added
                  ? <><CheckCircle size={20} /> Ajouté au panier !</>
                  : <><ShoppingCart size={20} /> {inStock ? "Ajouter au panier" : "Épuisé"}</>
                }
              </button>
              <p className="text-center text-xs text-gray-400">
                💳 Paiement après livraison · Commande sans risque
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
