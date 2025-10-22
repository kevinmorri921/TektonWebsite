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

export default function Analytics() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markersRef = useRef(null);

  const [surveyData, setSurveyData] = useState([]);
  const API_URL = "http://localhost:5000/api/markers";

  // ✅ Load markers from backend
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

  // ✅ Re-render markers when surveyData updates
  useEffect(() => {
    if (!markersRef.current) return;
    renderMarkers(surveyData);
  }, [surveyData]);

  // ✅ Render markers with default Leaflet marker + hover + click
  function renderMarkers(data) {
    markersRef.current.clearLayers();

    data.forEach((point) => {
      const marker = L.marker([point.lat, point.lng]);

      // Popup info
      marker.bindPopup(`
        <div style="min-width:200px;">
          <b>${point.title || "Untitled Survey"}</b><br/>
          📍 <b>Location:</b> ${point.location || "Unknown"}<br/>
          👤 <b>Respondent:</b> ${point.respondent || "N/A"}<br/>
          📅 <b>Date:</b> ${point.date || "N/A"}<br/>
          📝 <b>Notes:</b> ${point.notes || "None"}<br/>
          🌐 (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})
        </div>
      `);

      // Hover effect (enlarge marker)
      marker.on("mouseover", (e) => {
        e.target.setIcon(
          new L.Icon({
            iconUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
            iconSize: [50, 82], // bigger on hover
            iconAnchor: [25, 82],
            popupAnchor: [1, -34],
            shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
            shadowSize: [41, 41],
          })
        );
      });

      marker.on("mouseout", (e) => {
        e.target.setIcon(new L.Icon.Default());
      });

      // Click -> open new tab
      marker.on("click", () => {
        window.open(`/survey/${point._id || ""}`, "_blank");
      });

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

  return (
    <div className="font-inter bg-gray-50 min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-12 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-semibold">📊 Analytics & Survey Map</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-blue-100 transition"
        >
          ⬅ Back to Dashboard
        </button>
      </nav>

      {/* Upload Section */}
      <section className="bg-white rounded-xl shadow-md p-6 m-8">
        <h2 className="text-xl font-semibold mb-2">📂 Upload Coordinates File</h2>
        <input
          type="file"
          accept=".txt,.json"
          multiple
          onChange={handleFileUpload}
          className="mt-2 mb-3"
        />
        <p className="text-gray-600 text-sm leading-relaxed">
          Supported formats:
          <br /> • <b>.txt</b>: latitude,longitude per line
          <br /> • <b>.json</b>: array of objects with <code>lat</code> and <code>lng</code>
        </p>
      </section>

      {/* Full-width Map */}
      <div className="flex-1 bg-white rounded-xl shadow-md mx-8 mb-8 p-4">
        <h2 className="text-xl font-semibold mb-2">🗺️ Survey Locations</h2>
        <div id="map" className="h-[80vh] w-full rounded-lg"></div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 bg-gray-100 text-gray-600 text-sm mt-auto">
        © {new Date().getFullYear()} <b>Survey Analytics</b> — All rights reserved.
      </footer>
    </div>
  );
}
