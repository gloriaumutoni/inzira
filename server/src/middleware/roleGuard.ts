import { Request, Response, NextFunction } from "express";
import { Role } from "../types";

export const roleGuard =
  (...allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const role = req.auth?.role;

    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({ success: false, error: "Forbidden" });
      return;
    }

    next();
  };
