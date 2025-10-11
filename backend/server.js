import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import loginRoute from "./routes/login.js"; // 🆕 Import login route

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🧩 Connect to MongoDB
connectDB();

// 🧰 Middleware
app.use(cors({
  origin: "http://localhost:5173", // Change this to your frontend URL/port if needed
  credentials: true,
}));
app.use(bodyParser.json());
;

app.use("/api/login", loginRoute);

// 🛣 Routes
app.use("/api", authRoutes);          // existing auth routes (e.g., register)
app.use("/api/login", loginRoute);    // 🆕 new login route

// 🧾 Basic route for testing
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
