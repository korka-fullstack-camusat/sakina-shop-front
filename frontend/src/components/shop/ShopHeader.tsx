"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, ShoppingCart, Menu, X, Instagram, Facebook } from "lucide-react";
import { LoginModal } from "@/components/shop/LoginModal";
import { useCartStore, cartCount } from "@/store/cart";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";

const NAV_LINKS = [
  { href: "/",            label: "Accueil"     },
  { href: "#collections", label: "Collections" },
  { href: "#about",       label: "À propos"    },
  { href: "#contact",     label: "Contact"     },
];

export function ShopHeader() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const { items, setOpen: openCart } = useCartStore();
  const count = cartCount(items);

  // Live settings from DB
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn:  () => settingsApi.get().then((r) => r.data),
    staleTime: 60_000,
  });

  const promoBanner = settings?.promo_banner ??
    "✨ Livraison gratuite dès 50 000 FCFA d'achat · Qualité premium, Élégance africaine";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ── Promo banner ─────────────────────────────────────────── */}
      <div className="bg-brand-950 text-white text-center text-xs sm:text-sm py-2 px-4 font-medium tracking-wide">
        <span className="text-gold-300">{promoBanner}</span>
      </div>

      {/* ── Main header ───────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <ShoppingBag className="text-white" size={17} />
              </div>
              <div className="leading-none">
                <span className="font-serif text-xl font-bold text-brand-900 tracking-tight">
                  {settings?.shop_name?.split(" ")[0] ?? "Sakina"}
                </span>
                <span className="font-serif text-xl font-bold text-gold-600 tracking-tight">
                  {" "}{settings?.shop_name?.split(" ").slice(1).join(" ") ?? "Shop"}
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="relative text-sm font-medium text-gray-600 hover:text-brand-800 transition-colors group"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-gold-500 group-hover:w-full transition-all duration-300 rounded-full" />
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Social icons — desktop */}
              <div className="hidden sm:flex items-center gap-1">
                {settings?.instagram && (
                  <a href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
                     target="_blank" rel="noreferrer" aria-label="Instagram"
                     className="p-2 text-gray-400 hover:text-brand-600 transition-colors">
                    <Instagram size={17} />
                  </a>
                )}
                {settings?.facebook && (
                  <a href={`https://facebook.com/${settings.facebook}`}
                     target="_blank" rel="noreferrer" aria-label="Facebook"
                     className="p-2 text-gray-400 hover:text-brand-600 transition-colors">
                    <Facebook size={17} />
                  </a>
                )}
                {!settings?.instagram && !settings?.facebook && (
                  <>
                    <a href="#" aria-label="Instagram"
                       className="p-2 text-gray-400 hover:text-brand-600 transition-colors">
                      <Instagram size={17} />
                    </a>
                    <a href="#" aria-label="Facebook"
                       className="p-2 text-gray-400 hover:text-brand-600 transition-colors">
                      <Facebook size={17} />
                    </a>
                  </>
                )}
              </div>

              {/* Cart icon */}
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

              {/* Se connecter — gold button */}
              <button
                onClick={() => setLoginOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 gold-gradient text-white text-sm
                           font-semibold px-5 py-2.5 rounded-full shadow-md shadow-gold-900/20
                           hover:opacity-90 hover:scale-105 transition-all"
              >
                Se connecter
              </button>

              {/* Mobile burger */}
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

        {/* ── Mobile menu ───────────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 animate-fade-in shadow-lg">
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
              className="block w-full mt-2 px-4 py-3 rounded-xl gold-gradient text-white
                         text-center font-semibold text-sm shadow-md"
            >
              Se connecter
            </button>
          </div>
        )}
      </header>

      {/* ── Login modal ───────────────────────────────────────────── */}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}
