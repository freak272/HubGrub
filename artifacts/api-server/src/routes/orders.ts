import { Router } from "express";
import { store } from "../lib/store";
import { CreateOrderBody, AdvanceOrderParams } from "@workspace/api-zod";

const router = Router();

router.get("/orders", (_req, res) => {
  res.json(store.orders);
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

router.post("/orders/:id/advance", (req, res) => {
  const { id } = AdvanceOrderParams.parse(req.params);
  const order = store.advanceOrder(id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

export default router;
