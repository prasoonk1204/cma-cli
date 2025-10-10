import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in .env file");
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", (err as Error).message);
    throw err;
  }
};

export default connectDB;
