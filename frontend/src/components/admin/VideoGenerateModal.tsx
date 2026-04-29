"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { videosApi } from "@/lib/api";
import toast from "react-hot-toast";
import { X, Film, Loader2, CheckCircle, AlertCircle, Mic, MicOff, Square } from "lucide-react";

interface Props { product: Product; onClose: () => void }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

// ── Hook reconnaissance vocale ────────────────────────────────────────────────
function useSpeechRecognition(onTranscript: (text: string, isFinal: boolean) => void) {
  const recRef              = useRef<SR>(null);
  const [active, setActive]       = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SRClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRClass) { setSupported(false); return; }

    const rec: SR = new SRClass();
    rec.lang           = "fr-FR";
    rec.continuous     = true;
    rec.interimResults = true;

    rec.onresult = (e: SR) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript as string;
        onTranscript(t, e.results[i].isFinal as boolean);
      }
    };

    rec.onerror = (e: SR) => {
      if (e.error !== "aborted") toast.error(`Micro : ${e.error}`);
      setActive(false);
    };

    rec.onend = () => setActive(false);
    recRef.current = rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (active) { rec.stop(); setActive(false); }
    else        { rec.start(); setActive(true); }
  }, [active]);

  return { active, supported, toggle };
}

// ── Composant principal ───────────────────────────────────────────────────────
export function VideoGenerateModal({ product, onClose }: Props) {
  const [prompt, setPrompt]       = useState("");
  const [interim, setInterim]     = useState("");   // texte en cours de transcription
  const [jobId, setJobId]         = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<VideoJob | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Callback reçu depuis le hook : accumule le texte final, affiche l'intérimaire
  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setPrompt((prev) => (prev ? prev + " " : "") + text.trim());
      setInterim("");
    } else {
      setInterim(text);
    }
  }, []);

  const { active: micActive, supported: micSupported, toggle: toggleMic } =
    useSpeechRecognition(handleTranscript);

  const generateMutation = useMutation({
    mutationFn: () => videosApi.generate(product.id, prompt).then((r) => r.data),
    onSuccess: (job) => {
      setJobId(job.id);
      toast.success("Génération lancée !");
    },
    onError: () => toast.error("Erreur lors du lancement"),
  });

  // Polling statut
  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await videosApi.getJob(jobId).then((r) => r.data);
        setJobStatus(res);
        if (res.status === "completed" || res.status === "failed") {
          clearInterval(interval);
          if (res.status === "completed") toast.success("Vidéo générée avec succès !");
          if (res.status === "failed") toast.error("Génération échouée");
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Film className="text-brand-600" size={20} />
            <h2 className="text-lg font-bold">Génération Vidéo IA</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Produit */}
          <div className="bg-brand-50 rounded-xl p-4">
            <p className="font-medium text-sm">{product.name}</p>
            <p className="text-xs text-gray-400 mt-1">{product.category}</p>
          </div>

          {!product.images[0] && (
            <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-lg">
              ⚠️ Ajoutez d&apos;abord une image au produit pour générer une vidéo.
            </div>
          )}

          {/* Prompt avec bouton micro */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Prompt personnalisé <span className="text-gray-400">(optionnel)</span>
              </label>
              {micSupported ? (
                <button
                  type="button"
                  onClick={toggleMic}
                  title={micActive ? "Arrêter l'enregistrement" : "Dicter le prompt"}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all
                    ${micActive
                      ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                      : "bg-gray-100 text-gray-600 hover:bg-brand-100 hover:text-brand-700"
                    }`}
                >
                  {micActive
                    ? <><Square size={11} fill="white" /> Arrêter</>
                    : <><Mic size={11} /> Dicter</>
                  }
                </button>
              ) : (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MicOff size={11} /> Non supporté
                </span>
              )}
            </div>

            {/* Zone de texte + overlay intérimaire */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder={
                  micActive
                    ? "🎙️ Parlez maintenant…"
                    : "Laissez vide pour un script auto, ou dictez / écrivez votre prompt…"
                }
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none transition-colors
                  ${micActive
                    ? "border-red-300 focus:ring-red-300 bg-red-50/30"
                    : "border-gray-200 focus:ring-brand-400"
                  }`}
              />

              {/* Texte intérimaire (en cours de transcription) */}
              {micActive && interim && (
                <p className="absolute bottom-2.5 left-4 right-4 text-sm text-gray-400 italic pointer-events-none truncate">
                  {prompt ? "…" : ""}{interim}
                </p>
              )}
            </div>

            {/* Indicateur visuel micro actif */}
            {micActive && (
              <div className="flex items-center gap-2 mt-2">
                <span className="flex gap-0.5">
                  {[1,2,3,4].map((i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-red-400 rounded-full animate-bounce"
                      style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </span>
                <span className="text-xs text-red-500 font-medium">Enregistrement en cours…</span>
              </div>
            )}
          </div>

          {/* Statut job */}
          {jobStatus && (
            <div className={`rounded-xl p-4 ${
              jobStatus.status === "completed" ? "bg-green-50" :
              jobStatus.status === "failed"    ? "bg-red-50"   : "bg-brand-50"
            }`}>
              <div className="flex items-center gap-2">
                {jobStatus.status === "completed"  && <CheckCircle className="text-green-600" size={18} />}
                {jobStatus.status === "failed"     && <AlertCircle className="text-red-600"   size={18} />}
                {(jobStatus.status === "pending" || jobStatus.status === "processing") && (
                  <Loader2 className="text-brand-600 animate-spin" size={18} />
                )}
                <span className="text-sm font-medium">
                  {jobStatus.status === "pending"    && "En attente..."}
                  {jobStatus.status === "processing" && "Génération en cours…"}
                  {jobStatus.status === "completed"  && "Vidéo prête !"}
                  {jobStatus.status === "failed"     && `Erreur : ${jobStatus.error}`}
                </span>
              </div>
              {jobStatus.status === "completed" && jobStatus.video_url && (
                <video src={jobStatus.video_url} controls className="mt-3 rounded-lg w-full" />
              )}
            </div>
          )}

          {/* Bouton générer */}
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !product.images[0] || !!jobId || micActive}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl
                       transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {generateMutation.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Lancement...</>
            ) : (
              <><Film size={16} /> Générer la vidéo</>
            )}
          </button>

          {micActive && (
            <p className="text-center text-xs text-gray-400">
              Arrêtez l&apos;enregistrement avant de générer
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
