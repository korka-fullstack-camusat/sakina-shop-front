import { create } from "zustand";

interface ShopState {
  selectedProduct:    Product | null;
  setSelectedProduct: (p: Product | null) => void;
  checkoutOpen:       boolean;
  setCheckoutOpen:    (open: boolean) => void;
}

export const useShopStore = create<ShopState>((set) => ({
  selectedProduct:    null,
  setSelectedProduct: (p) => set({ selectedProduct: p }),
  checkoutOpen:       false,
  setCheckoutOpen:    (open) => set({ checkoutOpen: open }),
}));
