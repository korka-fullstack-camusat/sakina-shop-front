"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { CartSidebar } from "@/components/shop/CartSidebar";
import { ProductModal } from "@/components/shop/ProductModal";
import { Search, SlidersHorizontal, X, LayoutGrid } from "lucide-react";

export default function ProduitsPage() {
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState<"default" | "price_asc" | "price_desc">("default");
  const [category, setCategory] = useState<string>("Tous");
  const [showSort, setShowSort] = useState(false);

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey:        ["products"],
    queryFn:         () => productsApi.listPublished().then((r) => r.data),
    refetchInterval: 30_000,
  });

  /* Catégories dynamiques */
  const categories = useMemo(() => {
    const cats = Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean)));
    return ["Tous", ...cats];
  }, [allProducts]);

  const filtered = useMemo(() => {
    let list = allProducts.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      const matchCat = category === "Tous" || p.category === category;
      return matchSearch && matchCat;
    });

    if (sortBy === "price_asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [allProducts, search, sortBy, category]);

  const SORT_LABELS: Record<typeof sortBy, string> = {
    default:    "Par défaut",
    price_asc:  "Prix ↑",
    price_desc: "Prix ↓",
  };

  const clearFilters = () => { setSearch(""); setCategory("Tous"); setSortBy("default"); };
  const hasFilters = search || category !== "Tous" || sortBy !== "default";

  return (
    <div className="min-h-screen bg-cream-50">
      <ShopHeader />
      <CartSidebar />
      <ProductModal />

      {/* ── Hero / banner ────────────────────────────────────────────────────── */}
      <div className="hero-gradient py-8 sm:py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-lime-300 font-serif italic text-xs sm:text-sm uppercase tracking-widest mb-2">
            Notre boutique
          </p>
          <h1 className="font-serif text-2xl sm:text-5xl font-bold text-white mb-2">
            Tous nos Produits
          </h1>
          <p className="text-white/60 text-xs sm:text-base">
            {isLoading
              ? "Chargement…"
              : `${allProducts.length} article${allProducts.length > 1 ? "s" : ""} disponible${allProducts.length > 1 ? "s" : ""}`
            }
          </p>

          {/* Barre de recherche */}
          <div className="mt-5 sm:mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit…"
                className="w-full bg-white/95 backdrop-blur-sm pl-10 pr-10 py-3 sm:py-4 rounded-2xl
                           text-sm text-gray-800 placeholder:text-gray-400 shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg"
               className="w-full block">
            <path d="M0 40 L1440 40 L1440 20 C1080 0 360 0 0 20 Z" fill="#fefcf8" />
          </svg>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ── Filtres catégories — scrollables horizontalement ─────────────── */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full
                            transition-all whitespace-nowrap border
                            ${category === cat
                              ? "brand-gradient text-white border-transparent shadow-md"
                              : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700"
                            }`}
              >
                {cat === "Tous" ? (
                  <span className="flex items-center gap-1.5">
                    <LayoutGrid size={12} /> Tous
                    {cat === "Tous" && category === "Tous" && (
                      <span className="ml-1 text-[10px] opacity-70">({allProducts.length})</span>
                    )}
                  </span>
                ) : cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <p className="text-xs sm:text-sm text-gray-500">
            {search || category !== "Tous" ? (
              <>
                <span className="font-semibold text-brand-700">{filtered.length}</span>{" "}
                résultat{filtered.length > 1 ? "s" : ""}
              </>
            ) : (
              <>
                <span className="font-semibold text-brand-700">{filtered.length}</span>{" "}
                produit{filtered.length > 1 ? "s" : ""}
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            {/* Reset filtres */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500
                           bg-white border border-gray-200 px-3 py-2 rounded-xl transition-colors"
              >
                <X size={12} /> Effacer
              </button>
            )}

            {/* Tri */}
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600
                           bg-white border border-gray-200 px-3 sm:px-4 py-2 rounded-xl
                           hover:border-brand-300 hover:text-brand-700 transition-colors shadow-sm"
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">{SORT_LABELS[sortBy]}</span>
                <span className="sm:hidden">Trier</span>
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100
                                rounded-2xl shadow-xl z-30 py-2 min-w-[160px] animate-fade-in">
                  {(Object.entries(SORT_LABELS) as [typeof sortBy, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === key
                          ? "text-brand-700 font-semibold bg-brand-50"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Grille produits ───────────────────────────────────────────────── */}
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 sm:py-28">
            <p className="text-4xl sm:text-5xl mb-4">🔍</p>
            <p className="text-gray-500 text-base sm:text-lg font-medium mb-2">
              Aucun produit trouvé
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Essayez un autre mot-clé ou une autre catégorie
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 brand-gradient text-white font-semibold
                         px-6 py-3 rounded-full text-sm shadow-md hover:opacity-90 transition-opacity"
            >
              <X size={15} /> Effacer les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-brand-950 text-white/50 py-8 border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-white text-xl font-bold">Sakina</span>
              <span className="font-serif text-lime-400 text-xl font-bold"> Shop</span>
            </div>
            <p className="text-xs sm:text-sm text-center">
              © {new Date().getFullYear()} Sakina Shop. Tous droits réservés.
            </p>
            <div className="flex gap-4 sm:gap-5 text-xs sm:text-sm">
              {["Instagram", "TikTok", "Facebook"].map((s) => (
                <a key={s} href="#" className="hover:text-lime-400 transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
