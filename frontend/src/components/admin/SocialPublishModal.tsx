"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { socialApi } from "@/lib/api";
import toast from "react-hot-toast";
import { X, Globe, Loader2 } from "lucide-react";

interface Props { product: Product; onClose: () => void }

const PLATFORMS = [
  { id: "tiktok" as const, label: "TikTok", icon: "🎵", color: "border-black" },
  { id: "snapchat" as const, label: "Snapchat", icon: "👻", color: "border-yellow-400" },
];

export function SocialPublishModal({ product, onClose }: Props) {
  const [selected, setSelected] = useState<Set<"tiktok" | "snapchat">>(new Set());

  const toggle = (p: "tiktok" | "snapchat") => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () => socialApi.publish(product.id, Array.from(selected)),
    onSuccess: () => {
      toast.success("Publication en cours sur les réseaux !");
      onClose();
    },
    onError: () => toast.error("Erreur lors de la publication"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Globe className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold">Publier sur les Réseaux</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-medium text-sm">{product.name}</p>
            {product.video_url && (
              <video src={product.video_url} className="mt-2 rounded-lg w-full max-h-40 object-cover" muted />
            )}
          </div>

          <p className="text-sm text-gray-500">Sélectionnez les plateformes :</p>
          <div className="space-y-3">
            {PLATFORMS.map(({ id, label, icon, color }) => (
              <button
                key={id}
                onClick={() => toggle(id)}
                className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                  selected.has(id) ? `${color} bg-gray-50` : "border-gray-200"
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className="font-medium">{label}</span>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 ${
                  selected.has(id) ? "bg-brand-600 border-brand-600" : "border-gray-300"
                }`} />
              </button>
            ))}
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={selected.size === 0 || mutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Publication...</>
            ) : (
              <><Globe size={16} /> Publier maintenant</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
