import express from "express";
import Event from "../models/event.js";

const router = express.Router();

// ✅ GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ POST new event
router.post("/", async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const event = new Event({ title, date, description });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
