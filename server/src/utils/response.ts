import { Response } from "express";
import { ApiResponse } from "../types/index";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
): void => {
  const body: ApiResponse<T> = { success: true, data };
  res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 500,
): void => {
  const body: ApiResponse<never> = { success: false, error };
  res.status(statusCode).json(body);
};
