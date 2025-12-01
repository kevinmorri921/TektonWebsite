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
import AdminPanel from "./AdminPanel/AdminPanel";
import SystemInformation from "./SystemInformation/SystemInformation";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ThemeLoader from "./ThemeLoader/ThemeLoader";


function App() {

  return (
    <Router>
      <ThemeLoader />
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
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedAdminRoute>
            <AdminPanel />
          </ProtectedAdminRoute>
        } />
        <Route path="/system-information" element={<SystemInformation />} />

        {/* 404 fallback */}
        <Route path="*" element={<h1 className="text-center mt-10 text-red-600">404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
