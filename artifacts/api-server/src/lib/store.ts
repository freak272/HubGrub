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

// Match a stored contact value (phone or email) against a search term
function matchContact(stored: string | undefined, search: string): boolean {
  if (!stored || !search) return false;
  const s = search.trim();
  if (s.includes("@")) {
    // Email match — case-insensitive exact match
    return stored.toLowerCase() === s.toLowerCase();
  }
  // Phone match — normalize digits and check substring
  const normalize = (v: string) => v.replace(/\D/g, "");
  return normalize(stored).includes(normalize(s));
}

export type BusinessType = "restaurant" | "shop" | "service" | null;
export type BusinessSubtype = "fastfood" | "cafe" | "pizza" | null;

export type BusinessProfile = {
  type: BusinessType;
  subtype: BusinessSubtype;
  name: string;
  description?: string;
  themeColor?: string;
  emoji?: string;
};

export type BusinessData = {
  code: string;
  adminKey: string;
  profile: BusinessProfile;
  products: Product[];
  orders: Order[];
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function makeBusinessStore(code: string, adminKey: string, profile: BusinessProfile, products: Product[] = [], orders: Order[] = []): BusinessData {
  return { code, adminKey, profile, products, orders };
}

export const store = {
  businesses: new Map<string, BusinessData>(),

  // ── backward-compat: the "default" business (uses ADMIN_KEY from env) ──
  get _default(): BusinessData {
    const key = process.env.ADMIN_KEY ?? "mysecret123";
    let biz = this.businesses.get("DEFAULT");
    if (!biz) {
      const code = "MAIN01";
      biz = makeBusinessStore(code, key, { type: null, subtype: null, name: "My Business" });
      this.businesses.set("DEFAULT", biz);
      this.businesses.set(code, biz);
    }
    return biz;
  },

  get products(): Product[] { return this._default.products; },
  get orders(): Order[] { return this._default.orders; },
  get businessProfile(): BusinessProfile { return this._default.profile; },

  // ── Multi-tenant business registry ──
  registerBusiness(adminKey: string, profile?: Partial<BusinessProfile>): BusinessData {
    let code: string;
    do { code = generateCode(); } while (this.businesses.has(code));
    const data = makeBusinessStore(code, adminKey, {
      type: profile?.type ?? null,
      subtype: profile?.subtype ?? null,
      name: profile?.name ?? "My Business",
      description: profile?.description,
      themeColor: profile?.themeColor,
      emoji: profile?.emoji,
    });
    this.businesses.set(code, data);
    return data;
  },

  getBusiness(code: string): BusinessData | null {
    return this.businesses.get(code.toUpperCase()) ?? null;
  },

  // ── Default business methods (backward compat) ──
  addProduct(input: { name: string; price: number; stock?: number; sku?: string }): Product {
    return this._addProductTo(this._default.products, input);
  },

  deleteProduct(id: string): boolean {
    return this._deleteProductFrom(this._default.products, id);
  },

  createOrder(input: { customer?: string; items: Array<{ productId: string; quantity: number }> }): { order: Order; error?: string } {
    return this._createOrderIn(this._default.products, this._default.orders, input);
  },

  createFreetextOrder(input: { customer?: string; phone?: string; items: string[] }): Order {
    return this._createFreetextOrderIn(this._default.orders, input);
  },

  advanceOrder(id: string): Order | null {
    return this._advanceOrderIn(this._default.orders, id);
  },

  getStats() {
    return this._getStatsFrom(this._default.products, this._default.orders);
  },

  // ── Per-business methods ──
  bizAddProduct(code: string, input: { name: string; price: number; stock?: number; sku?: string }): Product | null {
    const biz = this.getBusiness(code);
    if (!biz) return null;
    return this._addProductTo(biz.products, input);
  },

  bizDeleteProduct(code: string, id: string): boolean {
    const biz = this.getBusiness(code);
    if (!biz) return false;
    return this._deleteProductFrom(biz.products, id);
  },

  bizCreateOrder(code: string, input: { customer?: string; items: Array<{ productId: string; quantity: number }> }): { order: Order; error?: string } {
    const biz = this.getBusiness(code);
    if (!biz) return { order: null as unknown as Order, error: "Business not found" };
    return this._createOrderIn(biz.products, biz.orders, input);
  },

  bizCreateFreetextOrder(code: string, input: { customer?: string; phone?: string; items: string[] }): Order | null {
    const biz = this.getBusiness(code);
    if (!biz) return null;
    return this._createFreetextOrderIn(biz.orders, input);
  },

  bizAdvanceOrder(code: string, orderId: string): Order | null {
    const biz = this.getBusiness(code);
    if (!biz) return null;
    return this._advanceOrderIn(biz.orders, orderId);
  },

  bizGetOrdersByContact(code: string, contact: string): Order[] {
    const biz = this.getBusiness(code);
    if (!biz) return [];
    return biz.orders.filter((o) => matchContact(o.phone, contact));
  },

  bizGetStats(code: string) {
    const biz = this.getBusiness(code);
    if (!biz) return null;
    return this._getStatsFrom(biz.products, biz.orders);
  },

  getOrdersByContact(contact: string): Order[] {
    return this._default.orders.filter((o) => matchContact(o.phone, contact));
  },

  // ── Internal helpers ──
  _addProductTo(products: Product[], input: { name: string; price: number; stock?: number; sku?: string }): Product {
    const p: Product = {
      id: newId(),
      name: input.name.trim(),
      price: Number(input.price) || 0,
      stock: Math.max(0, Math.floor(Number(input.stock ?? 0))),
      sku: input.sku?.trim() || "SKU-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    products.unshift(p);
    return p;
  },

  _deleteProductFrom(products: Product[], id: string): boolean {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    products.splice(idx, 1);
    return true;
  },

  _createOrderIn(products: Product[], orders: Order[], input: { customer?: string; items: Array<{ productId: string; quantity: number }> }): { order: Order; error?: string } {
    if (input.items.length === 0) return { order: null as unknown as Order, error: "No items in order" };
    const orderItems: OrderItem[] = [];
    for (const entry of input.items) {
      const p = products.find((x) => x.id === entry.productId);
      if (!p) return { order: null as unknown as Order, error: `Product not found: ${entry.productId}` };
      if (p.stock < entry.quantity) return { order: null as unknown as Order, error: `Insufficient stock for "${p.name}": ${p.stock} available` };
      orderItems.push({ productId: p.id, name: p.name, price: p.price, quantity: entry.quantity });
    }
    const total = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const order: Order = {
      id: newId(),
      customer: (input.customer ?? "Walk-in").trim() || "Walk-in",
      items: orderItems,
      total,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };
    for (const it of orderItems) {
      const p = products.find((x) => x.id === it.productId);
      if (p) p.stock = Math.max(0, p.stock - it.quantity);
    }
    orders.unshift(order);
    return { order };
  },

  _createFreetextOrderIn(orders: Order[], input: { customer?: string; phone?: string; items: string[] }): Order {
    const orderItems: OrderItem[] = input.items.map((s) => s.trim()).filter(Boolean).map((item) => ({
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
    orders.unshift(order);
    return order;
  },

  _advanceOrderIn(orders: Order[], id: string): Order | null {
    const o = orders.find((x) => x.id === id);
    if (!o) return null;
    const flow: OrderStatus[] = ["NEW", "PACKED", "SHIPPED", "DELIVERED"];
    const idx = flow.indexOf(o.status);
    if (idx < flow.length - 1) o.status = flow[idx + 1]!;
    return o;
  },

  _getStatsFrom(products: Product[], orders: Order[]) {
    const deliveredRevenue = orders.filter((o) => o.status === "DELIVERED").reduce((sum, o) => sum + o.total, 0);
    const stockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    const openOrders = orders.filter((o) => o.status !== "DELIVERED").length;
    const ordersByStatus: Record<string, number> = { NEW: 0, PACKED: 0, SHIPPED: 0, DELIVERED: 0 };
    for (const o of orders) ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    return { totalProducts: products.length, totalOrders: orders.length, openOrders, deliveredRevenue, stockValue, ordersByStatus };
  },
};

// ── Seed default business products ──
store.addProduct({ name: "Cold Brew Concentrate", price: 14.99, stock: 48, sku: "CBC-001" });
store.addProduct({ name: "Ceramic Pour-Over Kit", price: 34.5, stock: 15, sku: "CPK-002" });
store.addProduct({ name: "Coffee Grinder Pro", price: 89.0, stock: 8, sku: "CGP-003" });
store._default.profile.type = "restaurant";
store._default.profile.subtype = "cafe";
store._default.profile.name = "The Daily Grind";
store._default.profile.description = "Specialty coffee, pastries & pour-overs. Open 7am–7pm daily.";
store._default.profile.themeColor = "amber";
store._default.profile.emoji = "☕";

// ── Seed a second demo business: a pizza shop ──
const pizza = store.registerBusiness("pizza123", {
  type: "restaurant",
  subtype: "pizza",
  name: "Mario's Pizzeria",
  description: "Wood-fired Neapolitan pizza since 1987. Dine-in & takeaway.",
  themeColor: "red",
  emoji: "🍕",
});
store._addProductTo(pizza.products, { name: "Margherita Pizza", price: 16.99, stock: 30, sku: "PIZ-001" });
store._addProductTo(pizza.products, { name: "Pepperoni Pizza", price: 19.99, stock: 25, sku: "PIZ-002" });
store._addProductTo(pizza.products, { name: "Garlic Bread", price: 5.99, stock: 50, sku: "PIZ-003" });
store._addProductTo(pizza.products, { name: "Tiramisu", price: 7.99, stock: 20, sku: "PIZ-004" });

// ── Seed a third demo business: a tech repair shop ──
const repair = store.registerBusiness("repair123", {
  type: "service",
  subtype: null,
  name: "FixIt Tech",
  description: "Fast, reliable phone & laptop repairs. Most repairs done same day.",
  themeColor: "blue",
  emoji: "🔧",
});
store._addProductTo(repair.products, { name: "Screen Replacement", price: 89.99, stock: 10, sku: "FIX-001" });
store._addProductTo(repair.products, { name: "Battery Replacement", price: 49.99, stock: 15, sku: "FIX-002" });
store._addProductTo(repair.products, { name: "Water Damage Repair", price: 119.99, stock: 5, sku: "FIX-003" });
