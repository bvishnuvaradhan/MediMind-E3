import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medimind_family';
  try {
    const conn = await mongoose.connect(mongoUri);
    return conn;
  } catch (error) {
    if (mongoUri.includes('mongodb+srv') && (error.code === 8000 || error.message.includes('auth'))) {
      console.warn('[family-service] Remote Atlas connection failed. Falling back to local MongoDB at mongodb://127.0.0.1:27017/medimind_family');
      const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/medimind_family');
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
