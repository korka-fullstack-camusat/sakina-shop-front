"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi, ShopSettingsData } from "@/lib/api";
import toast from "react-hot-toast";
import { Save, Store, Phone, Mail, Globe2, Instagram, Facebook, CheckCircle, Loader2 } from "lucide-react";

type FormState = Omit<ShopSettingsData, "delivery_fee" | "free_delivery_threshold"> & {
  delivery_fee: string;
  free_delivery_threshold: string;
  promo_banner: string;
};

const defaultForm: FormState = {
  shop_name:               "Sakina Shop",
  tagline:                 "",
  promo_banner:            "✨ Livraison gratuite dès 50 000 FCFA d'achat",
  website_url:             "",
  phone:                   "",
  whatsapp:                "",
  email:                   "contact@sakina-shop.com",
  address:                 "",
  instagram:               "",
  tiktok:                  "",
  facebook:                "",
  snapchat:                "",
  currency:                "FCFA",
  delivery_fee:            "0",
  free_delivery_threshold: "50000",
};

export default function ParametresPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(defaultForm);

  // ── Load settings from API ──────────────────────────────────────────────────
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn:  () => settingsApi.get().then((r) => r.data),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        ...settings,
        delivery_fee:            String(settings.delivery_fee),
        free_delivery_threshold: String(settings.free_delivery_threshold),
      });
    }
  }, [settings]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () =>
      settingsApi.update({
        ...form,
        delivery_fee:            parseFloat(form.delivery_fee) || 0,
        free_delivery_threshold: parseFloat(form.free_delivery_threshold) || 0,
      }),
    onSuccess: () => {
      toast.success("Paramètres sauvegardés — la boutique est mise à jour !");
      // Invalidate so client shop re-fetches automatically
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  const Field = ({
    label, fieldKey, type = "text", placeholder = "", icon,
  }: {
    label: string;
    fieldKey: keyof FormState;
    type?: string;
    placeholder?: string;
    icon?: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        )}
        <input
          type={type}
          value={form[fieldKey] as string}
          onChange={(e) => setForm({ ...form, [fieldKey]: e.target.value })}
          placeholder={placeholder}
          className={`w-full border border-gray-200 rounded-xl py-3 text-sm bg-gray-50
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all
                     ${icon ? "pl-10 pr-4" : "px-4"}`}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Les modifications sont répercutées en temps réel sur la boutique client
        </p>
      </div>

      {/* Live update notice */}
      <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-2xl p-4">
        <CheckCircle size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-700 leading-relaxed">
          Chaque sauvegarde met à jour la boutique <strong>instantanément</strong> —
          nom de la boutique, bannière promo, contacts, réseaux sociaux, frais de livraison.
        </p>
      </div>

      {/* Shop info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Store size={16} className="text-brand-600" /> Informations boutique
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom de la boutique" fieldKey="shop_name" />
          <Field label="Devise" fieldKey="currency" />
        </div>
        <Field label="Slogan" fieldKey="tagline" placeholder="Votre slogan…" />
        <Field label="URL de la boutique" fieldKey="website_url" placeholder="https://sakina-shop.com" />
        <Field label="Bannière promo (header)" fieldKey="promo_banner" placeholder="✨ Livraison gratuite dès…" />
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Phone size={16} className="text-brand-600" /> Contact
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Téléphone"  fieldKey="phone"    placeholder="+221 77 000 00 00" icon={<Phone size={14} />} />
          <Field label="WhatsApp"   fieldKey="whatsapp" placeholder="+221 77 000 00 00" icon={<Phone size={14} />} />
          <Field label="Email"      fieldKey="email"    type="email" placeholder="contact@…" icon={<Mail size={14} />} />
          <Field label="Adresse"    fieldKey="address"  placeholder="Dakar, Sénégal" />
        </div>
      </div>

      {/* Livraison */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Globe2 size={16} className="text-brand-600" /> Livraison
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Frais de livraison (FCFA)"              fieldKey="delivery_fee"              type="number" placeholder="0" />
          <Field label="Livraison gratuite à partir de (FCFA)"  fieldKey="free_delivery_threshold"   type="number" placeholder="50000" />
        </div>
      </div>

      {/* Social media */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Instagram size={16} className="text-brand-600" /> Réseaux sociaux
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Instagram" fieldKey="instagram" placeholder="@sakina_shop"  icon={<Instagram size={14} />} />
          <Field label="TikTok"    fieldKey="tiktok"    placeholder="@sakina_shop"  icon={<Globe2 size={14} />}    />
          <Field label="Facebook"  fieldKey="facebook"  placeholder="sakina.shop"   icon={<Facebook size={14} />}  />
          <Field label="Snapchat"  fieldKey="snapchat"  placeholder="@sakina_shop"  icon={<Globe2 size={14} />}    />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5
                   text-sm font-semibold rounded-xl shadow-md transition-all
                   brand-gradient text-white hover:opacity-90 disabled:opacity-60"
      >
        {saveMutation.isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Sauvegarde…</>
        ) : (
          <><Save size={16} /> Sauvegarder les paramètres</>
        )}
      </button>
    </div>
  );
}
