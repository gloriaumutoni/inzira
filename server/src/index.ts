import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRouter from "./routes/index";
import { errorHandler } from "./middleware/index";

const app = express();

// Security headers
app.use(helmet());

// Allow requests from the frontend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);

// Parse JSON request bodies
app.use(express.json());

// Parse cookies (needed for refresh token)
app.use(cookieParser());

// All API routes live under /api
app.use("/api", apiRouter);

// Health check endpoint — used to verify the server is running
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Handle all errors
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
