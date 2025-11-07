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

// ✅ GET single marker by ID
router.get("/:id", async (req, res) => {
  try {
    const marker = await Marker.findById(req.params.id);
    if (!marker) {
      return res.status(404).json({ message: "Marker not found" });
    }
    res.json(marker);
  } catch (error) {
    res.status(500).json({ message: "Error fetching marker details", error });
  }
});

// ✅ POST add new marker
router.post("/", async (req, res) => {
  try {
    const { latitude, longitude, ...survey } = req.body;

    let marker = await Marker.findOne({ latitude, longitude });

    if (marker) {
      // ✅ Same location: push new survey to existing marker
      marker.surveys.push(survey);
      await marker.save();
      res.status(200).json(marker);
    } else {
      // ✅ New location: create new marker
      const newMarker = new Marker({
        latitude,
        longitude,
        surveys: [survey],
      });
      const savedMarker = await newMarker.save();
      res.status(201).json(savedMarker);
    }
  } catch (error) {
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
