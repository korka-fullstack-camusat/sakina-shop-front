// ── Product ───────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  video_url: string | null;
  stock: number;
  is_published: boolean;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

// ── VideoJob ──────────────────────────────────────────────────────────────────
interface VideoJob {
  id: string;
  product_id: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  runway_task_id: string | null;
  video_url: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

// ── SocialPost ────────────────────────────────────────────────────────────────
interface SocialPost {
  id: string;
  product_id: string;
  platform: "tiktok" | "snapchat";
  status: "pending" | "published" | "failed";
  post_id: string | null;
  post_url: string | null;
  error: string | null;
  published_at: string | null;
  created_at: string;
}

// ── Order ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  currency: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  payment_method?: "especes" | "mobile_money" | "virement" | "autre";
  payment_status: "pending" | "paid";
  notes?: string;
  invoice_number?: string;
  created_at: string;
  updated_at: string;
}

// ── AdminUser ─────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "client";
  is_active: boolean;
  created_at: string;
}
