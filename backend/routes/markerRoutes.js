import express from "express";
import Marker from "../models/marker.js";
import auth from "../middleware/auth.js";
import roleAuth from "../middleware/roleAuth.js";
import logger from "../logger.js";
import { validationSchemas, handleValidationErrors, sanitizeInput, sendSafeError } from "../middleware/validation.js";
import { body } from "express-validator";

const router = express.Router();

/* ------------------------------------------
   PUBLIC / SHARED ROUTES (VIEW ONLY)
--------------------------------------------- */

// GET all markers (everyone logged in can view)
router.get("/", auth, async (req, res) => {
  try {
    const markers = await Marker.find();
    res.json(markers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching markers", error });
  }
});

// GET single marker by ID
router.get("/:id", auth, validationSchemas.mongoId, handleValidationErrors, async (req, res) => {
  try {
    const marker = await Marker.findById(req.params.id);

    if (!marker) {
      return res.status(404).json({ message: "Marker not found" });
    }

    const latestSurvey =
      marker.surveys && marker.surveys.length > 0
        ? marker.surveys[marker.surveys.length - 1]
        : {};

    const formattedMarker = {
      _id: marker._id,
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: sanitizeInput.escapeHtml(latestSurvey.name || "Unnamed Survey"),
      createdAt: latestSurvey.createdAt || marker.createdAt,
      radioOne: sanitizeInput.escapeHtml(latestSurvey.radioOne || "N/A"),
      radioTwo: sanitizeInput.escapeHtml(latestSurvey.radioTwo || "N/A"),
      lineLength: latestSurvey.lineLength || "N/A",
      lineIncrement: latestSurvey.lineIncrement || "N/A",
      surveyValues: latestSurvey.surveyValues || [],
    };

    res.json(formattedMarker);
  } catch (error) {
    logger.error("[MARKER] Error fetching marker details: %o", error);
    sendSafeError(res, 500, "Error fetching marker details", process.env.NODE_ENV === "development");
  }
});


/* ------------------------------------------
   PROTECTED: ENCODER + ADMIN ONLY
--------------------------------------------- */

// POST new marker survey
router.post(
  "/",
  auth,
  roleAuth(["encoder", "admin"]),
  // Input validation for marker coordinates and survey fields
  validationSchemas.latitude,
  validationSchemas.longitude,
  body("name").optional().trim().isLength({ max: 255 }).withMessage("Marker name too long"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { latitude, longitude, ...survey } = req.body;

      // Sanitize survey data
      const sanitizedSurvey = sanitizeInput.sanitizeObject(survey);

      const marker = await Marker.findOne({
        latitude: { $gte: latitude - 0.000001, $lte: latitude + 0.000001 },
        longitude: { $gte: longitude - 0.000001, $lte: longitude + 0.000001 },
      });

      if (marker) {
        const isDuplicate = marker.surveys.some(
          (s) => s.name === sanitizedSurvey.name && s.createdAt === sanitizedSurvey.createdAt
        );

        if (!isDuplicate) {
          marker.surveys.push(sanitizedSurvey);
          await marker.save();
        }

        return res.status(200).json(marker);
      } else {
        const newMarker = new Marker({
          latitude,
          longitude,
          surveys: [sanitizedSurvey],
        });
        const savedMarker = await newMarker.save();
        logger.info("[MARKER] New marker created by user=%s", req.user?.id);
        return res.status(201).json(savedMarker);
      }
    } catch (error) {
      logger.error("[MARKER] Error saving marker: %o", error);
      sendSafeError(res, 400, "Error saving marker", process.env.NODE_ENV === "development");
    }
  }
);

// UPDATE marker
router.put(
  "/:id",
  auth,
  roleAuth(["encoder", "admin"]),
  validationSchemas.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Sanitize input before update
      const sanitizedData = sanitizeInput.sanitizeObject(req.body);

      const updatedMarker = await Marker.findByIdAndUpdate(
        req.params.id,
        sanitizedData,
        { new: true, runValidators: true }
      );

      if (!updatedMarker) {
        return res.status(404).json({ message: "Marker not found" });
      }

      logger.info("[MARKER] Marker updated by user=%s", req.user?.id);
      res.json(updatedMarker);
    } catch (error) {
      logger.error("[MARKER] Error updating marker: %o", error);
      sendSafeError(res, 400, "Error updating marker", process.env.NODE_ENV === "development");
    }
  }
);

// DELETE marker
router.delete(
  "/:id",
  auth,
  roleAuth(["encoder", "admin"]),
  validationSchemas.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const deletedMarker = await Marker.findByIdAndDelete(req.params.id);

      if (!deletedMarker) {
        return res.status(404).json({ message: "Marker not found" });
      }

      logger.info("[MARKER] Marker deleted by user=%s", req.user?.id);
      res.json({ message: "Marker deleted successfully" });
    } catch (error) {
      logger.error("[MARKER] Error deleting marker: %o", error);
      sendSafeError(res, 500, "Error deleting marker", process.env.NODE_ENV === "development");
    }
  }
);

export default router;
