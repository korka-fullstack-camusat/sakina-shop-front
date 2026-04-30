"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Phone } from "lucide-react";
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
    "🛍️ Livraison rapide partout en Afrique · Qualité garantie · Paiement à la livraison ✨";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Ferme le menu si on resize vers desktop */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const shopName = settings?.shop_name ?? "Sakina Shop";
  const [firstName, ...rest] = shopName.split(" ");

  return (
    <>
      {/* ── Promo banner — défilement horizontal ─────────────────────────────── */}
      <div className="bg-brand-950 marquee-container py-2 select-none">
        <div className="marquee-track">
          {[promoBanner, promoBanner].map((text, i) => (
            <span key={i} className="text-lime-300 text-[11px] sm:text-sm font-medium px-10 tracking-wide">
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main header ──────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-20">

            {/* ── Logo ──────────────────────────────────────────────────────── */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0
                              bg-white border border-gray-100 flex items-center justify-center shadow-md
                              group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/logo.png"
                  alt="Sakina Shop"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain p-0.5"
                  priority
                />
              </div>
              <div className="leading-none">
                <span className="font-serif text-base sm:text-xl font-bold text-brand-900 tracking-tight">
                  {firstName}
                </span>
                {rest.length > 0 && (
                  <span className="font-serif text-base sm:text-xl font-bold text-brand-600 tracking-tight">
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
            <div className="flex items-center gap-1 sm:gap-3">

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
                                   shadow-sm">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>

              {/* Connexion — desktop uniquement */}
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
                className="md:hidden p-2 text-gray-600 hover:text-brand-700 rounded-lg
                           hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Menu mobile ──────────────────────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-fade-in">
            <div className="px-4 pt-3 pb-4 space-y-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3.5 rounded-xl text-gray-700
                             hover:bg-brand-50 hover:text-brand-800 font-medium transition-colors text-sm"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Actions mobile */}
            <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
              <button
                onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                className="flex w-full items-center justify-center gap-2 px-4 py-3.5 rounded-xl
                           brand-gradient text-white text-center font-semibold text-sm shadow-md"
              >
                Se connecter
              </button>
              <a
                href="https://wa.me/221000000000"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl
                           bg-[#25D366]/10 text-[#128C5E] font-semibold text-sm transition-colors
                           hover:bg-[#25D366]/20"
              >
                <Phone size={15} />
                Nous contacter
              </a>
            </div>
          </div>
        )}
      </header>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}
