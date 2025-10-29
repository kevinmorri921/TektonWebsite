import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import loginRoute from "./routes/login.js";
import markerRoutes from "./routes/markerRoutes.js";
import changePasswordRoute from "./routes/change-password.js"; // ✅ Add this import
import updateProfileRoute from "./routes/update-profile.js";
import deleteAccountRoute from "./routes/delete-account.js";
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
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(bodyParser.json());

// 🛣 API Routes
app.use("/api", authRoutes);
app.use("/api/login", loginRoute);
app.use("/api/markers", markerRoutes);
app.use("/api/auth/change-password", changePasswordRoute); // ✅ Add this line
app.use("/api/auth/update-profile", updateProfileRoute);
app.use("/api/auth/delete-account", deleteAccountRoute);
// 🧾 Root route (for testing)
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully with MongoDB & Marker API!");
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});