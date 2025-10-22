import mongoose from "mongoose";

const markerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, default: "Unknown" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    respondent: { type: String, default: "N/A" },
    date: { type: String, default: new Date().toISOString().split("T")[0] },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// ✅ This will automatically use the collection name "markers"
const Marker = mongoose.model("Marker", markerSchema);
export default Marker;
