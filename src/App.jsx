import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your pages
import TektonWelcome from "./pages/TektonWelcome";
import Login from "./Login/Login";
import Signup from "./Signup/Signup";
import Dashboard from "./Dashboard/Dashboard";
import Analytics from "./Analytics/Analytics";
import Profile from "./Profile/profile";
import Delete from "./Delete/delete";
import Settings from "./Settings/settings";


function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<TektonWelcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected / App routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/delete" element={<Delete />} />
        <Route path="/settings" element={<Settings />} />

        {/* 404 fallback */}
        <Route path="*" element={<h1 className="text-center mt-10 text-red-600">404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
