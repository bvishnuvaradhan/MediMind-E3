import mongoose from "mongoose";

export const connectDB = async (uri = process.env.MONGO_URI) => {
  if (!uri) {
    throw new Error("MONGO_URI environment variable is required to connect to database");
  }

  // Sanitize URI for safe logging (mask password if present)
  const sanitizedUri = uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[auth-service] Connected to database: ${conn.connection.name} (${sanitizedUri})`);
    return conn;
  } catch (error) {
    console.error(`[auth-service] Database connection error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("[auth-service] Disconnected from database");
  } catch (error) {
    console.error(`[auth-service] Database disconnect error: ${error.message}`);
  }
};
