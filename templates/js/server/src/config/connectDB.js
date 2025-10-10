import mongoose from "mongoose";

// Database connection configuration
const connectDB = async () => {
  try {
    // Connect to MongoDB using connection string from environment
    await mongoose.connect(process.env.MONGODB_URI);

    // Uncomment for connection confirmation in development
    // console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw err; // Re-throw to be handled by server startup
  }
};

export default connectDB;
