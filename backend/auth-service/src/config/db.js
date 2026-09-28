import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medimind_auth';
  try {
    const conn = await mongoose.connect(mongoUri);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error(`MongoDB Disconnect Error: ${error.message}`);
  }
};
