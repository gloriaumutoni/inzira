import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import apiRouter from "./routes/index";
import { errorHandler } from "./middleware/index";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/v1", apiRouter);

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
