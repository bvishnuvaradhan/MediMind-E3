import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.NODE_ENV !== 'test') {
  const localEnv = path.resolve(__dirname, '../../.env');
  const workspaceEnv = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else if (fs.existsSync(workspaceEnv)) {
    dotenv.config({ path: workspaceEnv });
  }
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Configuration error: required environment variable ${name} is not set.`);
  }
  return String(value).trim();
}

export function getJwtSecret() {
  return requireEnv('JWT_SECRET');
}

export function getInternalServiceSecret() {
  return requireEnv('INTERNAL_SERVICE_SECRET');
}

export function getInternalServiceKey() {
  const explicitKey = process.env.INTERNAL_SERVICE_KEY;
  if (explicitKey && String(explicitKey).trim()) {
    return String(explicitKey).trim();
  }
  return getInternalServiceSecret();
}

export function resolveServiceUrl(envVar, internalSlug, defaultPort, { requiredInProd = false } = {}) {
  const configured = process.env[envVar];
  if (configured && String(configured).trim()) {
    return String(configured).trim().replace(/\/+$/, '');
  }

  if (process.env.VERCEL) {
    if (requiredInProd) {
      throw new Error(`Configuration error: ${envVar} must be configured for production deployment.`);
    }
    const host =
      process.env.VERCEL_ENV === 'production'
        ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
        : process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (host) {
      return `https://${String(host).replace(/^https?:\/\//, '').replace(/\/+$/, '')}/_internal/${internalSlug}`;
    }
    throw new Error(`Configuration error: ${envVar} could not be resolved on Vercel.`);
  }

  if (process.env.NODE_ENV === 'production' && requiredInProd) {
    throw new Error(`Configuration error: ${envVar} is required in production.`);
  }

  return `http://127.0.0.1:${defaultPort}`;
}

export function getCorsOptions() {
  const rawOrigins = process.env.CORS_ORIGIN || '';
  const defaultDevOrigins = isProductionRuntime() ? [] : ['http://localhost:5173', 'http://localhost:3000'];
  const allowedOrigins = (rawOrigins ? rawOrigins.split(',') : defaultDevOrigins)
    .map((o) => o.trim())
    .filter(Boolean)
    .filter((o) => !(isProductionRuntime() && o === '*'));

  return {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || (!isProductionRuntime() && allowedOrigins.includes('*'))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy rejection: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-correlation-id'],
    exposedHeaders: ['x-request-id'],
  };
}
