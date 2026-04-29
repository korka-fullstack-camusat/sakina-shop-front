"use client";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { X, Upload, ImageIcon, Trash2, CheckCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";

const schema = z.object({
  name:        z.string().min(2, "Nom requis"),
  description: z.string().min(10, "Description requise (min. 10 caractères)"),
  price:       z.coerce.number().positive("Prix invalide"),
  currency:    z.string().default("XOF"),
  category:    z.string().min(1, "Catégorie requise"),
  stock:       z.coerce.number().int().min(0),
});
type FormData = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void }

const CATEGORIES = [
  "Vêtements", "Chaussures", "Accessoires", "Bijoux",
  "Beauté", "Maison", "Alimentaire", "Autre",
];

export function ProductFormModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [files,    setFiles]    = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    const merged = [...files, ...accepted].slice(0, 5);
    setFiles(merged);
    // Génère les URLs de prévisualisation
    setPreviews(merged.map((f) => URL.createObjectURL(f)));
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept:   { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 5,
    onDrop,
  });

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    const newFiles    = files.filter((_, i) => i !== idx);
    const newPreviews = previews.filter((_, i) => i !== idx);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver:      zodResolver(schema),
    defaultValues: { currency: "XOF", stock: 0 },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const product = await productsApi.create(data).then((r) => r.data);
      if (files.length > 0) {
        await productsApi.uploadImages(product.id, files);
      }
      return product;
    },
    onSuccess: () => {
      toast.success("Produit créé avec succès !");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      reset();
      previews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviews([]);
      onClose();
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900">Nouveau produit</h2>
            <p className="text-gray-400 text-xs mt-0.5">Remplissez les informations et ajoutez les photos</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form ─────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="px-7 py-6 space-y-5">

          {/* Ligne Nom + Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Nom du produit <span className="text-red-400">*</span>
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Ex : Robe Kente dorée"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Catégorie <span className="text-red-400">*</span>
              </label>
              <select
                {...register("category")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              >
                <option value="">Choisir…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
          </div>

          {/* Ligne Prix + Devise + Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Prix <span className="text-red-400">*</span>
              </label>
              <input
                {...register("price")}
                type="number"
                min="0"
                step="any"
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Devise</label>
              <select
                {...register("currency")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              >
                <option value="XOF">XOF (FCFA)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock</label>
              <input
                {...register("stock")}
                type="number"
                min="0"
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Décrivez le produit, ses matières, ses caractéristiques…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                         focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all resize-none"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* ── Zone upload ───────────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Photos <span className="text-gray-400 font-normal">(max 5 · JPG, PNG, WEBP)</span>
            </label>

            {files.length < 5 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
                  ${isDragActive
                    ? "border-brand-400 bg-brand-50"
                    : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
                  }`}
              >
                <input {...getInputProps()} />
                <div className="inline-flex p-3 bg-gray-100 rounded-xl mb-3">
                  <Upload size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {isDragActive ? "Déposez ici…" : "Glissez vos photos ou cliquez pour sélectionner"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {5 - files.length} emplacement{5 - files.length > 1 ? "s" : ""} restant{5 - files.length > 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* ── Aperçu des images sélectionnées ──────────── */}
            {previews.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2.5">
                  {previews.length} photo{previews.length > 1 ? "s" : ""} sélectionnée{previews.length > 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                      {/* Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay + bouton supprimer */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {/* Badge numéro */}
                      <div className="absolute top-1 left-1 w-5 h-5 bg-black/50 text-white text-[9px] font-bold rounded-md flex items-center justify-center">
                        {i + 1}
                      </div>
                      {/* Badge photo principale */}
                      {i === 0 && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <span className="block text-center bg-brand-600/90 text-white text-[8px] font-semibold px-1 py-0.5 rounded-md">
                            Principale
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Placeholder slots vides */}
                  {Array.from({ length: Math.max(0, 5 - previews.length) }).map((_, i) => (
                    <div key={`empty-${i}`}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center">
                      <ImageIcon size={16} className="text-gray-200" />
                    </div>
                  ))}
                </div>

                {/* Conseil photo principale */}
                <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                  <CheckCircle size={10} className="text-brand-400" />
                  La 1ʳᵉ photo sera utilisée comme image principale du produit
                </p>
              </div>
            )}
          </div>

          {/* ── Submit ────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-3.5 text-sm font-semibold text-white brand-gradient rounded-2xl
                         hover:opacity-90 disabled:opacity-60 shadow-md transition-all
                         flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Création…</>
              ) : (
                "Créer le produit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
