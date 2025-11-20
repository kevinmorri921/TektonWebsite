import express from "express";
import Marker from "../models/marker.js";
import auth from "../middleware/auth.js";          // normal login auth
import roleAuth from "../middleware/roleAuth.js"; // NEW middleware

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
router.get("/:id", auth, async (req, res) => {
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
    res.status(500).json({ message: "Error fetching marker details", error });
  }
});


/* ------------------------------------------
   PROTECTED: ENCODER + ADMIN ONLY
--------------------------------------------- */

// POST new marker survey
router.post(
  "/",
  auth,
  roleAuth(["encoder", "admin"]), // researcher cannot upload
  async (req, res) => {
    try {
      const { latitude, longitude, ...survey } = req.body;

      const marker = await Marker.findOne({
        latitude: { $gte: latitude - 0.000001, $lte: latitude + 0.000001 },
        longitude: { $gte: longitude - 0.000001, $lte: longitude + 0.000001 },
      });

      if (marker) {
        const isDuplicate = marker.surveys.some(
          (s) => s.name === survey.name && s.createdAt === survey.createdAt
        );

        if (!isDuplicate) {
          marker.surveys.push(survey);
          await marker.save();
        }

        return res.status(200).json(marker);
      } else {
        const newMarker = new Marker({
          latitude,
          longitude,
          surveys: [survey],
        });
        const savedMarker = await newMarker.save();
        return res.status(201).json(savedMarker);
      }
    } catch (error) {
      res.status(400).json({ message: "Error saving marker", error });
    }
  }
);

// UPDATE marker
router.put(
  "/:id",
  auth,
  roleAuth(["encoder", "admin"]),
  async (req, res) => {
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
  }
);

// DELETE marker
router.delete(
  "/:id",
  auth,
  roleAuth(["encoder", "admin"]),
  async (req, res) => {
    try {
      await Marker.findByIdAndDelete(req.params.id);
      res.json({ message: "Marker deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting marker", error });
    }
  }
);

export default router;
