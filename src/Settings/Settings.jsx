import React, { useEffect, useState } from "react";

function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: "light",
    language: "en",
    notifications: true,
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user settings from backend (like PHP SELECT query)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/settings", {
          credentials: "include", // keep cookies/session
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

  // Update body class if theme changes (dark/light)
  useEffect(() => {
    if (settings.theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [settings.theme]);

  // Handle form change
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

  if (loading) return <p>Loading settings...</p>;

  return (
    <div className={`settings-page ${settings.theme === "dark" ? "dark-mode" : ""}`}>
      <header>
        <h1>⚙️ Settings & Preferences</h1>
        <a href="/dashboard" className="btn-logout">⬅ Back to Dashboard</a>
      </header>

      <div className="settings-container">
        {success && <p className="settings-success">✅ Settings updated successfully!</p>}

        <form onSubmit={handleSubmit} className="settings-form">
          <label htmlFor="theme">Theme:</label>
          <select name="theme" id="theme" value={settings.theme} onChange={handleChange}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>

          <label htmlFor="language">Language:</label>
          <select
            name="language"
            id="language"
            value={settings.language}
            onChange={handleChange}
          >
            <option value="en">English</option>
            <option value="ph">Filipino</option>
          </select>

          <label>
            <input
              type="checkbox"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
            />
            Enable Notifications
          </label>

          <button type="submit" className="btn-save">💾 Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;
