import { Request, Response, NextFunction } from 'express'

// Placeholder — will be implemented in Step 3
// This middleware will check if the user has the required role
export const roleGuard =
  (..._allowedRoles: string[]) =>
  (_req: Request, _res: Response, next: NextFunction): void => {
    next()
  }
