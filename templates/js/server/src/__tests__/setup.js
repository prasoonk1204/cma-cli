import mongoose from "mongoose";
import dotenv from "dotenv";

// Load test environment variables
if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test" });
}

beforeAll(async () => {
  if (process.env.NODE_ENV === "test") {
    const testDbUri =
      process.env.MONGODB_TEST_URI ||
      "mongodb://127.0.0.1:27017/auth_system_test";

    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(testDbUri);
        console.log("✅ Test database connected");
      } catch (error) {
        console.warn(
          "⚠️  Could not connect to test database. Some tests may fail.",
        );
        console.warn("Error:", error.message);
      }
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});
