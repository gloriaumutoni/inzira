import { verifyToken } from "@clerk/backend";
import { Request, Response, NextFunction } from "express";
import { Role } from "../types/index";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorised" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // Role may be injected via a Clerk JWT template as `role` or nested under `metadata`
    const claims = payload as Record<string, unknown>;
    const metadata = claims["metadata"] as Record<string, unknown> | undefined;
    const role =
      ((claims["role"] ?? metadata?.["role"]) as Role | null) ?? null;

    req.auth = { userId: payload.sub, role };
    next();
  } catch {
    res.status(401).json({ success: false, error: "Unauthorised" });
  }
};
