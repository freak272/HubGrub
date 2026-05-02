import { Router } from "express";
import { store } from "../lib/store";
import { requireAdminKey } from "../lib/adminAuth";

const router = Router();

router.get("/stats", requireAdminKey, (_req, res) => {
  res.json(store.getStats());
});

export default router;
