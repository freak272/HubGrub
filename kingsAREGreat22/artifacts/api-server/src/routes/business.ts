import { Router } from "express";
import { store } from "../lib/store";
import { requireAdminKey } from "../lib/adminAuth";

const router = Router();

router.get("/business-profile", (_req, res) => {
  res.json(store.businessProfile);
});

router.get("/setup-business", requireAdminKey, (_req, res) => {
  res.json(store.businessProfile);
});

router.post("/setup-business", requireAdminKey, (req, res) => {
  const { type, subtype, name } = req.body;

  if (type !== undefined) store.businessProfile.type = type || null;
  if (subtype !== undefined) store.businessProfile.subtype = subtype || null;
  if (name !== undefined) store.businessProfile.name = (name as string).trim() || "My Business";

  res.json(store.businessProfile);
});

export default router;
