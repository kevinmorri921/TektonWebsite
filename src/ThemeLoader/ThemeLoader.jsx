import React, { useEffect, useState } from "react";

function ThemeLoader() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Fetch user theme from backend (like your PHP code)
    const fetchTheme = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user-theme", {
          credentials: "include", // include cookies for user session
        });

        const data = await response.json();
        if (response.ok && data.theme) {
          setTheme(data.theme);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };

    fetchTheme();
  }, []);

  // Apply the theme to body tag (like PHP's script)
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [theme]);

  return null; // this component just sets the theme, no UI
}

export default ThemeLoader;
