"use client";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { ProductCard }  from "@/components/shop/ProductCard";
import { ShopHeader }   from "@/components/shop/ShopHeader";
import { CartSidebar }  from "@/components/shop/CartSidebar";
import { ProductModal } from "@/components/shop/ProductModal";
import { ChevronRight, Star, Truck, Shield, HeartHandshake, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";

// ── Engagements ───────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Star,
    title: "Qualité Garantie",
    desc:  "Chaque produit est soigneusement sélectionné pour le meilleur rapport qualité-prix.",
  },
  {
    icon: Truck,
    title: "Livraison Rapide",
    desc:  "Livraison partout en Afrique et à l'international sous 5 à 7 jours ouvrables.",
  },
  {
    icon: Shield,
    title: "Paiement Sécurisé",
    desc:  "Transactions protégées et sécurisées à chaque étape de votre commande.",
  },
  {
    icon: HeartHandshake,
    title: "Service Client",
    desc:  "Notre équipe disponible 7j/7 pour vous accompagner dans vos achats.",
  },
];

export default function ShopPage() {
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey:        ["products"],
    queryFn:         () => productsApi.listPublished().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const preview = allProducts.slice(0, 8);

  return (
    <div className="min-h-screen bg-cream-50">
      <ShopHeader />
      <CartSidebar />
      <ProductModal />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative hero-gradient overflow-hidden">

        {/* Pattern géométrique */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[400px] sm:w-[600px] h-[400px] sm:h-[600px]
                        rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        {/* Contenu hero — padding réduit sur mobile */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6
                        py-12 sm:py-28 lg:py-36 text-center">

          <p className="text-lime-300 font-serif italic text-sm sm:text-lg mb-3 sm:mb-4
                        tracking-wide animate-fade-in">
            Tout ce dont vous avez besoin, au même endroit
          </p>

          <h1 className="font-serif text-3xl sm:text-6xl lg:text-7xl font-bold text-white
                         leading-[1.1] mb-4 sm:mb-6 animate-slide-up">
            Votre boutique en ligne
            <span className="block text-logo-gradient mt-1 sm:mt-2">
              Simple &amp; Accessible
            </span>
          </h1>

          <p className="text-white/70 text-sm sm:text-xl max-w-2xl mx-auto mb-8 sm:mb-10
                        leading-relaxed animate-fade-in px-2">
            Des milliers de produits de qualité livrés directement chez vous.
            Shopping facile, prix honnêtes, satisfaction garantie.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center
                          animate-slide-up">
            <a
              href="#produits"
              className="inline-flex items-center justify-center gap-2 lime-gradient text-white
                         font-semibold px-7 sm:px-8 py-3.5 sm:py-4 rounded-full w-full sm:w-auto
                         hover:opacity-95 hover:scale-105 transition-all shadow-lg shadow-black/30
                         text-sm sm:text-base"
            >
              Voir les produits
              <ChevronRight size={18} />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 bg-white/10
                         hover:bg-white/20 text-white border border-white/25 font-semibold
                         px-7 sm:px-8 py-3.5 sm:py-4 rounded-full w-full sm:w-auto
                         transition-all backdrop-blur-sm text-sm sm:text-base"
            >
              Nous Contacter
            </a>
          </div>

          {/* Badges confiance — mobile only */}
          <div className="flex items-center justify-center gap-4 mt-8 sm:hidden">
            {["Paiement à la livraison", "Qualité garantie"].map((b) => (
              <span key={b} className="text-white/60 text-[10px] font-medium flex items-center gap-1">
                <span className="text-lime-400">✓</span> {b}
              </span>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg"
               className="w-full block">
            <path d="M0 60 L1440 60 L1440 30 C1080 0 360 0 0 30 Z" fill="#fafdf7" />
          </svg>
        </div>
      </section>

      {/* ── Produits ─────────────────────────────────────────────────────────── */}
      <section id="produits" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-20">

        <div className="text-center mb-8 sm:mb-12">
          <p className="text-brand-600 font-serif italic text-sm uppercase tracking-widest mb-2">
            Notre Sélection
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-950">
            Nos Produits
          </h2>
          <div className="w-12 sm:w-16 h-[2px] brand-gradient mx-auto mt-3 sm:mt-4 rounded-full" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="aspect-[3/4] bg-gradient-to-br from-brand-100 to-cream-200 animate-pulse" />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : preview.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <p className="text-5xl mb-4">🛍️</p>
            <p className="text-gray-400 text-lg font-medium">
              Aucun produit disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {preview.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {allProducts.length > 0 && (
          <div className="flex justify-center mt-8 sm:mt-12">
            <Link
              href="/produits"
              className="inline-flex items-center gap-3 bg-white border-2 border-brand-600
                         text-brand-700 font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full
                         hover:bg-brand-600 hover:text-white transition-all duration-300
                         shadow-sm hover:shadow-md group text-sm sm:text-base w-full sm:w-auto
                         justify-center"
            >
              <ShoppingBag size={18} />
              Voir tous les produits
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </section>

      {/* ── Nos engagements ──────────────────────────────────────────────────── */}
      <section id="about" className="bg-brand-950 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-lime-400 font-serif italic text-sm uppercase tracking-widest mb-2">
              Nos Engagements
            </p>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white">
              Pourquoi nous choisir ?
            </h2>
            <div className="w-12 sm:w-16 h-[2px] lime-gradient mx-auto mt-3 sm:mt-4 rounded-full" />
          </div>

          {/* Desktop : 4 colonnes / Mobile : liste horizontale compacte */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="text-center p-6 rounded-2xl bg-white/5 hover:bg-white/10
                           transition-colors border border-white/10 group">
                <div className="inline-flex p-4 rounded-2xl bg-brand-500/15
                                group-hover:bg-brand-500/25 transition-colors mb-4">
                  <Icon size={22} className="text-lime-400" />
                </div>
                <h3 className="font-serif text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile : cartes horizontales */}
          <div className="sm:hidden space-y-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5
                           border border-white/10">
                <div className="flex-shrink-0 p-3 rounded-xl bg-brand-500/15">
                  <Icon size={20} className="text-lime-400" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-white mb-1">{title}</h3>
                  <p className="text-white/55 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-12 sm:py-20 bg-cream-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-brand-600 font-serif italic text-sm uppercase tracking-widest mb-2">
            Besoin d&apos;aide ?
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-950 mb-3 sm:mb-4">
            Contactez-nous
          </h2>
          <p className="text-gray-600 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
            Notre équipe est disponible pour vous conseiller et vous aider
            à trouver exactement ce que vous cherchez.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a
              href="https://wa.me/221000000000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2.5 bg-[#25D366]
                         hover:bg-[#1ebe5d] text-white font-semibold px-8 py-4 rounded-full
                         transition-all hover:scale-105 shadow-lg shadow-green-900/20 text-sm sm:text-base"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <a
              href="mailto:contact@sakina-shop.com"
              className="inline-flex items-center justify-center gap-2.5 brand-gradient text-white
                         font-semibold px-8 py-4 rounded-full transition-all hover:scale-105
                         hover:opacity-90 shadow-lg shadow-brand-900/20 text-sm sm:text-base"
            >
              ✉️ Email
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-brand-950 text-white/50 py-8 sm:py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between sm:gap-6">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-white text-xl font-bold">Sakina</span>
              <span className="font-serif text-lime-400 text-xl font-bold"> Shop</span>
            </div>
            <p className="text-xs sm:text-sm text-center">
              © {new Date().getFullYear()} Sakina Shop · Tout ce dont vous avez besoin.
            </p>
            <div className="flex gap-4 sm:gap-5 text-xs sm:text-sm flex-wrap justify-center">
              {["Instagram", "TikTok", "Facebook", "Snapchat"].map((s) => (
                <a key={s} href="#" className="hover:text-lime-400 transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
