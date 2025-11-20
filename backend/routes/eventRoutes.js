import express from "express";
import Event from "../models/event.js";
import logger from "../logger.js";
import { validationSchemas, handleValidationErrors, sanitizeInput, sendSafeError } from "../middleware/validation.js";

const router = express.Router();

// ✅ GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    logger.error("[EVENT] Error fetching events: %o", err);
    sendSafeError(res, 500, "Error fetching events", process.env.NODE_ENV === "development");
  }
});

// ✅ POST new event
router.post(
  "/",
  // Input validation
  validationSchemas.eventTitle,
  validationSchemas.eventDescription,
  validationSchemas.eventDate,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { title, date, description } = req.body;

      // Sanitize input
      const sanitizedEvent = {
        title: sanitizeInput.removeXSS(title),
        date: date, // Already validated as ISO 8601
        description: sanitizeInput.removeXSS(description || ""),
      };

      const event = new Event(sanitizedEvent);
      await event.save();

      logger.info("[EVENT] New event created: %s", title);
      res.status(201).json(event);
    } catch (err) {
      logger.error("[EVENT] Error creating event: %o", err);
      sendSafeError(res, 400, "Error creating event", process.env.NODE_ENV === "development");
    }
  }
);

// ✅ PUT (update) existing event
router.put(
  "/:id",
  validationSchemas.mongoId,
  validationSchemas.eventTitle,
  validationSchemas.eventDescription,
  validationSchemas.eventDate,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { title, date, description } = req.body;

      // Sanitize input
      const sanitizedUpdate = {
        title: sanitizeInput.removeXSS(title),
        date: date,
        description: sanitizeInput.removeXSS(description || ""),
      };

      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        sanitizedUpdate,
        { new: true }
      );

      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      logger.info("[EVENT] Event updated: %s", title);
      res.json(updatedEvent);
    } catch (err) {
      logger.error("[EVENT] Error updating event: %o", err);
      sendSafeError(res, 400, "Error updating event", process.env.NODE_ENV === "development");
    }
  }
);

// ✅ DELETE event
router.delete(
  "/:id",
  validationSchemas.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const deletedEvent = await Event.findByIdAndDelete(req.params.id);

      if (!deletedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      logger.info("[EVENT] Event deleted");
      res.json({ message: "Event deleted successfully" });
    } catch (err) {
      logger.error("[EVENT] Error deleting event: %o", err);
      sendSafeError(res, 500, "Error deleting event", process.env.NODE_ENV === "development");
    }
  }
);

export default router;
