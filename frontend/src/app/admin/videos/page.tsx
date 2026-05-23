"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, videosApi, resolveUrl } from "@/lib/api";
import { VideoGenerateModal } from "@/components/admin/VideoGenerateModal";
import {
  Film, Play, Clock, CheckCircle, XCircle, Loader2, Plus, Trash2,
  AlertTriangle, X, Download, Ban,
} from "lucide-react";
import toast from "react-hot-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: "En attente",  color: "bg-gray-100 text-gray-600",      icon: Clock        },
  processing: { label: "En cours…",  color: "bg-blue-50 text-blue-600",   icon: Loader2      },
  completed:  { label: "Terminé",    color: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
  failed:     { label: "Échoué", color: "bg-red-50 text-red-600",     icon: XCircle      },
  cancelled:  { label: "Annulé",     color: "bg-orange-50 text-orange-600", icon: Ban         },
};

// ── Modal d'annulation de génération ─────────────────────────────────────────
function CancelConfirmModal({
  job,
  productName,
  onConfirm,
  onCancel,
  isPending,
}: {
  job: VideoJob;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 text-orange-600">
            <Ban size={18} />
            <h3 className="font-bold text-base">Annuler la génération</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Voulez-vous annuler la génération vidéo de{" "}
            <span className="font-semibold text-gray-900">{productName}</span> ?
          </p>
          <div className="bg-orange-50 rounded-xl p-3 text-xs text-orange-700 space-y-1">
            <p className="font-semibold">ℹ️ Ce qui se passe :</p>
            <ul className="list-disc list-inside space-y-0.5 text-orange-600">
              <li>Le job sera marqué comme annulé</li>
              <li>Si FFmpeg est en cours, il finira sa frame actuelle</li>
              <li>Aucune vidéo ne sera sauvegardée</li>
            </ul>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold
                         text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Continuer la génération
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white
                         text-sm font-semibold transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2"
            >
              {isPending
                ? <><Loader2 size={14} className="animate-spin" /> Annulation…</>
                : <><Ban size={14} /> Annuler</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal de confirmation de suppression ──────────────────────────────────────
function DeleteConfirmModal({
  job,
  productName,
  onConfirm,
  onCancel,
  isPending,
}: {
  job: VideoJob;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} />
            <h3 className="font-bold text-base">Supprimer la vidéo</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Vous êtes sur le point de supprimer définitivement la vidéo de{" "}
            <span className="font-semibold text-gray-900">{productName}</span>.
          </p>
          <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600 space-y-1">
            <p className="font-semibold">⚠️ Cette action est irréversible :</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-500">
              <li>Le fichier MP4 sera supprimé du stockage</li>
              <li>La vidéo sera retirée de la fiche produit</li>
              <li>L&apos;historique de cette génération sera effacé</li>
            </ul>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold
                         text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm
                         font-semibold transition-colors disabled:opacity-60 flex items-center
                         justify-center gap-2"
            >
              {isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Suppression…</>
              ) : (
                <><Trash2 size={14} /> Supprimer</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal sélection produit ───────────────────────────────────────────────────
function ProductPickerModal({
  products,
  onSelect,
  onClose,
}: {
  products: Product[];
  onSelect: (p: Product) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">Choisir un produit</h2>
            <p className="text-gray-400 text-xs mt-0.5">Sélectionnez le produit pour lequel générer une vidéo</p>
          </div>
          <button onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Grille produits */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200
                         hover:border-brand-400 hover:bg-brand-50 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveUrl(p.images[0])} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full brand-gradient opacity-30" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-brand-700">
                  {p.name}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {p.video_url ? "✓ Vidéo existante" : "Pas de vidéo"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Téléchargement direct (blob) ──────────────────────────────────────────────
async function downloadVideo(url: string, filename: string) {
  try {
    const res  = await fetch(url);
    const blob = await res.blob();
    const obj  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = obj;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(obj);
  } catch {
    window.open(url, "_blank");   // fallback si fetch bloqué (CORS)
  }
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function VideosPage() {
  const qc = useQueryClient();
  const [showPicker,      setShowPicker]      = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [jobToDelete,     setJobToDelete]     = useState<VideoJob | null>(null);
  const [jobToCancel,     setJobToCancel]     = useState<VideoJob | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn:  () => productsApi.adminList().then((r) => r.data),
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["all-video-jobs"],
    queryFn: async () => {
      const results = await Promise.all(
        products.map((p) => videosApi.listByProduct(p.id).then((r) => r.data))
      );
      return results.flat().sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: products.length > 0,
    // Polling rapide (3s) si un job est en cours, sinon 15s
    refetchInterval: (query) => {
      const data = query.state.data as VideoJob[] | undefined;
      const hasActive = data?.some(
        (j) => j.status === "pending" || j.status === "processing"
      );
      return hasActive ? 3_000 : 15_000;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => videosApi.deleteJob(jobId),
    onSuccess: () => {
      toast.success("Vidéo supprimée");
      setJobToDelete(null);
      qc.invalidateQueries({ queryKey: ["all-video-jobs"] });
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const cancelMutation = useMutation({
    mutationFn: (jobId: string) => videosApi.cancelJob(jobId),
    onSuccess: () => {
      toast.success("Génération annulée");
      setJobToCancel(null);
      qc.invalidateQueries({ queryKey: ["all-video-jobs"] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || "Erreur inconnue";
      toast.error(`Annulation échouée : ${msg}`, { duration: 8000 });
    },
  });

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const visibleJobs = jobs.filter((j) => j.status !== "failed" && j.status !== "cancelled");

  const stats = {
    total:      jobs.length,
    completed:  jobs.filter((j) => j.status === "completed").length,
    processing: jobs.filter((j) => j.status === "processing" || j.status === "pending").length,
    failed:     jobs.filter((j) => j.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Vidéos IA</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Générez des vidéos publicitaires · voix off française · format 9:16
          </p>
        </div>
        <button
          onClick={() => {
            if (products.length === 0) { toast.error("Créez d'abord un produit"); return; }
            setShowPicker(true);
          }}
          className="inline-flex items-center gap-2 brand-gradient text-white px-4 py-2.5
                     rounded-xl text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Générer une vidéo
        </button>
      </div>

      {/* Stats — masquées sur mobile */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-4">
        {[
          { label: "Total",      value: stats.total,      color: "text-gray-700"    },
          { label: "Terminées",  value: stats.completed,  color: "text-emerald-600" },
          { label: "En cours",   value: stats.processing, color: "text-blue-600"    },
          { label: "Échouées",   value: stats.failed,     color: "text-red-500"     },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className={`text-2xl font-bold font-serif ${color}`}>{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Historique */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">Historique des générations</h2>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-400">
            <Loader2 className="animate-spin mx-auto mb-2" size={20} />
            <p className="text-sm">Chargement…</p>
          </div>
        ) : visibleJobs.length === 0 ? (
          <div className="p-10 text-center">
            <Film size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune génération réussie pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visibleJobs.map((job) => {
              const cfg        = STATUS_CONFIG[job.status];
              const product    = productMap[job.product_id];
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={job.id}
                  onClick={() => {
                    if (job.status === "pending" || job.status === "processing") {
                      setJobToCancel(job);
                    }
                  }}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors
                    ${(job.status === "pending" || job.status === "processing")
                      ? "hover:bg-orange-50/60 cursor-pointer"
                      : "hover:bg-gray-50/60"
                    }`}
                >
                  {/* Miniature produit */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
                    {product?.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveUrl(product.images[0])} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full brand-gradient opacity-20" />
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {product?.name ?? job.product_id}
                    </p>

                    {/* Barre de progression réelle */}
                    {(job.status === "processing" || job.status === "pending") ? (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${job.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-brand-600 w-7 text-right flex-shrink-0">
                            {job.progress || 0}%
                          </span>
                        </div>
                        <p className="text-[10px] text-blue-500 font-medium truncate">
                          {job.step || (job.status === "pending" ? "En attente de démarrage…" : "Génération en cours…")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(job.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Chip "Annuler" sur les jobs actifs */}
                  {(job.status === "pending" || job.status === "processing") && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                                     text-orange-500 bg-orange-50 px-2 py-1 rounded-full flex-shrink-0
                                     border border-orange-200 animate-pulse">
                      <Ban size={9} /> Annuler
                    </span>
                  )}

                  {/* Badge statut — masqué si en cours (remplacé par la barre) */}
                  {job.status !== "processing" && job.status !== "pending" && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1
                                  rounded-full flex-shrink-0 ${cfg.color}`}
                    >
                      <StatusIcon size={11} />
                      {cfg.label}
                    </span>
                  )}

                  {/* Voir + Télécharger la vidéo */}
                  {job.status === "completed" && job.video_url && (
                    <>
                      <a
                        href={job.video_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex-shrink-0"
                        title="Voir la vidéo"
                      >
                        <Play size={15} />
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadVideo(job.video_url!, `${productMap[job.product_id]?.name ?? "video"}.mp4`); }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                        title="Télécharger la vidéo"
                      >
                        <Download size={15} />
                      </button>
                    </>
                  )}

                  {/* Supprimer — uniquement pour les vidéos terminées */}
                  {job.status === "completed" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setJobToDelete(job); }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg
                                 transition-colors flex-shrink-0"
                      title="Supprimer la vidéo"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal sélection produit */}
      {showPicker && (
        <ProductPickerModal
          products={products}
          onSelect={(p) => { setShowPicker(false); setSelectedProduct(p); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Modal génération */}
      {selectedProduct && (
        <VideoGenerateModal
          product={selectedProduct}
          onClose={() => {
            setSelectedProduct(null);
            qc.invalidateQueries({ queryKey: ["all-video-jobs"] });
          }}
        />
      )}

      {/* Modal annulation génération */}
      {jobToCancel && (
        <CancelConfirmModal
          job={jobToCancel}
          productName={productMap[jobToCancel.product_id]?.name ?? "ce produit"}
          onConfirm={() => cancelMutation.mutate(jobToCancel.id)}
          onCancel={() => setJobToCancel(null)}
          isPending={cancelMutation.isPending}
        />
      )}

      {/* Modal confirmation suppression */}
      {jobToDelete && (
        <DeleteConfirmModal
          job={jobToDelete}
          productName={productMap[jobToDelete.product_id]?.name ?? "ce produit"}
          onConfirm={() => deleteMutation.mutate(jobToDelete.id)}
          onCancel={() => setJobToDelete(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
