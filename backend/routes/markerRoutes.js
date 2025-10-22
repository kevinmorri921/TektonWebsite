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

// ✅ POST add new marker
router.post("/", async (req, res) => {
  try {
    const newMarker = new Marker(req.body);
    const savedMarker = await newMarker.save();
    res.status(201).json(savedMarker);
  } catch (error) {
    res.status(400).json({ message: "Error saving marker", error });
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
