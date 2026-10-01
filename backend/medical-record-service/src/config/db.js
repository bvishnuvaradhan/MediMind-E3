import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  const baseUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.RECORD_DB_NAME || 'medimind_records';
  const timeoutMs = parseInt(process.env.MONGO_TIMEOUT_MS || '2500', 10);
  try {
    const conn = await mongoose.connect(baseUri, { dbName, serverSelectionTimeoutMS: timeoutMs });
    return conn;
  } catch (error) {
    if (baseUri.includes('mongodb+srv') || baseUri.includes('@')) {
      console.warn(`[medical-record-service] Remote Atlas connection failed (${error.name}). Falling back to local MongoDB at mongodb://127.0.0.1:27017/${dbName}`);
      const fallbackConn = await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`, { serverSelectionTimeoutMS: 5000 });
      return fallbackConn;
    }
    console.error(`[medical-record-service] MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error(`[medical-record-service] MongoDB Disconnect Error: ${error.message}`);
  }
};
