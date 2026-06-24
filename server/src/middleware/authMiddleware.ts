import { Request, Response, NextFunction } from 'express'

// Placeholder — will be implemented in Step 3
// This middleware will verify JWT tokens and attach user info to req.auth
export const authMiddleware = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next()
}
