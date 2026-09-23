import mongoose from "mongoose";

export const connectDB = async (explicitUri = null) => {
  const uri = explicitUri || process.env.MONGODB_URI || process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DB_NAME || "medimind_auth";

  if (!uri) {
    throw new Error(
      "MONGODB_URI (or MONGO_URI) environment variable is required to connect to database"
    );
  }

  try {
    const conn = await mongoose.connect(uri, { dbName });
    console.log(`[auth-service] MongoDB connected: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[auth-service] MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("[auth-service] MongoDB disconnected");
  } catch (error) {
    console.error(`[auth-service] Database disconnect error: ${error.message}`);
  }
};
