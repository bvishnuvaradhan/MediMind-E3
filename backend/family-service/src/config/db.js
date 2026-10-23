import mongoose from 'mongoose';
import { validateMongoConfig, maskMongoUri } from '../../../mongoConfigValidator.js';

export const connectDB = async (uri) => {
  const baseUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.FAMILY_DB_NAME || 'medimind_family';
  const timeoutMs = parseInt(process.env.MONGO_TIMEOUT_MS || '2500', 10);

  const config = validateMongoConfig(baseUri, process.env);

  try {
    const conn = await mongoose.connect(baseUri, { dbName, serverSelectionTimeoutMS: timeoutMs });
    return conn;
  } catch (error) {
    if ((baseUri.includes('mongodb+srv') || baseUri.includes('@')) && config.allowLocalFallback && !config.strictRemote) {
      console.warn(`[family-service] Remote Atlas connection failed (${error.name}). Falling back to local MongoDB at mongodb://127.0.0.1:27017/${dbName}`);
      const fallbackConn = await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`, { serverSelectionTimeoutMS: 5000 });
      return fallbackConn;
    }
    console.error(`[family-service] MongoDB Connection Error: ${error.message} (Target: ${maskMongoUri(baseUri)})`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error(`[family-service] MongoDB Disconnect Error: ${error.message}`);
  }
};
