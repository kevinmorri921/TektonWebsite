import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bgImage from "../assets/db-pic.jpg";
import { Home, BarChart3, Settings, User, LogOut, Pencil, Key, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const Profile = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [fullname, setFullname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState({ name: false, password: false, delete: false });

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!fullname) return setMessage("⚠ Please enter your new name.");
    
    try {
      setLoading(prev => ({ ...prev, name: true }));
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/auth/update-profile", // ✅ Corrected endpoint
        { fullname },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        localStorage.setItem("fullname", fullname);
        setMessage("✅ Name updated successfully.");
        setFullname("");
      } else {
        setMessage(res.data.message || "❌ Error updating name.");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠ Server error. Please try again later.");
    } finally {
      setLoading(prev => ({ ...prev, name: false }));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword)
      return setMessage("⚠ Please fill in all password fields.");
    
    try {
      setLoading(prev => ({ ...prev, password: true }));
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/auth/change-password", // ✅ Corrected endpoint
        { 
          currentPassword: currentPassword, // ✅ Correct field name
          newPassword: newPassword // ✅ Correct field name
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        setMessage("✅ Password changed successfully. Redirecting to login...");
        setCurrentPassword("");
        setNewPassword("");
        
        // ✅ Clear localStorage and redirect to login
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("fullname");
          localStorage.removeItem("email");
          navigate("/login");
        }, 2000);
      } else {
        setMessage(res.data.message || "❌ Error changing password.");
      }
    } catch (err) {
      console.error("Password change error:", err);
      if (err.response?.status === 400) {
        setMessage("⚠ Current password is incorrect.");
      } else {
        setMessage("⚠ Server error. Please try again later.");
      }
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone!"
    );
    if (!confirmDelete) return;
    
    try {
      setLoading(prev => ({ ...prev, delete: true }));
      const token = localStorage.getItem("token");
      const res = await axios.delete("http://localhost:5000/api/auth/delete-account", { // ✅ Corrected endpoint
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        localStorage.clear();
        setMessage("✅ Account deleted successfully. Redirecting...");
        setTimeout(() => navigate("/signup"), 1500);
      } else {
        setMessage(res.data.message || "❌ Error deleting account.");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠ Server error. Please try again later.");
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullname");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const storedName = localStorage.getItem("fullname") || "User";

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
            Hi, <span className="font-bold">{storedName}</span>!
          </p>

          <nav className="space-y-5">
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/dashboard")} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium"> <Home size={18} /> Dashboard </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/analytics")} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium"> <BarChart3 size={18} /> Analytics </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/settings")} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium"> <Settings size={18} /> Settings </motion.button>
          </nav>

          <div className="space-y-4 mt-auto mb-6">
            {/*<motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/profile")} className="flex items-center gap-3 bg-[#303345] px-4 py-2 w-full rounded-xl text-left font-medium text-black transition"> <User size={18} className="text-black" /> Profile </motion.button>*/}
            <div className="border-t border-gray-300" />
            <motion.button whileHover={{ scale: 1.05 }} onClick={handleLogout} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition" ><LogOut size={18} /> Log Out </motion.button>
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
          <h2 className="text-2xl font-extrabold text-[#14142B] mb-2">PROFILE SETTINGS</h2>
          <p className="text-sm text-gray-700 mb-6">Manage your personal information and account security below.</p>

          {message && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.2 }} 
              className={`p-3 rounded-md mb-6 w-full max-w-md ${
                message.includes("✅") ? "bg-green-100 text-green-800" : 
                message.includes("⚠") ? "bg-yellow-100 text-yellow-800" : 
                "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
            {/* UPDATE NAME */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-[#303345] flex items-center gap-2">
                <Pencil size={18} /> Update Name
              </h3>
              <form onSubmit={handleUpdateName} className="flex flex-col flex-1 justify-between">
                <input 
                  type="text" 
                  placeholder="New full name" 
                  value={fullname} 
                  onChange={(e) => setFullname(e.target.value)} 
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 mb-4" 
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  type="submit" 
                  disabled={loading.name || !fullname.trim()}
                  className="w-full bg-[#303345] text-black py-2 rounded-lg hover:opacity-90 disabled:opacity-90"
                >
                  {loading.name ? "Updating..." : "Update"}
                </motion.button>
              </form>
            </motion.div>

            {/* CHANGE PASSWORD */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-[#303345] flex items-center gap-2"> <Key size={18} /> Change Password </h3>
              <form onSubmit={handleChangePassword} className="flex flex-col flex-1 justify-between">
                <input 
                  type="password" 
                  placeholder="Current password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 mb-4" 
                />
                <input 
                  type="password" 
                  placeholder="New password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 mb-4"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  type="submit" 
                  disabled={loading.password || !currentPassword || !newPassword}
                  className="w-full bg-[#303345] text-black py-2 rounded-lg hover:opacity-90 disabled:opacity-90"
                >
                  {loading.password ? "Changing..." : "Change Password"}
                </motion.button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                You will be logged out after changing your password.
              </p>
            </motion.div>

            {/* DELETE ACCOUNT */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2"> <AlertTriangle size={18} /> Delete Account </h3>
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                onClick={handleDeleteAccount} 
                disabled={loading.delete}
                className="w-full bg-red-600 text-black py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
              > 
                {loading.delete ? "Deleting..." : <><Trash2 size={18} /> Delete Account</>}
              </motion.button>
              <p className="text-xs text-gray-500 mt-2">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </motion.div>
          </div>
        </motion.main>
      </motion.div>
    </div>
  );
};

export default Profile;