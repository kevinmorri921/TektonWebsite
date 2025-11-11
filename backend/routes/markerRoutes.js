import express from "express";
import Marker from "../models/marker.js";

const router = express.Router();

// ✅ GET all markers
router.get("/", async (req, res) => {
  try {
    const markers = await Marker.find();
    res.json(markers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching markers", error });
  }
});

// ✅ GET single marker by ID (returns latest survey in flattened format)
router.get("/:id", async (req, res) => {
  try {
    const marker = await Marker.findById(req.params.id);

    if (!marker) {
      return res.status(404).json({ message: "Marker not found" });
    }

    // ✅ Safely get the latest survey
    const latestSurvey =
      marker.surveys && marker.surveys.length > 0
        ? marker.surveys[marker.surveys.length - 1]
        : {};

    // ✅ Flatten structure for frontend compatibility
    const formattedMarker = {
      _id: marker._id,
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: latestSurvey.name || "Unnamed Survey",
      createdAt: latestSurvey.createdAt || marker.createdAt,
      radioOne: latestSurvey.radioOne || "N/A",
      radioTwo: latestSurvey.radioTwo || "N/A",
      lineLength: latestSurvey.lineLength || "N/A",
      lineIncrement: latestSurvey.lineIncrement || "N/A",
      surveyValues: latestSurvey.surveyValues || [],
    };

    res.json(formattedMarker);
  } catch (error) {
    console.error("Error fetching marker details:", error);
    res.status(500).json({ message: "Error fetching marker details", error });
  }
});


// ✅ POST add new marker or append survey if same location exists
router.post("/", async (req, res) => {
  try {
    const { latitude, longitude, ...survey } = req.body;

    // Find marker within a small tolerance range to avoid float precision issues
    const marker = await Marker.findOne({
      latitude: { $gte: latitude - 0.000001, $lte: latitude + 0.000001 },
      longitude: { $gte: longitude - 0.000001, $lte: longitude + 0.000001 },
    });

    if (marker) {
      // ✅ Append new survey if it's not a duplicate (same name + createdAt)
      const isDuplicate = marker.surveys.some(
        (s) => s.name === survey.name && s.createdAt === survey.createdAt
      );

      if (!isDuplicate) {
        marker.surveys.push(survey);
        await marker.save();
      }

      res.status(200).json(marker);
    } else {
      // ✅ Create new marker if no existing coordinates found
      const newMarker = new Marker({
        latitude,
        longitude,
        surveys: [survey],
      });
      const savedMarker = await newMarker.save();
      res.status(201).json(savedMarker);
    }
  } catch (error) {
    console.error("Error saving marker:", error);
    res.status(400).json({ message: "Error saving marker", error });
  }
});


// ✅ PUT update marker by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedMarker = await Marker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedMarker);
  } catch (error) {
    res.status(400).json({ message: "Error updating marker", error });
  }
});

// ✅ DELETE marker by ID
router.delete("/:id", async (req, res) => {
  try {
    await Marker.findByIdAndDelete(req.params.id);
    res.json({ message: "Marker deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting marker", error });
  }
});

export default router;
