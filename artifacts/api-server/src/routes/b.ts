import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

function requireBizAdminKey(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction, code: string): boolean {
  const biz = store.getBusiness(code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return false; }
  const key = (req.headers["x-admin-key"] as string | undefined) ?? (req.query["key"] as string | undefined);
  if (key !== biz.adminKey) { res.status(403).json({ error: "Unauthorized: invalid admin key" }); return false; }
  return true;
}

// ── Register a new business ──
router.post("/businesses", (req, res) => {
  const { adminKey, name, type, subtype, description, themeColor, emoji } = req.body;
  if (!adminKey || typeof adminKey !== "string" || adminKey.trim().length < 4) {
    res.status(400).json({ error: "adminKey must be at least 4 characters" });
    return;
  }
  const biz = store.registerBusiness(adminKey.trim(), { name, type, subtype, description, themeColor, emoji });
  res.status(201).json({ code: biz.code, adminKey: biz.adminKey, profile: biz.profile });
});

// ── List all business codes (public discovery) — deduplicated by code ──
router.get("/businesses", (_req, res) => {
  const seen = new Set<string>();
  const list: object[] = [];
  for (const b of store.businesses.values()) {
    if (seen.has(b.code)) continue;
    seen.add(b.code);
    list.push({ code: b.code, name: b.profile.name, type: b.profile.type, subtype: b.profile.subtype, emoji: b.profile.emoji });
  }
  res.json(list);
});

// ── Public: get business profile ──
router.get("/b/:code/profile", (req, res) => {
  const biz = store.getBusiness(req.params.code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  res.json(biz.profile);
});

// ── Admin: get/update business setup ──
router.get("/b/:code/setup", (req, res) => {
  if (!requireBizAdminKey(req, res, res.req?.next ?? (() => {}), req.params.code)) return;
  const biz = store.getBusiness(req.params.code)!;
  res.json({ code: biz.code, profile: biz.profile });
});

router.post("/b/:code/setup", (req, res) => {
  const { code } = req.params;
  const biz = store.getBusiness(code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  const key = (req.headers["x-admin-key"] as string | undefined) ?? (req.query["key"] as string | undefined);
  if (key !== biz.adminKey) { res.status(403).json({ error: "Unauthorized" }); return; }

  const { type, subtype, name, description, themeColor, emoji } = req.body;
  if (type !== undefined) biz.profile.type = type || null;
  if (subtype !== undefined) biz.profile.subtype = subtype || null;
  if (name !== undefined) biz.profile.name = (name as string).trim() || "My Business";
  if (description !== undefined) biz.profile.description = (description as string).trim() || undefined;
  if (themeColor !== undefined) biz.profile.themeColor = themeColor || undefined;
  if (emoji !== undefined) biz.profile.emoji = emoji || undefined;

  res.json(biz.profile);
});

// ── Public: list products ──
router.get("/b/:code/products", (req, res) => {
  const biz = store.getBusiness(req.params.code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  res.json(biz.products);
});

// ── Admin: add / delete product ──
router.post("/b/:code/products", (req, res) => {
  const { code } = req.params;
  const biz = store.getBusiness(code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  const key = (req.headers["x-admin-key"] as string | undefined) ?? (req.query["key"] as string | undefined);
  if (key !== biz.adminKey) { res.status(403).json({ error: "Unauthorized" }); return; }

  const { name, price, stock, sku } = req.body;
  if (!name || typeof name !== "string") { res.status(400).json({ error: "name is required" }); return; }
  const product = store.bizAddProduct(code, { name, price: Number(price), stock: Number(stock ?? 0), sku });
  res.status(201).json(product);
});

router.delete("/b/:code/products/:id", (req, res) => {
  const { code, id } = req.params;
  const biz = store.getBusiness(code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  const key = (req.headers["x-admin-key"] as string | undefined) ?? (req.query["key"] as string | undefined);
  if (key !== biz.adminKey) { res.status(403).json({ error: "Unauthorized" }); return; }

  const ok = store.bizDeleteProduct(code, id);
  if (!ok) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ ok: true });
});

// ── Public: place order (browse) ──
router.post("/b/:code/orders", (req, res) => {
  const { code } = req.params;
  const { customer, items } = req.body;
  const result = store.bizCreateOrder(code, { customer, items: items ?? [] });
  if (result.error) { res.status(400).json({ error: result.error }); return; }
  res.status(201).json(result.order);
});

// ── Public: place order (freetext) ──
router.post("/b/:code/order-form", (req, res) => {
  const { code } = req.params;
  const { customer, phone, items: rawItems } = req.body;
  if (!rawItems || typeof rawItems !== "string") {
    res.status(400).json({ error: "items is required (comma-separated text)" });
    return;
  }
  const parsed = rawItems.split(",").map((s: string) => s.trim()).filter(Boolean);
  if (parsed.length === 0) { res.status(400).json({ error: "No items provided" }); return; }
  const biz = store.getBusiness(code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  const order = store.bizCreateFreetextOrder(code, {
    customer: typeof customer === "string" ? customer : undefined,
    phone: typeof phone === "string" ? phone : undefined,
    items: parsed,
  });
  res.status(201).json(order);
});

// ── Admin: list all orders ──
router.get("/b/:code/orders", (req, res) => {
  const { code } = req.params;
  const biz = store.getBusiness(code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  const key = (req.headers["x-admin-key"] as string | undefined) ?? (req.query["key"] as string | undefined);
  if (key !== biz.adminKey) { res.status(403).json({ error: "Unauthorized" }); return; }
  res.json(biz.orders);
});

// ── Admin: advance order ──
router.post("/b/:code/orders/:id/advance", (req, res) => {
  const { code, id } = req.params;
  const biz = store.getBusiness(code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  const key = (req.headers["x-admin-key"] as string | undefined) ?? (req.query["key"] as string | undefined);
  if (key !== biz.adminKey) { res.status(403).json({ error: "Unauthorized" }); return; }
  const order = store.bizAdvanceOrder(code, id);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(order);
});

// ── Public: customer order history ──
router.get("/b/:code/my-orders", (req, res) => {
  const { code } = req.params;
  const phone = req.query.phone as string;
  if (!phone) { res.status(400).json({ error: "phone is required" }); return; }
  const orders = store.bizGetOrdersByPhone(code, phone);
  res.json(orders);
});

// ── Public: customer order history for default business ──
router.get("/my-orders", (req, res) => {
  const phone = req.query.phone as string;
  if (!phone) { res.status(400).json({ error: "phone is required" }); return; }
  const orders = store.getOrdersByPhone(phone);
  res.json(orders);
});

// ── Admin: stats ──
router.get("/b/:code/stats", (req, res) => {
  const { code } = req.params;
  const biz = store.getBusiness(code);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  const key = (req.headers["x-admin-key"] as string | undefined) ?? (req.query["key"] as string | undefined);
  if (key !== biz.adminKey) { res.status(403).json({ error: "Unauthorized" }); return; }
  res.json(store.bizGetStats(code));
});

export default router;
