import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { errorMiddleware, notFoundHandler } from "./middleware/errorMiddleware.js";

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "auth-service",
    timestamp: new Date().toISOString(),
  });
});

// Auth API routes
app.use("/api/auth", authRoutes);

// 404 & Error handlers
app.use(notFoundHandler);
app.use(errorMiddleware);

export default app;
