import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Use logger if available to avoid console spam
    try {
      const { default: logger } = await import("../logger.js");
      logger.info("🔄 Connecting to MongoDB...");
    } catch (_) {
      console.log("🔄 Connecting to MongoDB...");
    }

    await mongoose.connect(process.env.MONGO_URI);

    try {
      const { default: logger } = await import("../logger.js");
      logger.info("✅ Connected to MongoDB Atlas");
    } catch (_) {
      console.log("✅ Connected to MongoDB Atlas");
    }
  } catch (error) {
    try {
      const { default: logger } = await import("../logger.js");
      logger.error("❌ MongoDB connection error: %s", error.message);
    } catch (_) {
      console.error("❌ MongoDB connection error:", error.message);
    }
    process.exit(1);
  }
};

export default connectDB;
