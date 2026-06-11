import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";

  res.status(500).json({ success: false, error: message });
};
