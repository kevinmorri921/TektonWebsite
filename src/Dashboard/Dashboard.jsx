// src/Dashboard/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullname, setFullname] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedName = localStorage.getItem("fullname");
        if (storedName) {
          setFullname(storedName);
        } else {
          // Example API call if no local data
          const response = await axios.get("https://your-api-endpoint.com/user");
          setFullname(response.data.fullname || "User");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // Optional: Call your backend logout endpoint
      await axios.post("https://your-api-endpoint.com/logout");

      // ✅ Remove stored user data from localStorage
      localStorage.removeItem("fullname");
      localStorage.removeItem("token"); // (if you store a token, remove it too)

      // ✅ Redirect back to login page
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);

      // Even if error occurs, force redirect to login for safety
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-500 text-white">
      <header className="flex justify-between items-center px-8 py-4 bg-blue-900 shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide">Tekton Geometrix</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-2">
            Welcome, {fullname} 🎉
          </h2>
          <p className="text-lg text-blue-100">
            Here’s a quick overview of your account.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-[90%] max-w-5xl">
          <div
            onClick={() => navigate("/analytics")}
            className="cursor-pointer bg-white text-blue-800 p-8 rounded-2xl shadow-lg hover:scale-105 transform transition-all"
          >
            <h3 className="text-2xl font-bold mb-2">📊 Analytics</h3>
            <p>View your latest reports and statistics.</p>
          </div>

          <div
            onClick={() => navigate("/profile")}
            className="cursor-pointer bg-white text-blue-800 p-8 rounded-2xl shadow-lg hover:scale-105 transform transition-all"
          >
            <h3 className="text-2xl font-bold mb-2">👤 Profile</h3>
            <p>Manage your account settings and personal info.</p>
          </div>

          <div
            onClick={() => navigate("/settings")}
            className="cursor-pointer bg-white text-blue-800 p-8 rounded-2xl shadow-lg hover:scale-105 transform transition-all"
          >
            <h3 className="text-2xl font-bold mb-2">⚙️ Settings</h3>
            <p>Customize your preferences and security.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

