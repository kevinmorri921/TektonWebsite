import React, { useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiClient";

function ThemeLoader() {
  useEffect(() => {
    // Try to load user's theme from backend on app startup
    const loadUserTheme = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // No token, use localStorage as fallback
          loadThemeFromStorage();
          return;
        }

        // Fetch user's theme preference from backend
        const response = await axios.get(`${API_BASE_URL}/api/theme`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const userTheme = response.data.theme || "light";
          applyTheme(userTheme);
          localStorage.setItem("theme", userTheme);
        } else {
          loadThemeFromStorage();
        }
      } catch (error) {
        console.error("Error loading user theme:", error);
        // Fallback to localStorage if backend request fails
        loadThemeFromStorage();
      }
    };

    const loadThemeFromStorage = () => {
      const savedTheme = localStorage.getItem("theme") || "light";
      applyTheme(savedTheme);
    };

    const applyTheme = (theme) => {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark-mode");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark-mode");
      }
    };

    loadUserTheme();
  }, []);

  return null;
}

export default ThemeLoader;
