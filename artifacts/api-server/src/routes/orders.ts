import { Router } from "express";
import { store } from "../lib/store";
import { CreateOrderBody, AdvanceOrderParams } from "@workspace/api-zod";
import { requireAdminKey } from "../lib/adminAuth";

const router = Router();

router.get("/orders", requireAdminKey, (_req, res) => {
  res.json(store.orders);
});

router.post("/order-form", (req, res) => {
  const rawItems = req.body.items;
  const customer = req.body.customer;

  if (!rawItems || typeof rawItems !== "string") {
    res.status(400).json({ error: "items is required (comma-separated text)" });
    return;
  }

  const parsed = rawItems
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (parsed.length === 0) {
    res.status(400).json({ error: "No items provided" });
    return;
  }

  const order = store.createFreetextOrder({
    customer: typeof customer === "string" ? customer : undefined,
    items: parsed,
  });

  res.status(201).json(order);
});

router.post("/orders", (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { order, error } = store.createOrder(parsed.data);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  res.status(201).json(order);
});

router.post("/orders/:id/advance", requireAdminKey, (req, res) => {
  const { id } = AdvanceOrderParams.parse(req.params);
  const order = store.advanceOrder(id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

export default router;
