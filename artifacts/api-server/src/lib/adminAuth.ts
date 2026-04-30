import type { Request, Response, NextFunction } from "express";

const ADMIN_KEY = process.env.ADMIN_KEY ?? "mysecret123";

export function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
  const key =
    (req.headers["x-admin-key"] as string | undefined) ??
    (req.query["key"] as string | undefined);

  if (key !== ADMIN_KEY) {
    res.status(403).json({ error: "Unauthorized: invalid admin key" });
    return;
  }
  next();
}
