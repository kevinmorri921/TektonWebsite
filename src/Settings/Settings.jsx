import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    theme: "light",
    language: "en",
    notifications: true,
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/settings", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load settings");

        const data = await res.json();
        setSettings({
          theme: data.theme || "light",
          language: data.language || "en",
          notifications: data.notifications === 1,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Apply theme to body
  useEffect(() => {
    if (settings.theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [settings.theme]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle save
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

      if (res.ok) {
        setSuccess(true);
      } else {
        alert("Failed to save settings");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="w-screen h-screen flex items-center justify-center text-blue-800 text-xl font-semibold">
        Loading settings...
      </div>
    );

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
      <div className="w-1/2 h-full bg-blue-700 flex flex-col items-center justify-center text-center text-white px-10">
        <h1 className="text-5xl font-bold mb-6">⚙️ Settings</h1>
        <p className="text-xl text-blue-100">
          Customize your Tekton Geometrix preferences.
        </p>
      </div>

      {/* Right Side */}
      <div className="w-1/2 h-full bg-white text-blue-800 flex flex-col justify-center items-center p-16">
        <h2 className="text-4xl font-bold mb-8">User Preferences</h2>

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded-md mb-6 w-96 text-center">
            ✅ Settings updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-96 space-y-6">
          <div>
            <label htmlFor="theme" className="block font-semibold mb-2">
              Theme:
            </label>
            <select
              name="theme"
              id="theme"
              value={settings.theme}
              onChange={handleChange}
              className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label htmlFor="language" className="block font-semibold mb-2">
              Language:
            </label>
            <select
              name="language"
              id="language"
              value={settings.language}
              onChange={handleChange}
              className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="ph">Filipino</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
              className="w-5 h-5"
            />
            <label className="font-semibold">Enable Notifications</label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all"
          >
            💾 Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;

