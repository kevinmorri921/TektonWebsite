import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  action: {
    type: String,
    enum: ["Login", "Uploaded Marker", "Downloaded File", "Created Survey", "Updated Survey", "Deleted Marker"],
    required: true,
    index: true
  },
  details: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  }
}, { 
  timestamps: true 
});

// Create index for faster queries
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ email: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
