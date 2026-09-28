import '../load-env.js';
import app from './src/app.js';

const PORT = process.env.PORT || process.env.GATEWAY_PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[api-gateway] Running on port ${PORT}`);
});

const shutdown = () => {
  console.log('[api-gateway] Shutting down gracefully...');
  server.close(() => {
    console.log('[api-gateway] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
