import { Router } from "express";
import { store } from "../lib/store";
import { CreateProductBody, DeleteProductParams } from "@workspace/api-zod";
import { requireAdminKey } from "../lib/adminAuth";

const router = Router();

router.get("/products", (_req, res) => {
  res.json(store.products);
});

router.post("/products", requireAdminKey, (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const product = store.addProduct(parsed.data);
  res.status(201).json(product);
});

router.delete("/products/:id", requireAdminKey, (req, res) => {
  const { id } = DeleteProductParams.parse(req.params);
  const ok = store.deleteProduct(id);
  if (!ok) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
