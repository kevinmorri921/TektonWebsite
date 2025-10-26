import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

// ✅ Fix missing marker icons (for Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

function Analytics() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const [surveyData, setSurveyData] = useState([]);

  const API_URL = "http://localhost:5000/api/markers";

  // ✅ Fetch markers
  useEffect(() => {
    fetchMarkers();
  }, []);

  const fetchMarkers = async () => {
    try {
      const res = await axios.get(API_URL);
      setSurveyData(res.data);
    } catch (err) {
      console.error("Error fetching markers:", err);
      alert("Failed to load markers from the database!");
    }
  };

  // ✅ Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = L.map("map", {
      center: [12.8797, 121.774],
      zoom: 6,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>',
    }).addTo(mapRef.current);

    markersRef.current = L.markerClusterGroup();
    mapRef.current.addLayer(markersRef.current);
  }, []);

  // ✅ Render markers when surveyData changes
  useEffect(() => {
    if (!markersRef.current) return;
    renderMarkers(surveyData);
  }, [surveyData]);

  function renderMarkers(data) {
    markersRef.current.clearLayers();

    data.forEach((point) => {
      const marker = L.marker([point.lat, point.lng]);

      // ✅ Simple popup (no hover or button)
      marker.bindPopup(`
        <div style="min-width:220px; line-height:1.4;">
          <b>${point.title || "Untitled Survey"}</b><br/>
          📍 <b>Location:</b> ${point.location || "Unknown"}<br/>
          👤 <b>Respondent:</b> ${point.respondent || "N/A"}<br/>
          📅 <b>Date:</b> ${point.date || "N/A"}<br/>
          📝 <b>Notes:</b> ${point.notes || "None"}<br/>
          🌐 (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})
        </div>
      `);

      // ❌ Removed hover and click events
      markersRef.current.addLayer(marker);
    });
  }

  // ✅ Handle file upload
  async function handleFileUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;

    const newPoints = [];

    for (const file of files) {
      const text = await file.text();

      if (file.name.endsWith(".json")) {
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            for (const item of json) {
              if (item.lat && item.lng) {
                newPoints.push({
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lng),
                  title: item.title || "Uploaded JSON Survey",
                  location: item.location || "Unknown",
                  respondent: item.respondent || "N/A",
                  date: item.date || new Date().toISOString().split("T")[0],
                  notes: item.notes || "Added from JSON upload",
                });
              }
            }
          }
        } catch (err) {
          alert("Invalid JSON file format!");
          console.error(err);
        }
      } else {
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          const [latStr, lngStr] = line.split(",").map((p) => p.trim());
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          if (!isNaN(lat) && !isNaN(lng)) {
            newPoints.push({
              lat,
              lng,
              title: `Uploaded Survey ${newPoints.length + 1}`,
              location: "Unknown",
              respondent: "N/A",
              date: new Date().toISOString().split("T")[0],
              notes: "Added from upload",
            });
          }
        }
      }
    }

    if (newPoints.length) {
      try {
        await Promise.all(newPoints.map((point) => axios.post(API_URL, point)));
        alert(`${newPoints.length} marker(s) uploaded successfully!`);
        fetchMarkers();
      } catch (err) {
        console.error("Error saving markers:", err);
        alert("Failed to save some markers to MongoDB!");
      }
    }
  }

  // ✅ Full-width responsive layout
  return (
    <div className="font-inter bg-gray-50 min-h-screen w-screen flex flex-col overflow-x-hidden">
      {/* 🔹 Navbar */}
      <nav className="bg-blue-600 text-white w-full fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-8 lg:px-16 py-5 shadow-lg">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
          📊 Analytics & Survey Map
        </h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-white text-blue-600 px-5 py-2 rounded-md font-semibold hover:bg-blue-100 transition text-sm sm:text-base"
        >
          ⬅ Back to Dashboard
        </button>
      </nav>

      {/* 🔹 Page Content */}
      <main className="flex-1 w-full pt-[90px] px-4 sm:px-8 lg:px-16 pb-10">
        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full mb-6">
          <h2 className="text-2xl font-semibold mb-4">📂 Upload Coordinates File</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <input
              type="file"
              accept=".txt,.json"
              multiple
              onChange={handleFileUpload}
              className="mt-2 mb-3 sm:mb-0 w-full sm:w-auto"
            />
            <p className="text-gray-600 text-sm sm:text-base">
              Supported formats:
              <br /> • <b>.txt</b>: latitude,longitude per line
              <br /> • <b>.json</b>: array of objects with <code>lat</code> and <code>lng</code>
            </p>
          </div>
        </section>

        {/* Map Section (fullscreen fitting, no overflow) */}
        <section className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">🗺️ Survey Locations</h2>
          <div
            id="map"
            className="w-full h-[calc(100vh-260px)] sm:h-[calc(100vh-250px)] lg:h-[calc(100vh-240px)] rounded-xl border border-gray-200 overflow-hidden"
          ></div>
        </section>
      </main>

      {/* 🔹 Footer */}
      <footer className="text-center py-4 bg-gray-100 text-gray-600 text-sm mt-auto">
        © {new Date().getFullYear()} <b>Survey Analytics</b> — All rights reserved.
      </footer>
    </div>
  );
}

export default Analytics;
