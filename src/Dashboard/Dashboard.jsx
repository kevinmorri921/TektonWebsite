import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bgImage from "../assets/db-pic.jpg";
import { Home, BarChart3, Settings, User, LogOut } from "lucide-react"; // ✅ Import icons

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
      await axios.post("https://your-api-endpoint.com/logout");
      localStorage.removeItem("fullname");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1E1E2A]">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden transition-all duration-1000"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Main Dashboard Container */}
      <div className="flex w-[90%] max-w-[1200px] h-[85vh] bg-[#f8f9fa]/90 backdrop-blur-md rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-700">
        {/* Sidebar */}
        <aside className="w-[250px] bg-[#f8f9fa]/90 flex flex-col justify-between py-6 px-6 border-r border-gray-300">
          <div>
            <h1 className="text-lg font-semibold mb-6 text-gray-800">
              Hi, <span className="italic font-serif">{fullname}</span>
            </h1>

            <nav className="space-y-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-3 bg-[#B9BEE1] hover:bg-[#A9AED1] transition-colors px-4 py-2 w-full rounded-xl text-left font-medium"
              >
                <Home size={18} /> Dashboard
              </button>

              <button
                onClick={() => navigate("/analytics")}
                className="flex items-center gap-3 bg-[#E3E4F1] hover:bg-[#D7D8EA] transition-colors px-4 py-2 w-full rounded-xl text-left font-medium"
              >
                <BarChart3 size={18} /> Analytics
              </button>

              <button
                onClick={() => navigate("/settings")}
                className="flex items-center gap-3 bg-[#E3E4F1] hover:bg-[#D7D8EA] transition-colors px-4 py-2 w-full rounded-xl text-left font-medium"
              >
                <Settings size={18} /> Settings
              </button>
            </nav>
          </div>

          <div className="border-t border-gray-300 pt-4 space-y-3">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-3 bg-[#E3E4F1] hover:bg-[#D7D8EA] transition-colors px-4 py-2 w-full rounded-xl text-left font-medium"
            >
              <User size={18} /> Profile
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 bg-[#E3E4F1] hover:bg-[#D7D8EA] transition-colors px-4 py-2 w-full rounded-xl text-left font-medium"
            >
              <LogOut size={18} /> Log Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-[#ffffff]/90 p-10 rounded-r-[2rem] flex flex-col">
          <h2 className="text-2xl font-extrabold mb-2 text-[#14142B]">
            WELCOME TO TEKTON GEOMETRIX INC
          </h2>
          <p className="text-sm mb-6 text-gray-700">
            Welcome Back! Here’s a quick look at your account activity.
          </p>

          <div className="bg-[#B9BEE1] rounded-2xl flex-1 mb-8"></div>

          <div className="flex justify-end">
            <input
              type="text"
              placeholder="Search"
              className="w-60 px-4 py-2 rounded-lg bg-[#C5CAE9] text-[#1F1F30] placeholder-gray-700 focus:outline-none"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;




//ICONS-GOODS