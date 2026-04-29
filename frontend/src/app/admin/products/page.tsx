"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, videosApi, socialApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Film, Globe, Eye, EyeOff, Trash2, Search, AlertTriangle, X } from "lucide-react";
import { ProductFormModal }    from "@/components/admin/ProductFormModal";
import { VideoGenerateModal }  from "@/components/admin/VideoGenerateModal";
import { SocialPublishModal }  from "@/components/admin/SocialPublishModal";

// ── Modal de confirmation de suppression ──────────────────────────────────────
function DeleteConfirmModal({
  product,
  onConfirm,
  onCancel,
  isPending,
}: {
  product:   Product;
  onConfirm: () => void;
  onCancel:  () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 z-10 animate-slide-up">

        {/* Close */}
        <button onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          <X size={16} />
        </button>

        {/* Icône */}
        <div className="flex items-center justify-center mb-5">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
            <Trash2 size={24} className="text-red-500" />
          </div>
        </div>

        {/* Texte */}
        <h2 className="font-serif text-xl font-bold text-gray-900 text-center mb-2">
          Supprimer ce produit ?
        </h2>
        <p className="text-gray-400 text-sm text-center leading-relaxed mb-5">
          Vous êtes sur le point de supprimer
          <span className="font-semibold text-gray-700"> « {product.name} »</span>.
        </p>

        {/* Avertissement */}
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6">
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 leading-relaxed">
            Cette action est <strong>irréversible</strong>. Les images et données associées seront définitivement perdues.
          </p>
        </div>

        {/* Boutons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="py-3 text-sm font-semibold text-white bg-red-500 rounded-2xl hover:bg-red-600 transition-colors shadow-md shadow-red-900/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Suppression…</>
            ) : (
              <><Trash2 size={14} /> Supprimer</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const qc = useQueryClient();
  const [createOpen,      setCreateOpen]      = useState(false);
  const [videoProduct,    setVideoProduct]    = useState<Product | null>(null);
  const [socialProduct,   setSocialProduct]   = useState<Product | null>(null);
  const [deleteProduct,   setDeleteProduct]   = useState<Product | null>(null);
  const [search,          setSearch]          = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn:  () => productsApi.adminList().then((r) => r.data),
  });

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const publishMutation = useMutation({
    mutationFn: (id: string) => productsApi.publish(id),
    onSuccess:  () => { toast.success("Produit publié !"); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
  });
  const unpublishMutation = useMutation({
    mutationFn: (id: string) => productsApi.unpublish(id),
    onSuccess:  () => { toast.success("Produit dépublié");  qc.invalidateQueries({ queryKey: ["admin-products"] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess:  () => {
      toast.success("Produit supprimé");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteProduct(null);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-gray-400 text-sm mt-1">{products.length} produit(s) au total</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 brand-gradient text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-900/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Nouveau produit
        </button>
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent transition-all"
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
          <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          Chargement…
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Produit</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Prix</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Stock</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Statut</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Vidéo IA</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      {search ? `Aucun résultat pour « ${search} »` : "Aucun produit créé"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Name + image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0 shadow-sm">
                            {product.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.images[0]}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full brand-gradient opacity-30" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{product.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 font-semibold text-brand-700">
                        {product.price.toLocaleString("fr-FR")} {product.currency}
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4">
                        <span className={`font-medium ${product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-orange-500" : "text-gray-700"}`}>
                          {product.stock}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.is_published
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {product.is_published ? "✓ Publié" : "⏳ Brouillon"}
                        </span>
                      </td>

                      {/* Video */}
                      <td className="px-6 py-4">
                        {product.video_url ? (
                          <a
                            href={product.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-600 text-xs flex items-center gap-1 hover:underline font-medium"
                          >
                            <Film size={12} /> Voir
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {/* Generate video */}
                          <button
                            onClick={() => setVideoProduct(product)}
                            title="Générer vidéo IA"
                            className="p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <Film size={15} />
                          </button>

                          {/* Publish to social */}
                          {product.video_url && (
                            <button
                              onClick={() => setSocialProduct(product)}
                              title="Publier sur les réseaux"
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Globe size={15} />
                            </button>
                          )}

                          {/* Publish / unpublish */}
                          <button
                            onClick={() =>
                              product.is_published
                                ? unpublishMutation.mutate(product.id)
                                : publishMutation.mutate(product.id)
                            }
                            title={product.is_published ? "Dépublier" : "Publier"}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            {product.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteProduct(product)}
                            title="Supprimer"
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────── */}
      <ProductFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {videoProduct && (
        <VideoGenerateModal product={videoProduct} onClose={() => setVideoProduct(null)} />
      )}
      {socialProduct && (
        <SocialPublishModal product={socialProduct} onClose={() => setSocialProduct(null)} />
      )}
      {deleteProduct && (
        <DeleteConfirmModal
          product={deleteProduct}
          onConfirm={() => deleteMutation.mutate(deleteProduct.id)}
          onCancel={() => setDeleteProduct(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
