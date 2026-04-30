"use client";
import { Play, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { useShopStore } from "@/store/shop";

interface Props { product: Product }

export function ProductCard({ product }: Props) {
  const [showVideo, setShowVideo] = useState(false);
  const [added,     setAdded]     = useState(false);

  const addItem            = useCartStore((s) => s.addItem);
  const setSelectedProduct = useShopStore((s) => s.setSelectedProduct);

  /* Ajouter au panier sans ouvrir le modal produit */
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock === 0) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  /* Clic sur la carte → modal produit */
  const handleCardClick = () => setSelectedProduct(product);

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100
                 overflow-hidden card-hover relative cursor-pointer select-none"
    >
      {/* ── Image / Video ───────────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-cream-100">

        {showVideo && product.video_url ? (
          <video
            src={product.video_url}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full brand-gradient flex items-center justify-center">
                <span className="text-white/30 text-6xl select-none">✦</span>
              </div>
            )}

            {/* Hover overlay — Ajouter au panier */}
            <div
              className="absolute inset-0 bg-brand-950/30 opacity-0 group-hover:opacity-100
                          transition-opacity duration-300 flex items-end p-4"
            >
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5
                            rounded-full text-sm shadow-md transition-all
                            ${added
                              ? "bg-emerald-500 text-white scale-95"
                              : "bg-white text-brand-800 hover:bg-gold-50"
                            }`}
              >
                <ShoppingCart size={14} />
                {added ? "Ajouté ✓" : "Ajouter au panier"}
              </button>
            </div>

            {/* Bouton vidéo */}
            {product.video_url && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(true);
                }}
                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2
                           shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                title="Voir la vidéo"
              >
                <Play className="text-brand-600 fill-brand-600" size={13} />
              </button>
            )}
          </>
        )}

        {/* Épuisé */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
              Épuisé
            </span>
          </div>
        )}

        {/* Catégorie */}
        {product.category && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-brand-700 text-[10px] font-semibold
                             px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* ── Infos ───────────────────────────────────────────── */}
      <div className="p-4">
        <h3 className="font-serif font-semibold text-gray-900 line-clamp-1 text-base leading-snug">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-3 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-end justify-between gap-2">
          <div className="leading-none">
            <span className="font-serif font-bold text-brand-800 text-lg">
              {product.price.toLocaleString("fr-FR")}
            </span>
            <span className="text-gold-600 text-sm font-medium ml-1">{product.currency}</span>
          </div>

          {product.stock > 0 && product.stock <= 5 ? (
            <span className="text-[10px] text-orange-500 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
              Plus que {product.stock} !
            </span>
          ) : product.stock > 5 ? (
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              En stock
            </span>
          ) : null}
        </div>

        {/* Bouton mobile (pas de hover) */}
        {product.stock > 0 && (
          <button
            onClick={handleAddToCart}
            className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                        text-xs font-semibold transition-all sm:hidden
                        ${added
                          ? "bg-emerald-500 text-white"
                          : "border border-brand-200 text-brand-700 hover:bg-brand-50"
                        }`}
          >
            <ShoppingCart size={13} />
            {added ? "Ajouté ✓" : "Ajouter au panier"}
          </button>
        )}
      </div>
    </div>
  );
}
