export type Role =
  | "STUDENT"
  | "PROFESSIONAL"
  | "COMPANY"
  | "COORDINATOR"
  | "ADMIN";

export interface AuthPayload {
  userId: string;
  role: Role | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}
