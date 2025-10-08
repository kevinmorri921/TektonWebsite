import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your pages
import TektonWelcome from "./pages/TektonWelcome";
import Login from "./Login/Login"; 
import Signup from "./Signup/Signup"; 
import Dashboard from "./Dashboard/Dashboard"; 
import Profile from "./Profile/profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TektonWelcome />} />
        <Route path="/login" element={<Login />} />
        {/* Add more routes here as needed */}
        <Route path="/signup" element={<Signup />} /> 
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
