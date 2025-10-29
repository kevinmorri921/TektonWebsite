import mongoose from "mongoose";

const surveySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, default: "Unknown" },
    respondent: { type: String, default: "N/A" },
    date: { type: String, default: new Date().toISOString().split("T")[0] },
    notes: { type: String, default: "" },
  },
  { _id: false } // no new _id for each survey
);

const markerSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    surveys: [surveySchema], // all surveys for this coordinate
  },
  { timestamps: true }
);

const Marker = mongoose.model("Marker", markerSchema);
export default Marker;
