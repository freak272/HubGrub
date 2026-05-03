import { Router } from "express";
import { store } from "../lib/store";
import { requireAdminKey } from "../lib/adminAuth";

const router = Router();

router.get("/business-profile", (_req, res) => {
  res.json(store.businessProfile);
});

router.get("/setup-business", requireAdminKey, (_req, res) => {
  res.json({ ...store.businessProfile, code: store._default.code });
});

router.post("/setup-business", requireAdminKey, (req, res) => {
  const { type, subtype, name, description, themeColor, emoji } = req.body;
  const profile = store.businessProfile;

  if (type !== undefined) profile.type = type || null;
  if (subtype !== undefined) profile.subtype = subtype || null;
  if (name !== undefined) profile.name = (name as string).trim() || "My Business";
  if (description !== undefined) profile.description = (description as string).trim() || undefined;
  if (themeColor !== undefined) profile.themeColor = themeColor || undefined;
  if (emoji !== undefined) profile.emoji = emoji || undefined;

  res.json({ ...profile, code: "DEFAULT" });
});

export default router;
