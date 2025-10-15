import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [fullname, setFullname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Update Fullname
  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!fullname) return setMessage("⚠ Please enter your new name.");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/update-name",
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
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword)
      return setMessage("⚠ Please fill in all password fields.");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/change-password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage("✅ Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setMessage(res.data.message || "❌ Error changing password.");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠ Server error. Please try again later.");
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone!"
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete("http://localhost:5000/api/delete-account", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        localStorage.clear();
        navigate("/signup");
      } else {
        setMessage(res.data.message || "❌ Error deleting account.");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠ Server error. Please try again later.");
    }
  };

  return (
    <div className="w-screen h-screen flex bg-gradient-to-br from-blue-600 to-blue-400 text-white">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ⬅ Back
        </button>
      </div>

      {/* Left Side */}
      <div className="w-1/2 h-full bg-blue-700 flex flex-col items-center justify-center text-center px-10">
        <h1 className="text-5xl font-bold mb-6">👤 Profile Settings</h1>
        <p className="text-xl text-blue-100">
          Manage your personal information and account security.
        </p>
      </div>

      {/* Right Side */}
      <div className="w-1/2 h-full bg-white text-blue-800 flex flex-col justify-center items-center p-16 overflow-y-auto">
        <h2 className="text-4xl font-bold mb-8">Account Management</h2>

        {message && (
          <div className="bg-blue-100 text-blue-700 p-3 rounded-md mb-6 w-96 text-center">
            {message}
          </div>
        )}

        <div className="w-96 space-y-8">
          {/* Update Name */}
          <div className="bg-blue-50 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">✏️ Update Name</h3>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <input
                type="text"
                placeholder="New full name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
                className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 transition-all"
              >
                Update
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-blue-50 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">🔑 Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 transition-all"
              >
                Change Password
              </button>
            </form>
          </div>

          {/* Delete Account */}
          <div className="bg-red-50 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-red-700">
              ⚠️ Delete Account
            </h3>
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-all"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

