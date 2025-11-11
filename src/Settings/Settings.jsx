import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/db-pic.jpg";
import { Home, BarChart3, Settings, User, LogOut } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";

function SettingsPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullname, setFullname] = useState("User");

  const [settings, setSettings] = useState({
    theme: "light",
    language: "en",
    notifications: true,
  });

  // Fetch User Fullname
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedName = localStorage.getItem("fullname");
        if (storedName) setFullname(storedName);
        else {
          const response = await axios.get("https://your-api-endpoint.com/user");
          setFullname(response.data.fullname || "User");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/settings", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        setSettings({
          theme: data.theme || "light",
          language: data.language || "en",
          notifications: data.notifications === 1,
        });
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Apply theme
  useEffect(() => {
    document.body.classList.toggle("dark-mode", settings.theme === "dark");
  }, [settings.theme]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    try {
      const res = await fetch("http://localhost:5000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (res.ok) setSuccess(true);
      else alert("Save failed");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fullname");
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1E1E2A]">
        <p className="text-white text-lg">Loading settings...</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex w-[90%] max-w-[1200px] h-[85vh] bg-[#F8F9FA] rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* SIDEBAR */}
        <motion.aside
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-[250px] bg-[#F8F9FA] flex flex-col py-6 px-6 rounded-l-[2rem]"
        >
          <p className="text-xl font-semibold italic text-center text-gray-800 mb-8 mt-6">
            Hi, <span className="font-bold">{fullname}</span>!
          </p>
          <nav className="space-y-5">
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/dashboard")} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium"><Home size={18} /> Dashboard</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/analytics")} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium"><BarChart3 size={18} /> Analytics</motion.button>
            {/*<motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/settings")} className="flex items-center gap-3 bg-[#303345] px-4 py-2 w-full rounded-xl text-white font-medium"><Settings size={18} /> Settings</motion.button>*/}
          </nav>
          <div className="space-y-4 mt-auto mb-6">
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/profile")} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium"><User size={18} /> Profile</motion.button>
            <div className="border-t border-gray-300" />
            <motion.button whileHover={{ scale: 1.05 }} onClick={handleLogout} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium"><LogOut size={18} /> Log Out</motion.button>
          </div>
        </motion.aside>

        <div className="w-[1px] bg-gray-300 my-8"></div>

        {/* MAIN CONTENT */}
        <motion.main
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 p-10 bg-[#F8F9FA] overflow-y-auto rounded-r-[2rem]"
        >
          <h2 className="text-2xl font-extrabold text-[#14142B] mb-2">SETTINGS</h2>
          <p className="text-sm text-gray-700 mb-6">Customize your Tekton Geometrix preferences.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <h3 className="font-semibold text-lg mb-4 text-[#303345]">Theme</h3>
              <select name="theme" value={settings.theme} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-300">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <h3 className="font-semibold text-lg mb-4 text-[#303345]">Language</h3>
              <select name="language" value={settings.language} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-300">
                <option value="en">English</option>
                <option value="ph">Filipino</option>
              </select>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input type="checkbox" name="notifications" checked={settings.notifications} onChange={handleChange} /> Enable Notifications
              </label>
            </motion.div>
          </div>

          {success && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 bg-green-100 text-green-700 p-3 rounded-lg w-full max-w-md">
              Settings updated successfully!
            </motion.p>
          )}

          <motion.button whileHover={{ scale: 1.05 }} onClick={handleSubmit} className="mt-6 w-full max-w-md bg-[#303345] text-white py-2 rounded-lg hover:opacity-90">
            Save Changes
          </motion.button>
        </motion.main>
      </motion.div>
    </div>
  );
}

export default SettingsPage;
//GOODS