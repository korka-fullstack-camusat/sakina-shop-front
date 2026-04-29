import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items:     CartItem[];
  isOpen:    boolean;
  addItem:   (product: Product) => void;
  removeItem:(productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear:     () => void;
  setOpen:   (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items:  [],
      isOpen: false,

      addItem: (product) => {
        const exists = get().items.find((i) => i.product.id === product.id);
        set({
          items: exists
            ? get().items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              )
            : [...get().items, { product, quantity: 1 }],
          isOpen: true,   // ouvre le panier automatiquement
        });
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.product.id !== productId) }),

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.product.id !== productId) });
        } else {
          set({
            items: get().items.map((i) =>
              i.product.id === productId ? { ...i, quantity: qty } : i
            ),
          });
        }
      },

      clear:   () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
    }),
    { name: "sakina_cart" }
  )
);

// Sélecteurs utiles
export const cartTotal   = (items: CartItem[]) =>
  items.reduce((s, i) => s + i.product.price * i.quantity, 0);

export const cartCount   = (items: CartItem[]) =>
  items.reduce((s, i) => s + i.quantity, 0);
