import axios from "axios";
import { useAuthStore } from "@/store/auth";

const API_URL     = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const API_BASE    = API_URL.replace("/api/v1", "");

/** Corrige les URLs d'images qui pointent encore vers localhost en développement */
export function resolveUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")) {
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, API_BASE);
  }
  return url;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type":   "application/json",
    "Accept-Encoding": "gzip, deflate, br",  // active la compression côté serveur
  },
  timeout: 15_000,   // 15s max — évite les requêtes zombies
  // Déduplication implicite par React Query — pas besoin de couche supplémentaire
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Remplace récursivement toutes les URLs localhost dans un objet JSON */
function fixLocalhostUrls(obj: unknown): unknown {
  if (typeof obj === "string") return resolveUrl(obj);
  if (Array.isArray(obj))      return obj.map(fixLocalhostUrls);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fixLocalhostUrls(v)])
    );
  }
  return obj;
}

api.interceptors.response.use(
  (r) => { r.data = fixLocalhostUrls(r.data); return r; },
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      useAuthStore.getState().logout();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    api.post<{ access_token: string }>("/auth/login", { email, password }),
  register: (email: string, password: string, full_name: string) =>
    api.post<{ access_token: string }>("/auth/register", { email, password, full_name }),
  /** Bootstrap — crée le premier admin (échoue si un admin existe déjà) */
  setup:    (email: string, password: string, full_name: string) =>
    api.post<{ access_token: string }>("/auth/setup", { email, password, full_name }),
  /** Profil du token courant */
  me:       () =>
    api.get<{ id: string; email: string; full_name: string; role: string; is_active: boolean }>("/auth/me"),
  /** Promeut le compte en admin (dev seulement) */
  promote:  (email: string, password: string) =>
    api.post<{ access_token: string }>("/auth/promote", { email, password }),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  listPublished: (skip = 0, limit = 20) =>
    api.get<Product[]>("/products/", { params: { skip, limit } }),
  get:           (id: string) => api.get<Product>(`/products/${id}`),
  adminList:     (skip = 0, limit = 50) =>
    api.get<Product[]>("/products/admin/all", { params: { skip, limit } }),
  create:        (data: Partial<Product>) => api.post<Product>("/products/", data),
  update:        (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/products/${id}`, data),
  uploadImages:  (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return api.post<{ images: string[] }>(`/products/${id}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  publish:   (id: string) => api.post(`/products/${id}/publish`),
  unpublish: (id: string) => api.post(`/products/${id}/unpublish`),
  delete:    (id: string) => api.delete(`/products/${id}`),
};

// ── Videos ────────────────────────────────────────────────────────────────────
export const videosApi = {
  generate:      (product_id: string, prompt?: string) =>
    api.post<VideoJob>("/videos/generate", { product_id, prompt: prompt ?? "" }),
  getJob:        (job_id: string) => api.get<VideoJob>(`/videos/job/${job_id}`),
  listByProduct: (product_id: string) =>
    api.get<VideoJob[]>(`/videos/product/${product_id}`),
  deleteJob:     (job_id: string) => api.delete<{ deleted: boolean }>(`/videos/job/${job_id}`),
};

// ── Social ────────────────────────────────────────────────────────────────────
export interface PublishTarget {
  platform:   "tiktok" | "snapchat" | "facebook";
  account_id?: string;  // "1" ou "2" pour Facebook
}

export interface FacebookAccount {
  id:   string;
  name: string;
}

export const socialApi = {
  publish:              (product_id: string, targets: PublishTarget[]) =>
    api.post("/social/publish", { product_id, targets }),
  facebookAccounts:     () =>
    api.get<FacebookAccount[]>("/social/facebook-accounts"),
  getPostsByProduct:    (product_id: string) =>
    api.get<SocialPost[]>(`/social/product/${product_id}`),
  getPost:              (post_id: string) =>
    api.get<SocialPost>(`/social/post/${post_id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  list:         (skip = 0, limit = 50, status_filter?: string) =>
    api.get<Order[]>("/orders/", { params: { skip, limit, status_filter } }),
  publicOrder:  (data: Partial<Order>) =>
    api.post<Order>("/orders/public", data),          // sans auth — panier client
  get:          (id: string) => api.get<Order>(`/orders/${id}`),
  updateStatus: (id: string, s: Order["status"], payment_status?: Order["payment_status"]) =>
    api.patch<Order>(`/orders/${id}/status`, { status: s, payment_status }),
  delete:       (id: string) => api.delete(`/orders/${id}`),
  stats:        () => api.get<{
    total: number; pending: number; confirmed: number;
    shipped: number; delivered: number; cancelled: number; revenue: number;
  }>("/orders/stats"),
};

// ── Admin Users ───────────────────────────────────────────────────────────────
export const usersAdminApi = {
  list:   (skip = 0, limit = 50) =>
    api.get<AdminUser[]>("/admin/users/", { params: { skip, limit } }),
  create: (data: { email: string; password: string; full_name: string; role: string }) =>
    api.post<AdminUser>("/admin/users/", data),
  update: (id: string, data: Partial<AdminUser>) =>
    api.patch<AdminUser>(`/admin/users/${id}`, data),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export interface ShopSettingsData {
  shop_name: string;
  tagline: string;
  promo_banner: string;
  website_url: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  snapchat: string;
  currency: string;
  delivery_fee: number;
  free_delivery_threshold: number;
}

export const settingsApi = {
  get:    () => api.get<ShopSettingsData>("/settings/"),
  update: (data: Partial<ShopSettingsData>) => api.put<ShopSettingsData>("/settings/", data),
};
