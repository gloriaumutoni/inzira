import { Request, Response, NextFunction } from "express";
import NodeCache from "node-cache";

const cache = new NodeCache({ checkperiod: 60 });

/**
 * TTL-only response cache for GET routes. Key includes the authenticated
 * user id (when present) so per-user data (e.g. /me) never leaks across
 * users. No active invalidation on writes - entries just expire.
 */
export const cacheMiddleware = (ttlSeconds: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== "GET") {
      next();
      return;
    }

    const key = `${req.auth?.userId ?? "anon"}:${req.originalUrl}`;
    const cached = cache.get<{ status: number; body: unknown }>(key);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.status(cached.status).json(cached.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, { status: res.statusCode, body }, ttlSeconds);
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
};
