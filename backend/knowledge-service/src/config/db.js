import mongoose from 'mongoose';
import { validateMongoConfig, maskMongoUri } from './runtimeConfig.js';

const CACHE_KEY = '__medimindMongooseCache';

function getCache() {
  if (!globalThis[CACHE_KEY]) {
    globalThis[CACHE_KEY] = { conn: null, promise: null, dbName: null };
  }
  return globalThis[CACHE_KEY];
}

export const connectDB = async (uri) => {
  const dbName = process.env.KNOWLEDGE_DB_NAME || 'medimind_knowledge';

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const cache = getCache();
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  const configuredUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI;
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const baseUri = configuredUri || (isProd ? '' : 'mongodb://127.0.0.1:27017');
  const timeoutMs = parseInt(process.env.MONGO_TIMEOUT_MS || '10000', 10);

  const config = validateMongoConfig(baseUri, process.env);

  if (cache.promise) {
    return cache.promise;
  }

  cache.promise = (async () => {
    try {
      const conn = await mongoose.connect(baseUri, {
        dbName,
        serverSelectionTimeoutMS: timeoutMs,
        maxPoolSize: 10,
        minPoolSize: 0,
      });
      cache.conn = conn;
      cache.dbName = dbName;
      return conn;
    } catch (error) {
      if ((baseUri.includes('mongodb+srv') || baseUri.includes('@')) && config.allowLocalFallback && !config.strictRemote) {
        console.warn(`[knowledge-service] Remote Atlas connection failed (${error.name}). Falling back to local MongoDB at mongodb://127.0.0.1:27017/${dbName}`);
        const fallbackConn = await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`, {
          serverSelectionTimeoutMS: 5000,
          maxPoolSize: 10,
          minPoolSize: 0,
        });
        cache.conn = fallbackConn;
        cache.dbName = dbName;
        return fallbackConn;
      }
      console.error(`[knowledge-service] MongoDB Connection Error: ${error.message} (Target: ${maskMongoUri(baseUri)})`);
      throw error;
    } finally {
      cache.promise = null;
    }
  })();

  return cache.promise;
};

export const disconnectDB = async () => {
  try {
    const cache = getCache();
    cache.conn = null;
    cache.promise = null;
    await mongoose.connection.close();
  } catch (error) {
    console.error(`[knowledge-service] MongoDB Disconnect Error: ${error.message}`);
  }
};
