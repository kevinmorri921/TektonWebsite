import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import loginRoute from "./routes/login.js";
import markerRoutes from "./routes/markerRoutes.js"; // ✅ New markers route

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const PORT = process.env.PORT || 5000;

// 🧠 Connect to MongoDB
connectDB();

// 🧰 Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Change this if your frontend runs elsewhere
    credentials: true,
  })
);
app.use(bodyParser.json());

// 🛣 API Routes
app.use("/api", authRoutes);        // User registration, etc.
app.use("/api/login", loginRoute);  // User login
app.use("/api/markers", markerRoutes); // ✅ Marker CRUD endpoints

// 🧾 Root route (for testing)
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully with MongoDB & Marker API!");
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
