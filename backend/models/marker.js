import mongoose from "mongoose";

const surveyValueSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.Mixed }, // Allow both string and number
    to: { type: mongoose.Schema.Types.Mixed }, // Allow both string and number
    sign: String,
    number: Number,
  },
  { _id: false }
);

const surveyDetailSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    radioOne: String,
    radioTwo: String,
    lineLength: String,
    lineIncrement: String,
    surveyValues: [surveyValueSchema],
  },
  { _id: false }
);

const markerSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    surveys: [surveyDetailSchema], // ✅ multiple surveys in one location
  },
  { timestamps: true }
);

const Marker = mongoose.model("Marker", markerSchema);
export default Marker;
