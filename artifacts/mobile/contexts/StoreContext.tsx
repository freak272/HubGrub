import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadOrders,
  loadProducts,
  newId,
  nextStatus,
  saveOrders,
  saveProducts,
  type Order,
  type OrderItem,
  type OrderStatus,
  type Product,
} from "@/lib/storage";

type StoreContextValue = {
  ready: boolean;
  products: Product[];
  orders: Order[];
  addProduct: (input: { name: string; price: number; stock: number; sku?: string }) => Product;
  updateProductStock: (id: string, delta: number) => void;
  deleteProduct: (id: string) => void;
  createOrder: (input: { customer: string; items: OrderItem[] }) => Order | null;
  advanceOrder: (id: string) => void;
  deleteOrder: (id: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      const [p, o] = await Promise.all([loadProducts(), loadOrders()]);
      setProducts(p);
      setOrders(o);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) saveProducts(products);
  }, [products, ready]);

  useEffect(() => {
    if (ready) saveOrders(orders);
  }, [orders, ready]);

  const addProduct: StoreContextValue["addProduct"] = useCallback((input) => {
    const product: Product = {
      id: newId(),
      name: input.name.trim(),
      price: Number(input.price) || 0,
      stock: Math.max(0, Math.floor(Number(input.stock) || 0)),
      sku: (input.sku?.trim() || "SKU-" + Math.random().toString(36).slice(2, 7).toUpperCase()),
      createdAt: Date.now(),
    };
    setProducts((prev) => [product, ...prev]);
    return product;
  }, []);

  const updateProductStock = useCallback((id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
      ),
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const createOrder: StoreContextValue["createOrder"] = useCallback((input) => {
    if (input.items.length === 0) return null;
    const total = input.items.reduce((s, it) => s + it.price * it.quantity, 0);
    const order: Order = {
      id: newId(),
      items: input.items,
      total,
      status: "NEW" as OrderStatus,
      customer: input.customer.trim() || "Walk-in",
      createdAt: Date.now(),
    };
    setOrders((prev) => [order, ...prev]);
    setProducts((prev) =>
      prev.map((p) => {
        const it = input.items.find((i) => i.productId === p.id);
        if (!it) return p;
        return { ...p, stock: Math.max(0, p.stock - it.quantity) };
      }),
    );
    return order;
  }, []);

  const advanceOrder = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus(o.status) } : o)),
    );
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      products,
      orders,
      addProduct,
      updateProductStock,
      deleteProduct,
      createOrder,
      advanceOrder,
      deleteOrder,
    }),
    [
      ready,
      products,
      orders,
      addProduct,
      updateProductStock,
      deleteProduct,
      createOrder,
      advanceOrder,
      deleteOrder,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
