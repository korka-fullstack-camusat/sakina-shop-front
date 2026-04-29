"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Eye, EyeOff, Lock, X } from "lucide-react";

const schema = z.object({
  email:    z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
});
type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export function LoginModal({ onClose }: Props) {
  const router   = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1. Login → obtenir le token
      const res = await authApi.login(data.email, data.password);
      let token = res.data.access_token;
      setToken(token);

      // 2. Vérifier le rôle
      const me = await authApi.me();
      if (me.data.role !== "admin") {
        // 3. Compte client → promotion automatique en admin (dev)
        const promoted = await authApi.promote(data.email, data.password);
        token = promoted.data.access_token;
        setToken(token);
        toast.success("Compte promu en administrateur !");
      } else {
        toast.success("Connexion réussie !");
      }

      onClose();
      router.push("/admin/dashboard");
    } catch {
      toast.error("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-slide-up z-10">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X size={17} />
        </button>

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex p-4 rounded-2xl brand-gradient shadow-lg shadow-brand-900/20 mb-4">
            <Lock className="text-white" size={22} />
          </div>
          <h2 className="font-serif text-xl font-bold text-brand-950">
            Espace Administrateur
          </h2>
          <p className="text-gray-400 text-sm mt-1">Connectez-vous pour accéder au dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Adresse email
            </label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="admin@sakina-shop.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                         focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400
                         focus:border-transparent transition-all"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5">⚠ {errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm bg-gray-50
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400
                           focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400
                           hover:text-gray-600 transition-colors p-1"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1.5">⚠ {errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full brand-gradient text-white font-semibold py-3.5 rounded-xl mt-2
                       hover:opacity-90 active:scale-[0.99] disabled:opacity-60
                       disabled:cursor-not-allowed shadow-md transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connexion…
              </span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          Accès réservé aux administrateurs autorisés
        </p>
      </div>
    </div>
  );
}
