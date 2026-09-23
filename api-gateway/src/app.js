import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { errorMiddleware, notFoundHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "api-gateway",
    timestamp: new Date().toISOString(),
  });
});

// Mounted service proxies
app.use("/api/auth", authRoutes);

// 404 & error handlers
app.use(notFoundHandler);
app.use(errorMiddleware);

export default app;
