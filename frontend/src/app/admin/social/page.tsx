"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { SocialPublishModal } from "@/components/admin/SocialPublishModal";
import {
  Globe2, CheckCircle, XCircle, Clock, ExternalLink,
  TrendingUp, Plus
} from "lucide-react";
import toast from "react-hot-toast";

const PLATFORM_CONFIG = {
  tiktok:   { label: "TikTok",   bg: "bg-black text-white",            dot: "bg-white"     },
  snapchat: { label: "Snapchat", bg: "bg-yellow-400 text-yellow-900",  dot: "bg-yellow-900" },
};

const STATUS_CONFIG = {
  pending:   { label: "En attente",  color: "bg-gray-100 text-gray-600",       icon: Clock        },
  published: { label: "Publié",      color: "bg-emerald-50 text-emerald-700",  icon: CheckCircle  },
  failed:    { label: "Échoué",      color: "bg-red-50 text-red-600",          icon: XCircle      },
};

export default function SocialPage() {
  const qc = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn:  () => productsApi.adminList().then((r) => r.data),
  });

  // Récupère tous les posts sociaux de tous les produits
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["all-social-posts"],
    queryFn: async () => {
      const { socialApi } = await import("@/lib/api");
      const results = await Promise.all(
        products.map((p) =>
          socialApi.getPostsByProduct(p.id).then((r) => r.data)
        )
      );
      return results.flat().sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: products.length > 0,
    refetchInterval: 15_000,
  });

  const productsWithVideo = products.filter((p) => p.video_url);
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const stats = {
    total:     allPosts.length,
    published: allPosts.filter((p) => p.status === "published").length,
    pending:   allPosts.filter((p) => p.status === "pending").length,
    failed:    allPosts.filter((p) => p.status === "failed").length,
    tiktok:    allPosts.filter((p) => p.platform === "tiktok" && p.status === "published").length,
    snapchat:  allPosts.filter((p) => p.platform === "snapchat" && p.status === "published").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Réseaux Sociaux</h1>
          <p className="text-gray-400 text-sm mt-0.5">Publiez vos produits sur TikTok et Snapchat</p>
        </div>
        <button
          onClick={() => {
            if (productsWithVideo.length === 0) {
              toast.error("Générez d'abord une vidéo pour un produit");
              return;
            }
            setSelectedProduct(productsWithVideo[0]);
          }}
          className="inline-flex items-center gap-2 brand-gradient text-white px-4 py-2.5
                     rounded-xl text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Publier un produit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total publications", value: stats.total,     color: "text-gray-700"     },
          { label: "Publiées",           value: stats.published, color: "text-emerald-600"  },
          { label: "En attente",         value: stats.pending,   color: "text-amber-600"    },
          { label: "Échouées",           value: stats.failed,    color: "text-red-500"      },
          { label: "TikTok",             value: stats.tiktok,    color: "text-gray-900"     },
          { label: "Snapchat",           value: stats.snapchat,  color: "text-yellow-600"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className={`text-2xl font-bold font-serif ${color}`}>{value}</p>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Products with video — quick publish */}
      {productsWithVideo.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-600" />
            Produits prêts à publier (avec vidéo)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {productsWithVideo.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200
                           hover:border-brand-400 hover:bg-brand-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full brand-gradient opacity-30" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-brand-700">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">✓ Vidéo prête</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">Historique des publications</h2>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : allPosts.length === 0 ? (
          <div className="p-10 text-center">
            <Globe2 size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune publication pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allPosts.map((post) => {
              const pCfg    = PLATFORM_CONFIG[post.platform];
              const sCfg    = STATUS_CONFIG[post.status];
              const product = productMap[post.product_id];
              const StatusIcon = sCfg.icon;
              return (
                <div key={post.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60">
                  {/* Product thumb */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
                    {product?.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full brand-gradient opacity-20" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {product?.name ?? "Produit supprimé"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "short", year: "numeric",
                          })
                        : new Date(post.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  {/* Platform */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${pCfg.bg}`}>
                    {pCfg.label}
                  </span>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${sCfg.color}`}>
                    <StatusIcon size={11} />
                    <span className="hidden sm:inline">{sCfg.label}</span>
                  </span>

                  {/* External link */}
                  {post.post_url && (
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <SocialPublishModal
          product={selectedProduct}
          onClose={() => { setSelectedProduct(null); qc.invalidateQueries({ queryKey: ["all-social-posts"] }); }}
        />
      )}
    </div>
  );
}
