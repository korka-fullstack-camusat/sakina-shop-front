"use client";
import { Plus, Clock } from "lucide-react";

export default function SocialPage() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Réseaux Sociaux</h1>
          <p className="text-gray-400 text-sm mt-0.5">Publiez vos produits sur TikTok, Snapchat et Facebook</p>
        </div>
        <button disabled
          className="inline-flex items-center gap-2 bg-gray-200 text-gray-400 px-4 py-2.5
                     rounded-xl text-sm font-semibold cursor-not-allowed">
          <Plus size={16} /> Publier un produit
        </button>
      </div>

      {/* Message */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center gap-3">
        <Clock size={28} className="text-amber-400" />
        <p className="text-gray-500 text-sm font-medium">Service indisponible pour le moment</p>
        <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
          Cette fonctionnalité sera disponible très bientôt. En attendant, téléchargez votre vidéo depuis <span className="font-semibold text-gray-500">Vidéos IA</span> et publiez-la vous-même sur vos réseaux.
        </p>
      </div>

    </div>
  );
}
