"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X } from "lucide-react";
import { LoginModal } from "@/components/shop/LoginModal";
import { useCartStore, cartCount } from "@/store/cart";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";

const NAV_LINKS = [
  { href: "/",         label: "Accueil"  },
  { href: "#produits", label: "Produits" },
  { href: "#about",    label: "À propos" },
  { href: "#contact",  label: "Contact"  },
];

export function ShopHeader() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const { items, setOpen: openCart } = useCartStore();
  const count = cartCount(items);

  const { data: settings } = useQuery({
    queryKey:  ["settings"],
    queryFn:   () => settingsApi.get().then((r) => r.data),
    staleTime: 60_000,
  });

  const promoBanner = settings?.promo_banner ??
    "🛍️ Livraison rapide partout en Afrique · Tout ce dont vous avez besoin, au même endroit · Qualité garantie";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shopName = settings?.shop_name ?? "Sakina Shop";
  const [firstName, ...rest] = shopName.split(" ");

  return (
    <>
      {/* ── Promo banner ─────────────────────────────────────────────────────── */}
      <div className="bg-brand-950 text-white text-center text-xs sm:text-sm py-2 px-4
                      font-medium tracking-wide">
        <span className="text-lime-300">{promoBanner}</span>
      </div>

      {/* ── Main header ──────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* ── Logo ──────────────────────────────────────────────────────── */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              {/* Image logo — sur fond sombre pour que le logo noir/vert ressorte */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0
                              bg-white border border-gray-100 flex items-center justify-center shadow-md
                              group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/logo.png"
                  alt="Sakina Shop logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain p-0.5"
                  priority
                />
              </div>

              {/* Nom de la boutique — visible sur mobile ET desktop */}
              <div className="leading-none">
                <span className="font-serif text-lg sm:text-xl font-bold text-brand-900 tracking-tight">
                  {firstName}
                </span>
                {rest.length > 0 && (
                  <span className="font-serif text-lg sm:text-xl font-bold text-brand-600 tracking-tight">
                    {" "}{rest.join(" ")}
                  </span>
                )}
              </div>
            </Link>

            {/* ── Navigation desktop ────────────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="relative text-sm font-medium text-gray-600 hover:text-brand-700
                             transition-colors group"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-brand-500
                                   group-hover:w-full transition-all duration-300 rounded-full" />
                </Link>
              ))}
            </nav>

            {/* ── Actions droite ────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Panier */}
              <button
                onClick={() => openCart(true)}
                className="relative p-2.5 text-gray-700 hover:text-brand-700 hover:bg-brand-50
                           rounded-xl transition-colors"
                aria-label="Panier"
              >
                <ShoppingCart size={20} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 brand-gradient text-white
                                   text-[10px] font-bold rounded-full flex items-center justify-center
                                   shadow-sm animate-pulse">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>

              {/* Connexion */}
              <button
                onClick={() => setLoginOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 brand-gradient text-white text-sm
                           font-semibold px-5 py-2.5 rounded-full shadow-md shadow-brand-900/20
                           hover:opacity-90 hover:scale-105 transition-all"
              >
                Se connecter
              </button>

              {/* Burger mobile */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-brand-700 transition-colors"
                aria-label="Menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Menu mobile ──────────────────────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1
                          animate-fade-in shadow-lg">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-gray-700 hover:bg-brand-50
                           hover:text-brand-800 font-medium transition-colors text-sm"
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
              className="block w-full mt-2 px-4 py-3 rounded-xl brand-gradient text-white
                         text-center font-semibold text-sm shadow-md"
            >
              Se connecter
            </button>
          </div>
        )}
      </header>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}
