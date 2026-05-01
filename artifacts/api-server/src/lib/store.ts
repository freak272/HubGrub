export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  createdAt: string;
};

export type OrderStatus = "NEW" | "PACKED" | "SHIPPED" | "DELIVERED";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  customer: string;
  phone?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
};

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const store = {
  products: [] as Product[],
  orders: [] as Order[],

  addProduct(input: {
    name: string;
    price: number;
    stock?: number;
    sku?: string;
  }): Product {
    const p: Product = {
      id: newId(),
      name: input.name.trim(),
      price: Number(input.price) || 0,
      stock: Math.max(0, Math.floor(Number(input.stock ?? 0))),
      sku:
        input.sku?.trim() ||
        "SKU-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    this.products.unshift(p);
    return p;
  },

  deleteProduct(id: string): boolean {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.products.splice(idx, 1);
    return true;
  },

  createOrder(input: {
    customer?: string;
    items: Array<{ productId: string; quantity: number }>;
  }): { order: Order; error?: string } {
    if (input.items.length === 0)
      return { order: null as unknown as Order, error: "No items in order" };

    const orderItems: OrderItem[] = [];
    for (const entry of input.items) {
      const p = this.products.find((x) => x.id === entry.productId);
      if (!p) {
        return {
          order: null as unknown as Order,
          error: `Product not found: ${entry.productId}`,
        };
      }
      if (p.stock < entry.quantity) {
        return {
          order: null as unknown as Order,
          error: `Insufficient stock for "${p.name}": ${p.stock} available`,
        };
      }
      orderItems.push({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: entry.quantity,
      });
    }

    const total = orderItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0,
    );

    const order: Order = {
      id: newId(),
      customer: (input.customer ?? "Walk-in").trim() || "Walk-in",
      items: orderItems,
      total,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };

    for (const it of orderItems) {
      const p = this.products.find((x) => x.id === it.productId);
      if (p) p.stock = Math.max(0, p.stock - it.quantity);
    }

    this.orders.unshift(order);
    return { order };
  },

  createFreetextOrder(input: { customer?: string; phone?: string; items: string[] }): Order {
    const orderItems: OrderItem[] = input.items
      .map((s) => s.trim())
      .filter(Boolean)
      .map((item) => ({
        productId: "freetext-" + newId(),
        name: item,
        price: 0,
        quantity: 1,
      }));

    const order: Order = {
      id: newId(),
      customer: (input.customer ?? "Guest").trim() || "Guest",
      phone: input.phone?.trim() || undefined,
      items: orderItems,
      total: 0,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };

    this.orders.unshift(order);
    return order;
  },

  advanceOrder(id: string): Order | null {
    const o = this.orders.find((x) => x.id === id);
    if (!o) return null;
    const flow: OrderStatus[] = ["NEW", "PACKED", "SHIPPED", "DELIVERED"];
    const idx = flow.indexOf(o.status);
    if (idx < flow.length - 1) {
      o.status = flow[idx + 1]!;
    }
    return o;
  },

  getStats() {
    const deliveredRevenue = this.orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.total, 0);
    const stockValue = this.products.reduce(
      (sum, p) => sum + p.price * p.stock,
      0,
    );
    const openOrders = this.orders.filter(
      (o) => o.status !== "DELIVERED",
    ).length;
    const ordersByStatus: Record<string, number> = {
      NEW: 0,
      PACKED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
    };
    for (const o of this.orders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    }
    return {
      totalProducts: this.products.length,
      totalOrders: this.orders.length,
      openOrders,
      deliveredRevenue,
      stockValue,
      ordersByStatus,
    };
  },
};

// Seed a couple of example products so the app isn't empty on first load
store.addProduct({ name: "Cold Brew Concentrate", price: 14.99, stock: 48, sku: "CBC-001" });
store.addProduct({ name: "Ceramic Pour-Over Kit", price: 34.5, stock: 15, sku: "CPK-002" });
store.addProduct({ name: "Coffee Grinder Pro", price: 89.0, stock: 8, sku: "CGP-003" });
