import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [fullname, setFullname] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch user info from backend
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setFullname(res.data.fullname);
        } else {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullname");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-xl">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-500 text-white">
      <header className="flex justify-between items-center px-8 py-4 bg-blue-900 shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide">Tekton Geometrix</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold text-white"
        >
          Logout
        </button>
      </header>

      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-2">
            Welcome, {fullname || "User"} 🎉
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
