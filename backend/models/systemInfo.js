import mongoose from "mongoose";

const systemInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ipAddress: {
      type: String,
      default: "N/A",
    },
    os: {
      type: String,
      default: "N/A",
    },
    browser: {
      name: {
        type: String,
        default: "N/A",
      },
      version: {
        type: String,
        default: "N/A",
      },
    },
    screenResolution: {
      type: String,
      default: "N/A",
    },
    deviceType: {
      type: String,
      default: "N/A",
    },
    cpuArchitecture: {
      type: String,
      default: "N/A",
    },
    language: {
      type: String,
      default: "N/A",
    },
    timezone: {
      type: String,
      default: "N/A",
    },
    networkType: {
      type: String,
      default: "N/A",
    },
    ram: {
      type: String,
      default: "N/A",
    },
    gpu: {
      type: String,
      default: "N/A",
    },
    userAgent: {
      type: String,
      default: "N/A",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
systemInfoSchema.index({ userId: 1, timestamp: -1 });
systemInfoSchema.index({ os: 1 });
systemInfoSchema.index({ deviceType: 1 });

export default mongoose.model("SystemInfo", systemInfoSchema);
