"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

/**
 * La page /admin/login n'est plus utilisée — l'authentification
 * se fait via le modal "Se connecter" sur la boutique (page d'accueil).
 *
 * Si quelqu'un arrive ici directement :
 * - déjà connecté → on redirige vers /admin/dashboard
 * - pas connecté  → on redirige vers / (boutique, qui contient le modal)
 */
export default function LoginRedirectPage() {
  const router   = useRouter();
  const token    = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(token ? "/admin/dashboard" : "/");
  }, [hydrated, token, router]);

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/60 text-sm font-medium">Redirection…</p>
      </div>
    </div>
  );
}
