import express from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { config } from "../config/services.js";

const router = express.Router();

export const createAuthProxy = () => {
  return createProxyMiddleware({
    target: config.services.auth,
    router: () => config.services.auth,
    changeOrigin: true,
    pathRewrite: (path) => `/api/auth${path.startsWith("/") ? path : `/${path}`}`,
    on: {
      proxyReq: (proxyReq, req) => {
        if (!proxyReq.headersSent) {
          if (config.internalServiceKey) {
            proxyReq.setHeader("x-internal-service-key", config.internalServiceKey);
          }
          fixRequestBody(proxyReq, req);
        }
      },
      error: (err, req, res) => {
        console.error(`[api-gateway] Auth service proxy error: ${err.message}`);
        if (res && !res.headersSent && typeof res.status === "function") {
          res.status(503).json({
            success: false,
            message: "Auth service is temporarily unavailable",
          });
        }
      },
    },
  });
};

router.use("/", createAuthProxy());

export default router;
