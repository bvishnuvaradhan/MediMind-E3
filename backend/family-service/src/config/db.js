import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  const baseUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.FAMILY_DB_NAME || 'medimind_family';
  try {
    const conn = await mongoose.connect(baseUri, { dbName });
    return conn;
  } catch (error) {
    if (baseUri.includes('mongodb+srv') && (error.code === 8000 || error.message.includes('auth') || error.message.includes('querySrv') || error.message.includes('ETIMEDOUT'))) {
      console.warn(`[family-service] Remote Atlas connection failed. Falling back to local MongoDB at mongodb://127.0.0.1:27017/${dbName}`);
      const fallbackConn = await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`);
      return fallbackConn;
    }
    console.error(`[family-service] MongoDB Connection Error: ${error.message}`);
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
