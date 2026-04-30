"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Plus, Film, Globe, Eye, EyeOff, Trash2, Search,
  AlertTriangle, X, Edit2, Package, CheckCircle,
  Clock, ChevronRight, Play,
} from "lucide-react";
import { ProductFormModal }   from "@/components/admin/ProductFormModal";
import { VideoGenerateModal } from "@/components/admin/VideoGenerateModal";
import { SocialPublishModal } from "@/components/admin/SocialPublishModal";

// ── Modal détail produit ───────────────────────────────────────────────────────
function ProductDetailModal({
  product,
  onClose,
  onEdit,
  onVideo,
  onSocial,
  onTogglePublish,
  onDelete,
  publishPending,
}: {
  product:        Product;
  onClose:        () => void;
  onEdit:         () => void;
  onVideo:        () => void;
  onSocial:       () => void;
  onTogglePublish: () => void;
  onDelete:       () => void;
  publishPending: boolean;
}) {
  const [imgIdx, setImgIdx] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl shadow-2xl
                      animate-slide-up flex flex-col max-h-[95dvh] sm:max-h-[90vh]
                      rounded-t-3xl overflow-hidden">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-serif font-bold text-gray-900 text-lg truncate pr-4">
            {product.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Contenu scrollable ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Galerie images */}
          {product.images.length > 0 ? (
            <div className="relative">
              {/* Image principale */}
              <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.images[imgIdx]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Miniatures */}
              {product.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-gray-50/50">
                  {product.images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                        i === imgIdx ? "border-brand-500 shadow-md" : "border-transparent opacity-60"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] bg-brand-50 flex items-center justify-center">
              <Package size={48} className="text-brand-200" />
            </div>
          )}

          {/* Infos produit */}
          <div className="p-5 space-y-4">

            {/* Statut + catégorie */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                product.is_published
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {product.is_published
                  ? <><CheckCircle size={11} /> Publié</>
                  : <><Clock size={11} /> Brouillon</>
                }
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                {product.category}
              </span>
            </div>

            {/* Prix & stock */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-50 rounded-2xl p-4">
                <p className="text-xs text-brand-600 font-medium mb-1">Prix</p>
                <p className="text-xl font-bold font-serif text-brand-800">
                  {product.price.toLocaleString("fr-FR")}
                  <span className="text-sm font-normal text-brand-600 ml-1">{product.currency}</span>
                </p>
              </div>
              <div className={`rounded-2xl p-4 ${
                product.stock === 0
                  ? "bg-red-50"
                  : product.stock <= 5
                  ? "bg-orange-50"
                  : "bg-gray-50"
              }`}>
                <p className={`text-xs font-medium mb-1 ${
                  product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-orange-500" : "text-gray-500"
                }`}>Stock</p>
                <p className={`text-xl font-bold font-serif ${
                  product.stock === 0 ? "text-red-600" : product.stock <= 5 ? "text-orange-600" : "text-gray-800"
                }`}>
                  {product.stock}
                  <span className="text-sm font-normal ml-1">unités</span>
                </p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Description
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Vidéo IA */}
            {product.video_url && (
              <div className="flex items-center justify-between p-3 bg-brand-50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Film size={15} className="text-brand-600" />
                  <span className="text-sm font-semibold text-brand-700">Vidéo IA générée</span>
                </div>
                <a
                  href={product.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-600
                             hover:text-brand-800 transition-colors"
                >
                  <Play size={12} /> Voir
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Barre d'actions fixée en bas ─────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-4
                        safe-area-bottom">
          {/* Ligne 1 : actions principales */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl
                         brand-gradient text-white text-sm font-semibold shadow-sm
                         hover:opacity-90 transition-opacity"
            >
              <Edit2 size={15} /> Modifier
            </button>
            <button
              onClick={onTogglePublish}
              disabled={publishPending}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl
                          text-sm font-semibold transition-colors disabled:opacity-60 ${
                product.is_published
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {product.is_published
                ? <><EyeOff size={15} /> Dépublier</>
                : <><Eye size={15} /> Publier</>
              }
            </button>
          </div>

          {/* Ligne 2 : actions secondaires */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onVideo}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl
                         bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-100
                         transition-colors"
            >
              <Film size={14} /> Vidéo IA
            </button>
            {product.video_url ? (
              <button
                onClick={onSocial}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl
                           bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100
                           transition-colors"
              >
                <Globe size={14} /> Publier
              </button>
            ) : (
              <div className="rounded-2xl bg-gray-50/50" />
            )}
            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl
                         bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100
                         transition-colors"
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal confirmation suppression ────────────────────────────────────────────
function DeleteConfirmModal({
  product, onConfirm, onCancel, isPending,
}: {
  product: Product; onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 z-10 animate-slide-up">
        <div className="flex items-center justify-center mb-5">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
            <Trash2 size={24} className="text-red-500" />
          </div>
        </div>
        <h2 className="font-serif text-xl font-bold text-gray-900 text-center mb-2">
          Supprimer ce produit ?
        </h2>
        <p className="text-gray-400 text-sm text-center leading-relaxed mb-5">
          <span className="font-semibold text-gray-700">« {product.name} »</span> sera définitivement supprimé.
        </p>
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6">
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 leading-relaxed">
            Action <strong>irréversible</strong>. Images et données associées perdues.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} disabled={isPending}
            className="py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors disabled:opacity-50">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="py-3 text-sm font-semibold text-white bg-red-500 rounded-2xl hover:bg-red-600 transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
            {isPending
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Suppression…</>
              : <><Trash2 size={14} /> Supprimer</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ProductsPage() {
  const qc = useQueryClient();
  const [createOpen,    setCreateOpen]    = useState(false);
  const [editProduct,   setEditProduct]   = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [videoProduct,  setVideoProduct]  = useState<Product | null>(null);
  const [socialProduct, setSocialProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [search,        setSearch]        = useState("");

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
    onSuccess:  () => {
      toast.success("Produit publié !");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      // Rafraîchir le produit dans le modal détail
      setDetailProduct((prev) => prev ? { ...prev, is_published: true } : null);
    },
  });
  const unpublishMutation = useMutation({
    mutationFn: (id: string) => productsApi.unpublish(id),
    onSuccess:  () => {
      toast.success("Produit dépublié");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDetailProduct((prev) => prev ? { ...prev, is_published: false } : null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess:  () => {
      toast.success("Produit supprimé");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteProduct(null);
      setDetailProduct(null);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-gray-400 text-sm mt-1">{products.length} produit(s) au total</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 brand-gradient text-white px-5 py-2.5
                     rounded-xl text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      {/* ── Recherche ──────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                     focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent transition-all"
        />
      </div>

      {/* ── Grille de produits ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Package size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {search ? `Aucun résultat pour « ${search} »` : "Aucun produit créé"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => setDetailProduct(product)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
                         hover:shadow-md hover:border-brand-200 transition-all text-left group"
            >
              {/* Image */}
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={32} className="text-gray-200" />
                  </div>
                )}

                {/* Badge statut */}
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  product.is_published
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-400 text-white"
                }`}>
                  {product.is_published ? "Publié" : "Brouillon"}
                </span>

                {/* Badge vidéo */}
                {product.video_url && (
                  <span className="absolute top-2 right-2 bg-brand-600/90 text-white
                                   text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Film size={9} /> Vidéo
                  </span>
                )}

                {/* Flèche hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors
                                flex items-center justify-center">
                  <ChevronRight
                    size={24}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
                  />
                </div>
              </div>

              {/* Infos */}
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{product.category}</p>
                <p className="text-sm font-bold text-brand-700 mt-1.5">
                  {product.price.toLocaleString("fr-FR")}
                  <span className="text-xs font-normal text-gray-400 ml-1">{product.currency}</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────── */}

      {/* Détail produit */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onEdit={() => { setEditProduct(detailProduct); setDetailProduct(null); }}
          onVideo={() => { setVideoProduct(detailProduct); setDetailProduct(null); }}
          onSocial={() => { setSocialProduct(detailProduct); setDetailProduct(null); }}
          onTogglePublish={() =>
            detailProduct.is_published
              ? unpublishMutation.mutate(detailProduct.id)
              : publishMutation.mutate(detailProduct.id)
          }
          onDelete={() => setDeleteProduct(detailProduct)}
          publishPending={publishMutation.isPending || unpublishMutation.isPending}
        />
      )}

      {/* Création / édition */}
      <ProductFormModal open={createOpen} onClose={() => { setCreateOpen(false); }} />
      {editProduct && (
        <ProductFormModal
          open={!!editProduct}
          product={editProduct}
          onClose={() => setEditProduct(null)}
        />
      )}

      {/* Vidéo & social */}
      {videoProduct  && <VideoGenerateModal product={videoProduct}  onClose={() => setVideoProduct(null)}  />}
      {socialProduct && <SocialPublishModal product={socialProduct} onClose={() => setSocialProduct(null)} />}

      {/* Confirmation suppression */}
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
