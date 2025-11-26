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

// GET marker count (stats)
router.get("/stats/count", auth, async (req, res) => {
  try {
    const count = await Marker.countDocuments();
    res.json({ totalMarkers: count });
  } catch (error) {
    logger.error("[MARKER] Error fetching marker count: %o", error);
    sendSafeError(res, 500, "Error fetching marker count", process.env.NODE_ENV === "development");
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

// ✅ DELETE survey from marker (MUST be before /:id route)
router.delete(
  "/:markerId/surveys/:surveyIndex",
  auth,
  roleAuth(["encoder", "admin", "super_admin"]),
  async (req, res) => {
    try {
      const { markerId, surveyIndex } = req.params;

      logger.info("[MARKER] Delete survey request: markerId=%s, surveyIndex=%s, user=%s", markerId, surveyIndex, req.user?.id);

      // Validate markerId format
      if (!markerId.match(/^[0-9a-fA-F]{24}$/)) {
        logger.warn("[MARKER] Invalid marker ID format: %s", markerId);
        return res.status(400).json({ message: "Invalid marker ID format" });
      }

      // Find the marker
      const marker = await Marker.findById(markerId);

      if (!marker) {
        logger.warn("[MARKER] Marker not found: markerId=%s", markerId);
        return res.status(404).json({ message: "Marker not found" });
      }

      logger.info("[MARKER] Marker found with %d surveys", marker.surveys.length);

      // Get the survey
      const surveyIdx = parseInt(surveyIndex);
      if (isNaN(surveyIdx) || surveyIdx < 0 || surveyIdx >= marker.surveys.length) {
        logger.warn("[MARKER] Survey index invalid: surveyIdx=%d, available surveys=%d", surveyIdx, marker.surveys.length);
        return res.status(400).json({ message: `Survey not found at index ${surveyIdx}. Available: ${marker.surveys.length}` });
      }

      // Log survey being deleted
      const surveyToDelete = marker.surveys[surveyIdx];
      logger.info("[MARKER] Survey to delete: %o", { index: surveyIdx, name: surveyToDelete.name });

      // Remove the survey at the specified index
      marker.surveys.splice(surveyIdx, 1);

      logger.info("[MARKER] Survey removed from array, saving marker...");

      // Save the marker
      const updatedMarker = await marker.save();
      
      logger.info("[MARKER] Marker saved successfully. Remaining surveys: %d", updatedMarker.surveys.length);

      logger.info(
        "[MARKER] Survey deleted successfully by user=%s for marker=%s survey=%d",
        req.user?.id,
        markerId,
        surveyIdx
      );

      const responseData = {
        success: true,
        message: "Survey deleted successfully",
        data: updatedMarker,
      };

      logger.info("[MARKER] Sending response: %o", responseData);
      res.status(200).json(responseData);
    } catch (error) {
      logger.error("[MARKER] Error deleting survey: message=%s, stack=%o", error.message, error.stack);
      const isDev = process.env.NODE_ENV === "development";
      res.status(500).json({
        message: "Error deleting survey",
        error: isDev ? error.message : "An error occurred",
        ...(isDev && { stack: error.stack }),
      });
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

// ✅ ADD survey value to existing survey
router.put(
  "/:markerId/surveys/:surveyIndex/values",
  auth,
  roleAuth(["encoder", "admin", "super_admin"]),
  body("from").trim().notEmpty().withMessage("From field is required"),
  body("to").trim().notEmpty().withMessage("To field is required"),
  body("sign").trim().notEmpty().withMessage("Sign field is required"),
  body("number").isFloat().withMessage("Number must be numeric"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { markerId, surveyIndex } = req.params;
      const { from, to, sign, number } = req.body;

      logger.info("[MARKER] Add survey value request: markerId=%s, surveyIndex=%s, user=%s", markerId, surveyIndex, req.user?.id);

      // Validate markerId format
      if (!markerId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid marker ID format" });
      }

      // Sanitize inputs
      const sanitizedValue = {
        from: sanitizeInput.escapeHtml(from.toString()),
        to: sanitizeInput.escapeHtml(to.toString()),
        sign: sanitizeInput.escapeHtml(sign),
        number: parseFloat(number),
      };

      // Find the marker
      const marker = await Marker.findById(markerId);

      if (!marker) {
        logger.warn("[MARKER] Marker not found: markerId=%s", markerId);
        return res.status(404).json({ message: "Marker not found" });
      }

      // Get the survey
      const surveyIdx = parseInt(surveyIndex);
      if (isNaN(surveyIdx) || surveyIdx < 0 || surveyIdx >= marker.surveys.length) {
        logger.warn("[MARKER] Survey index invalid: surveyIdx=%d, available surveys=%d", surveyIdx, marker.surveys.length);
        return res.status(404).json({ message: "Survey not found" });
      }

      const survey = marker.surveys[surveyIdx];

      // Initialize surveyValues if it doesn't exist
      if (!Array.isArray(survey.surveyValues)) {
        survey.surveyValues = [];
      }

      // Add the new value
      survey.surveyValues.push(sanitizedValue);

      // Save the marker
      const updatedMarker = await marker.save();

      logger.info(
        "[MARKER] Survey value added successfully by user=%s to marker=%s survey=%d",
        req.user?.id,
        markerId,
        surveyIdx
      );

      res.json({
        success: true,
        message: "Survey value added successfully",
        data: updatedMarker,
      });
    } catch (error) {
      logger.error("[MARKER] Error adding survey value: %o", error);
      const isDev = process.env.NODE_ENV === "development";
      res.status(500).json({
        message: "Error adding survey value",
        error: isDev ? error.message : "An error occurred",
        ...(isDev && { stack: error.stack }),
      });
    }
  }
);

// ✅ UPDATE survey value (edit existing survey value)
router.put(
  "/:markerId/surveys/:surveyIndex/values/:valueIndex",
  auth,
  roleAuth(["encoder", "admin", "super_admin"]),
  body("from").trim().notEmpty().withMessage("From field is required"),
  body("to").trim().notEmpty().withMessage("To field is required"),
  body("sign").trim().notEmpty().withMessage("Sign field is required"),
  body("number").isFloat().withMessage("Number must be numeric"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { markerId, surveyIndex, valueIndex } = req.params;
      const { from, to, sign, number } = req.body;

      logger.info("[MARKER] Update survey value request: markerId=%s, surveyIndex=%s, valueIndex=%s, user=%s", 
        markerId, surveyIndex, valueIndex, req.user?.id);

      // Validate markerId format
      if (!markerId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid marker ID format" });
      }

      // Sanitize inputs
      const sanitizedValue = {
        from: sanitizeInput.escapeHtml(from.toString()),
        to: sanitizeInput.escapeHtml(to.toString()),
        sign: sanitizeInput.escapeHtml(sign),
        number: parseFloat(number),
      };

      // Find the marker
      const marker = await Marker.findById(markerId);

      if (!marker) {
        logger.warn("[MARKER] Marker not found: markerId=%s", markerId);
        return res.status(404).json({ message: "Marker not found" });
      }

      // Get the survey
      const surveyIdx = parseInt(surveyIndex);
      if (isNaN(surveyIdx) || surveyIdx < 0 || surveyIdx >= marker.surveys.length) {
        logger.warn("[MARKER] Survey index invalid: surveyIdx=%d, available surveys=%d", surveyIdx, marker.surveys.length);
        return res.status(404).json({ message: "Survey not found" });
      }

      const survey = marker.surveys[surveyIdx];

      // Check if surveyValues array exists and has the value
      if (!Array.isArray(survey.surveyValues)) {
        survey.surveyValues = [];
      }

      const valIdx = parseInt(valueIndex);
      if (isNaN(valIdx) || valIdx < 0 || valIdx >= survey.surveyValues.length) {
        logger.warn("[MARKER] Value index invalid: valIdx=%d, available values=%d", valIdx, survey.surveyValues.length);
        return res.status(404).json({ message: "Survey value not found" });
      }

      // Update the value
      survey.surveyValues[valIdx] = sanitizedValue;

      logger.info("[MARKER] Updated survey value at index=%d", valIdx);

      // Save the marker
      const updatedMarker = await marker.save();

      logger.info(
        "[MARKER] Survey value updated successfully by user=%s for marker=%s survey=%d value=%d",
        req.user?.id,
        markerId,
        surveyIdx,
        valIdx
      );

      res.json({
        success: true,
        message: "Survey value updated successfully",
        data: updatedMarker,
      });
    } catch (error) {
      logger.error("[MARKER] Error updating survey value: %o", error);
      const isDev = process.env.NODE_ENV === "development";
      res.status(500).json({
        message: "Error updating survey value",
        error: isDev ? error.message : "An error occurred",
        ...(isDev && { stack: error.stack }),
      });
    }
  }
);

// ✅ UPDATE survey details (name, radioOne, radioTwo, lineLength, lineIncrement)
router.put(
  "/:markerId/surveys/:surveyIndex",
  auth,
  roleAuth(["encoder", "admin", "super_admin"]),
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 255 }).withMessage("Name too long"),
  body("radioOne").optional().trim().isLength({ max: 255 }).withMessage("Radio 1 too long"),
  body("radioTwo").optional().trim().isLength({ max: 255 }).withMessage("Radio 2 too long"),
  body("lineLength").optional().trim().isLength({ max: 255 }).withMessage("Line Length too long"),
  body("lineIncrement").optional().trim().isLength({ max: 255 }).withMessage("Line Increment too long"),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { markerId, surveyIndex } = req.params;
      const { name, radioOne, radioTwo, lineLength, lineIncrement } = req.body;

      logger.info("[MARKER] Update survey request: markerId=%s, surveyIndex=%s, user=%s, payload=%o", 
        markerId, surveyIndex, req.user?.id, { name, radioOne, radioTwo, lineLength, lineIncrement });

      // Validate markerId format
      if (!markerId.match(/^[0-9a-fA-F]{24}$/)) {
        logger.error("[MARKER] Invalid marker ID format: %s", markerId);
        return res.status(400).json({ message: "Invalid marker ID format" });
      }

      // Find the marker
      const marker = await Marker.findById(markerId);

      if (!marker) {
        logger.warn("[MARKER] Marker not found: markerId=%s", markerId);
        return res.status(404).json({ message: "Marker not found" });
      }

      // Get the survey
      const surveyIdx = parseInt(surveyIndex);
      if (isNaN(surveyIdx) || surveyIdx < 0 || surveyIdx >= marker.surveys.length) {
        logger.warn("[MARKER] Survey index invalid: surveyIdx=%d, available surveys=%d", surveyIdx, marker.surveys.length);
        return res.status(404).json({ message: "Survey not found at index " + surveyIdx });
      }

      const survey = marker.surveys[surveyIdx];

      logger.info("[MARKER] Found survey to update: %s", survey.name);

      // Update survey details with sanitization
      if (name !== undefined && name !== null && name.trim() !== "") {
        survey.name = sanitizeInput.escapeHtml(name);
        logger.info("[MARKER] Updated survey name to: %s", survey.name);
      }
      if (radioOne !== undefined && radioOne !== null && radioOne.trim() !== "") {
        survey.radioOne = sanitizeInput.escapeHtml(radioOne);
      }
      if (radioTwo !== undefined && radioTwo !== null && radioTwo.trim() !== "") {
        survey.radioTwo = sanitizeInput.escapeHtml(radioTwo);
      }
      if (lineLength !== undefined && lineLength !== null && lineLength.trim() !== "") {
        survey.lineLength = sanitizeInput.escapeHtml(lineLength);
      }
      if (lineIncrement !== undefined && lineIncrement !== null && lineIncrement.trim() !== "") {
        survey.lineIncrement = sanitizeInput.escapeHtml(lineIncrement);
      }

      // Save the marker
      logger.info("[MARKER] Saving marker with updated survey...");
      const updatedMarker = await marker.save();
      logger.info("[MARKER] Marker saved successfully");

      logger.info(
        "[MARKER] Survey details updated successfully by user=%s for marker=%s survey=%d",
        req.user?.id,
        markerId,
        surveyIdx
      );

      res.json({
        success: true,
        message: "Survey details updated successfully",
        data: updatedMarker,
      });
    } catch (error) {
      logger.error("[MARKER] Error updating survey details: message=%s, stack=%o", error.message, error.stack);
      const isDev = process.env.NODE_ENV === "development";
      res.status(500).json({
        message: "Error updating survey details",
        error: isDev ? error.message : "An error occurred",
        ...(isDev && { stack: error.stack }),
      });
    }
  }
);


export default router;
