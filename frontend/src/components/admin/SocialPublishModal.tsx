"use client";
import { X, Download, Clock } from "lucide-react";

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
    window.open(url, "_blank");
  }
}

interface Props { product: Product; onClose: () => void }

const PLATFORMS = [
  { label: "TikTok",   icon: "🎵" },
  { label: "Snapchat", icon: "👻" },
  { label: "Facebook", icon: "📘" },
];

export function SocialPublishModal({ product, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">Publier sur les Réseaux</h2>
            <p className="text-gray-400 text-xs mt-0.5">Diffusion automatique des vidéos</p>
          </div>
          <button onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Aperçu produit */}
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            {product.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
              {product.video_url
                ? <p className="text-xs text-emerald-600 mt-0.5">✓ Vidéo prête</p>
                : <p className="text-xs text-red-500 mt-0.5">⚠ Pas de vidéo</p>}
            </div>
          </div>

          {/* Plateformes (affichage uniquement) */}
          <div className="space-y-2">
            {PLATFORMS.map(({ label, icon }) => (
              <div key={label}
                className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl bg-gray-50">
                <span className="text-2xl">{icon}</span>
                <p className="font-semibold text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Message service indisponible */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
            <Clock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Service indisponible pour le moment</p>
              <p className="text-amber-600 text-xs mt-1 leading-relaxed">
                La publication automatique sera bientôt disponible.
                En attendant, téléchargez votre vidéo et publiez-la manuellement sur vos réseaux.
              </p>
            </div>
          </div>

          {/* Boutons */}
          <div className="space-y-2">
            {product.video_url && (
              <button
                onClick={() => downloadVideo(product.video_url!, `${product.name}.mp4`)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-brand-300
                           text-brand-700 font-semibold text-sm rounded-2xl hover:bg-brand-50 transition-colors"
              >
                <Download size={15} /> Télécharger la vidéo
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
