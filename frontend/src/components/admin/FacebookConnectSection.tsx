"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socialApi } from "@/lib/api";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader2, Trash2, CheckCircle, Plus } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface FbPage {
  page_id:      string;
  name:         string;
  access_token: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────
const exchangeToken  = (short_lived_token: string) =>
  api.post<FbPage[]>("/social/facebook-exchange", { short_lived_token });

const connectPage    = (data: FbPage) =>
  api.post<{ connected: boolean; id: string; name: string }>(
    "/social/facebook-connect-page", data
  );

const disconnectPage = (doc_id: string) =>
  api.delete(`/social/facebook-disconnect/${doc_id}`);

// ── Chargement SDK Facebook ───────────────────────────────────────────────────
function useFacebookSDK() {
  const [ready, setReady] = useState(false);
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  useEffect(() => {
    if (!appId || typeof window === "undefined") return;
    if (window.FB) { setReady(true); return; }

    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version: "v18.0" });
      setReady(true);
    };

    if (!document.getElementById("fb-sdk")) {
      const s = document.createElement("script");
      s.id    = "fb-sdk";
      s.src   = "https://connect.facebook.net/fr_FR/sdk.js";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
  }, [appId]);

  return ready;
}

// ── Composant principal ───────────────────────────────────────────────────────
export function FacebookConnectSection() {
  const qc        = useQueryClient();
  const fbReady   = useFacebookSDK();
  const appId     = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  // Pages disponibles après login
  const [availablePages, setAvailablePages] = useState<FbPage[]>([]);
  const [showPagePicker,  setShowPagePicker]  = useState(false);
  const [exchanging,      setExchanging]       = useState(false);

  // Pages déjà connectées
  const { data: connected = [] } = useQuery({
    queryKey: ["facebook-accounts"],
    queryFn:  () => socialApi.facebookAccounts().then((r) => r.data),
  });

  // Déconnecter une page
  const disconnectMut = useMutation({
    mutationFn: (id: string) => disconnectPage(id),
    onSuccess:  () => {
      toast.success("Page déconnectée");
      qc.invalidateQueries({ queryKey: ["facebook-accounts"] });
    },
    onError: () => toast.error("Erreur lors de la déconnexion"),
  });

  // Connecter une page sélectionnée
  const connectMut = useMutation({
    mutationFn: (page: FbPage) => connectPage(page),
    onSuccess:  (_, page) => {
      toast.success(`"${page.name}" connectée !`);
      setShowPagePicker(false);
      setAvailablePages([]);
      qc.invalidateQueries({ queryKey: ["facebook-accounts"] });
    },
    onError: () => toast.error("Erreur lors de la connexion"),
  });

  // Lancer le login Facebook
  const handleLogin = () => {
    if (!fbReady || !window.FB) {
      toast.error("SDK Facebook non chargé. Vérifiez NEXT_PUBLIC_FACEBOOK_APP_ID.");
      return;
    }

    window.FB.login(async (response: any) => {
      if (!response.authResponse?.accessToken) {
        toast.error("Connexion Facebook annulée");
        return;
      }

      const shortToken = response.authResponse.accessToken;
      setExchanging(true);

      try {
        const { data: pages } = await exchangeToken(shortToken);
        if (pages.length === 0) {
          toast.error("Aucune Page Facebook trouvée. Créez d'abord une Page dans Facebook.");
        } else {
          setAvailablePages(pages);
          setShowPagePicker(true);
        }
      } catch {
        toast.error("Erreur lors de la récupération des Pages Facebook.");
      } finally {
        setExchanging(false);
      }
    }, { scope: "pages_manage_posts,pages_read_engagement,pages_show_list" });
  };

  if (!appId) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex gap-3">
          <span className="text-2xl">📘</span>
          <div>
            <p className="font-semibold text-blue-800 text-sm">Connexion Facebook non configurée</p>
            <p className="text-blue-600 text-xs mt-1 leading-relaxed">
              Ajoutez <code className="bg-blue-100 px-1 rounded font-mono">NEXT_PUBLIC_FACEBOOK_APP_ID=votre_app_id</code>{" "}
              dans <code className="bg-blue-100 px-1 rounded font-mono">.env.local</code> du frontend,{" "}
              et <code className="bg-blue-100 px-1 rounded font-mono">FACEBOOK_APP_SECRET</code> dans le backend.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pages déjà connectées */}
      {connected.length > 0 && (
        <div className="space-y-2">
          {connected.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl"
            >
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-base">📘</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{page.name}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle size={10} /> Connectée
                </p>
              </div>
              <button
                onClick={() => disconnectMut.mutate(page.id)}
                disabled={disconnectMut.isPending}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Déconnecter"
              >
                {disconnectMut.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton connecter */}
      <button
        onClick={handleLogin}
        disabled={!fbReady || exchanging}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4
                   bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold text-sm
                   rounded-2xl transition-colors disabled:opacity-60 shadow-sm"
      >
        {exchanging ? (
          <><Loader2 size={16} className="animate-spin" /> Récupération des Pages…</>
        ) : (
          <><Plus size={16} /> Connecter un compte Facebook</>
        )}
      </button>

      {/* Sélecteur de Pages */}
      {showPagePicker && availablePages.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-serif font-bold text-gray-900">Choisir une Page</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                Sélectionnez la Page à connecter pour la publication
              </p>
            </div>
            <div className="p-5 space-y-2">
              {availablePages.map((page) => (
                <button
                  key={page.page_id}
                  onClick={() => connectMut.mutate(page)}
                  disabled={connectMut.isPending}
                  className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-200
                             hover:border-blue-400 hover:bg-blue-50 rounded-2xl transition-all text-left
                             disabled:opacity-60"
                >
                  <div className="w-10 h-10 bg-[#1877F2] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white">📘</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{page.name}</p>
                    <p className="text-xs text-gray-400">ID : {page.page_id}</p>
                  </div>
                  {connectMut.isPending && (
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  )}
                </button>
              ))}
              <button
                onClick={() => { setShowPagePicker(false); setAvailablePages([]); }}
                className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
