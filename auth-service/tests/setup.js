import { jest, beforeAll, afterEach, afterAll } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod;

export const setupTestDB = () => {
  jest.setTimeout(90000);

  beforeAll(async () => {
    // Set environment variables for tests
    process.env.JWT_SECRET = "test_super_secret_jwt_key_for_testing_purposes_only_32_chars";
    process.env.JWT_EXPIRES_IN = "1h";

    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  }, 90000);

  afterEach(async () => {
    // Clean all collections between tests
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });
};
