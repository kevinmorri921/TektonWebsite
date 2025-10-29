import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bgImage from "../assets/db-pic.jpg";
import { Home, BarChart3, Settings, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";

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
      className="h-screen w-screen flex items-center justify-center overflow-hidden" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", }} >
      {/* Main Container */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }}animate={{ opacity: 1, scale: 1 }}transition={{ duration: 0.5 }}className="flex w-[90%] max-w-[1200px] h-[85vh] bg-[#F8F9FA] rounded-[2rem] shadow-2xl overflow-hidden">
        {/* Sidebar + Vertical Divider */}
        <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}transition={{ duration: 0.6, ease: "easeOut" }}className="relative flex">
          {/* Sidebar */}
          <aside className="w-[250px] bg-[#F8F9FA] flex flex-col py-6 px-6 rounded-l-[2rem]">
            <div>
              <p className="text-xl font-semibold italic text-center text-gray-800 mb-8 mt-6">Hi, <span className="font-bold">{fullname}</span>! </p>

              <nav className="space-y-5">
                <motion.button whileHover={{ scale: 1.05 }}  onClick={() => navigate("/dashboard")}  className="flex items-center gap-3 bg-[#303345] px-4 py-2 w-full rounded-xl text-left font-medium text-[#F8F9FA]">
                  <Home size={18} /> Dashboard
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/analytics")}  className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition" >
                  <BarChart3 size={18} className="text-[#303345]" /> Analytics
                </motion.button>
                <motion.button  whileHover={{ scale: 1.05 }}  onClick={() => navigate("/settings")}  className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"   >
                  <Settings size={18} className="text-[#303345]" /> Settings
                </motion.button>
              </nav>
            </div>

            {/* Profile + Logout */}
            <div className="space-y-4 mt-auto mb-6">
              <motion.button whileHover={{ scale: 1.05 }}  onClick={() => navigate("/profile")}   className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"  >
                <User size={18} className="text-[#303345]" /> Profile
              </motion.button>
              <div className="border-t border-gray-300" />
              <motion.button  whileHover={{ scale: 1.05 }}  onClick={handleLogout}  className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition" >
                <LogOut size={18} className="text-[#303345]" /> Log Out
              </motion.button>
            </div>
          </aside>

          {/* Floating Vertical Line */}
          <div className="w-[1px] bg-gray-300 my-8"></div>
        </motion.div>

        {/* Main Content */}
        <motion.main  initial={{ x: 50, opacity: 0 }}  animate={{ x: 0, opacity: 1 }}  transition={{ duration: 0.6, ease: "easeOut" }} className="flex-1 p-10 flex flex-col bg-[#F8F9FA] rounded-r-[2rem]"  >
          <h2 className="text-2xl font-extrabold text-[#14142B] mb-2"> WELCOME TO TEKTON GEOMETRIX INC</h2>
          <p className="text-sm text-gray-700 mb-6">Welcome Back! Here’s a quick look at your account activity.</p>

          {/* CALENDAR + TASKS */}
          <div className="flex gap-6 mb-6">
            <motion.div initial={{ y: 20, opacity: 0 }}  animate={{ y: 0, opacity: 1 }}  transition={{ delay: 0.2 }} className="flex-1 bg-white rounded-2xl shadow-md p-6" >
              <h3 className="text-lg font-semibold mb-4 text-[#303345]">Calendar</h3>
              <p className="text-gray-600">Calendar here...</p>
            </motion.div>

            <motion.div  initial={{ y: 20, opacity: 0 }}  animate={{ y: 0, opacity: 1 }}  transition={{ delay: 0.4 }}  className="flex-1 bg-white rounded-2xl shadow-md p-6" >
              <h3 className="text-lg font-semibold mb-4 text-[#303345]">TO DOs</h3>
              <p className="text-gray-600">Reminders here...</p>
            </motion.div>
          </div>

          {/* OTHER FEATURE */}
          <motion.div  initial={{ y: 20, opacity: 0 }}  animate={{ y: 0, opacity: 1 }}  transition={{ delay: 0.6 }} className="bg-white rounded-2xl shadow-md p-6 mb-6" >
            <h3 className="text-lg font-semibold mb-4 text-[#303345]">  ADD OTHER FEATURES Here </h3>
            <p className="text-red-600">  Additional content like notes, upcoming events, or announcements can go here. </p>
          </motion.div>

          {/* Search bar */}
          <motion.div  initial={{ y: 20, opacity: 0 }}  animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}  className="flex justify-end mt-auto"  >
            <input type="text"  placeholder="Search" className="w-40 px-4 py-2 rounded-lg bg-[#C5CAE9] text-[#1F1F30] placeholder-gray-700 focus:outline-none"
            />
          </motion.div>
        </motion.main>
      </motion.div>
    </div>
  );
};

export default Dashboard;
//GOODS