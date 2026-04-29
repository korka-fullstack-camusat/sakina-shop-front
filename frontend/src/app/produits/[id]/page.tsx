"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { productsApi } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { CartSidebar } from "@/components/shop/CartSidebar";
import {
  ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight,
  Package, Star, Truck, Shield, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [imgIdx, setImgIdx] = useState(0);
  const [added,  setAdded]  = useState(false);

  const addItem  = useCartStore((s) => s.addItem);
  const setOpen  = useCartStore((s) => s.setOpen);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn:  () => productsApi.get(id).then((r) => r.data),
    enabled:  !!id,
  });

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setOpen(true);
    }, 800);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ShopHeader />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
            <div className="aspect-square bg-gray-100 rounded-3xl" />
            <div className="space-y-4 pt-4">
              <div className="h-8 bg-gray-100 rounded-xl w-3/4" />
              <div className="h-5 bg-gray-100 rounded-xl w-1/3" />
              <div className="h-4 bg-gray-100 rounded-xl w-full mt-6" />
              <div className="h-4 bg-gray-100 rounded-xl w-5/6" />
              <div className="h-4 bg-gray-100 rounded-xl w-4/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Erreur / introuvable ──────────────────────────────────────────────────
  if (isError || !product) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ShopHeader />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <Package size={56} className="text-gray-200 mb-4" />
          <h1 className="font-serif text-2xl font-bold text-gray-800 mb-2">Produit introuvable</h1>
          <p className="text-gray-400 mb-8">Ce produit n&apos;existe pas ou n&apos;est plus disponible.</p>
          <button
            onClick={() => router.push("/produits")}
            className="inline-flex items-center gap-2 brand-gradient text-white font-semibold
                       px-7 py-3.5 rounded-full shadow-md hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={16} /> Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  const images  = product.images.length > 0 ? product.images : [];
  const hasMany = images.length > 1;
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-cream-50">
      <ShopHeader />
      <CartSidebar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <button onClick={() => router.push("/")} className="hover:text-brand-700 transition-colors">
            Accueil
          </button>
          <span>/</span>
          <button onClick={() => router.push("/produits")} className="hover:text-brand-700 transition-colors">
            Produits
          </button>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[180px]">{product.name}</span>
        </nav>

        {/* ── Grille principale ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* ── Galerie images ──────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Image principale */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-cream-100 shadow-sm">
              {images.length > 0 ? (
                <Image
                  src={images[imgIdx]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full brand-gradient flex items-center justify-center">
                  <span className="text-white/20 text-8xl select-none">✦</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.category && (
                  <span className="bg-white/90 backdrop-blur-sm text-brand-700 text-xs font-semibold
                                   px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wide">
                    {product.category}
                  </span>
                )}
                {!inStock && (
                  <span className="bg-gray-900/80 text-white text-xs font-semibold
                                   px-3 py-1.5 rounded-full">
                    Épuisé
                  </span>
                )}
              </div>

              {/* Flèches navigation */}
              {hasMany && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90
                               rounded-full shadow-md flex items-center justify-center
                               hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={18} className="text-gray-700" />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90
                               rounded-full shadow-md flex items-center justify-center
                               hover:bg-white transition-colors"
                  >
                    <ChevronRight size={18} className="text-gray-700" />
                  </button>
                </>
              )}

              {/* Dots */}
              {hasMany && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
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
                        ? "border-brand-500 shadow-md"
                        : "border-transparent hover:border-brand-200"
                    )}
                  >
                    <Image
                      src={src}
                      alt={`Photo ${i + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Infos produit ────────────────────────────────────────── */}
          <div className="flex flex-col gap-5 lg:pt-2">

            {/* Nom + prix */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-950 leading-tight mb-3">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl font-bold text-brand-800">
                  {product.price.toLocaleString("fr-FR")}
                </span>
                <span className="text-gold-600 text-lg font-semibold">{product.currency}</span>
              </div>
            </div>

            {/* Stock */}
            <div>
              {inStock ? (
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200
                                text-emerald-700 text-sm font-semibold px-3.5 py-2 rounded-full">
                  <CheckCircle size={14} />
                  {product.stock <= 5
                    ? `Plus que ${product.stock} en stock !`
                    : "En stock"}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200
                                text-red-600 text-sm font-semibold px-3.5 py-2 rounded-full">
                  Épuisé
                </div>
              )}
            </div>

            {/* Séparateur */}
            <div className="h-px bg-gray-100" />

            {/* Description */}
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Description
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Séparateur */}
            <div className="h-px bg-gray-100" />

            {/* Bouton ajouter au panier */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || added}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-4.5 rounded-2xl",
                  "text-base font-bold transition-all shadow-lg",
                  added
                    ? "bg-emerald-500 text-white scale-[0.99] shadow-emerald-900/20"
                    : inStock
                      ? "gold-gradient text-white hover:opacity-95 hover:scale-[1.01] shadow-gold-900/20"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                )}
                style={{ paddingTop: "1rem", paddingBottom: "1rem" }}
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

            {/* Garanties */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { icon: Truck,  label: "Livraison rapide",   sub: "5 à 7 jours"      },
                { icon: Shield, label: "Qualité garantie",   sub: "Produit vérifié"  },
                { icon: Star,   label: "Service client",     sub: "7j/7 disponible"  },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label}
                  className="flex flex-col items-center text-center p-3 bg-white
                             rounded-2xl border border-gray-100 shadow-sm">
                  <Icon size={16} className="text-gold-500 mb-1.5" />
                  <p className="text-[10px] font-bold text-gray-700 leading-snug">{label}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Retour ──────────────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-100">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-700
                       font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Retour aux produits
          </button>
        </div>
      </div>
    </div>
  );
}
