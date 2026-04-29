"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAdminApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Shield, Trash2, ToggleLeft, ToggleRight, X, Users } from "lucide-react";

// ── New Admin Modal ────────────────────────────────────────────────────────────
function NewAdminModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "admin" });

  const mutation = useMutation({
    mutationFn: () => usersAdminApi.create(form as Parameters<typeof usersAdminApi.create>[0]),
    onSuccess: () => {
      toast.success("Administrateur créé !");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Erreur lors de la création");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 z-10 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900">Nouvel administrateur</h2>
            <p className="text-gray-400 text-xs">Accès complet au panel d&apos;administration</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: "full_name", label: "Nom complet",   type: "text",     ph: "Aminata Diallo"        },
            { key: "email",     label: "Email",           type: "email",    ph: "admin@sakina-shop.com" },
            { key: "password",  label: "Mot de passe",   type: "password", ph: "••••••••"              },
          ].map(({ key, label, type, ph }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
              <input
                type={type}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
            </div>
          ))}

          {/* Role badge — admin only, no choice */}
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
            <Shield size={15} className="text-brand-600" />
            <span className="text-sm font-semibold text-brand-700">Rôle : Administrateur</span>
          </div>
        </div>

        <div className="flex gap-3 mt-7">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.email || !form.password || !form.full_name || mutation.isPending}
            className="flex-1 py-3 text-sm brand-gradient text-white rounded-xl font-semibold
                       hover:opacity-90 disabled:opacity-50 shadow-md transition-all"
          >
            {mutation.isPending ? "Création…" : "Créer l'admin"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UtilisateursPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn:  () => usersAdminApi.list().then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      usersAdminApi.update(id, { is_active }),
    onSuccess: (res) => {
      toast.success(res.data.is_active ? "Compte activé" : "Compte désactivé");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersAdminApi.delete(id),
    onSuccess: () => {
      toast.success("Administrateur supprimé");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Erreur");
    },
  });

  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Administrateurs</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gérez les accès au panel d&apos;administration</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 brand-gradient text-white px-4 py-2.5
                     rounded-xl text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Ajouter un admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total admins", value: users.length,  color: "text-brand-600"   },
          { label: "Actifs",       value: activeCount,   color: "text-emerald-600" },
          { label: "Inactifs",     value: users.length - activeCount, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className={`text-3xl font-bold font-serif ${color}`}>{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Users list */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
          <div className="w-5 h-5 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          Chargement…
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {users.length === 0 ? (
            <div className="p-14 text-center text-gray-400">
              <Users size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">Aucun administrateur</p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-4 inline-flex items-center gap-2 brand-gradient text-white px-5 py-2.5
                           rounded-xl text-sm font-semibold shadow-md hover:opacity-90"
              >
                <Plus size={15} /> Créer le premier admin
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4
                             hover:bg-gray-50/60 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center
                                  flex-shrink-0 font-bold text-sm text-white shadow-sm">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.full_name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                        Admin
                      </span>
                      {!user.is_active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                          Inactif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-gray-400 hidden sm:block flex-shrink-0">
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: user.id, is_active: !user.is_active })}
                      title={user.is_active ? "Désactiver" : "Activer"}
                      className={`p-2 rounded-lg transition-colors ${
                        user.is_active
                          ? "text-emerald-500 hover:bg-emerald-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {user.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer ${user.full_name} ?`))
                          deleteMutation.mutate(user.id);
                      }}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showNew && <NewAdminModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
