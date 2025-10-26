import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

// ✅ Fix missing marker icons for Vite
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
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [mapView, setMapView] = useState("satellite"); // 🛰️ Default view
  const listRefs = useRef([]);
  const API_URL = "http://localhost:5000/api/markers";

  // ✅ Fetch markers from backend
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

    const map = L.map("map", {
      center: [14.5995, 120.9842], // Manila
      zoom: 6,
      zoomControl: true,
    });

    const baseLayers = {
      normal: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }),
      satellite: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.esri.com/">Esri</a>, &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        }
      ),
    };

    // 🛰️ Default to satellite view
    baseLayers[mapView].addTo(map);
    mapRef.current = map;
    mapRef.current.baseLayers = baseLayers;

    markersRef.current = L.markerClusterGroup();
    map.addLayer(markersRef.current);

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(document.getElementById("map"));
    return () => resizeObserver.disconnect();
  }, []);

  // ✅ Switch Map View
  useEffect(() => {
    if (!mapRef.current) return;
    const { baseLayers } = mapRef.current;
    Object.values(baseLayers).forEach((layer) => mapRef.current.removeLayer(layer));
    baseLayers[mapView].addTo(mapRef.current);
  }, [mapView]);

  // ✅ Render markers
  useEffect(() => {
    if (!markersRef.current) return;
    renderMarkers(surveyData);
  }, [surveyData]);

  function renderMarkers(data) {
    markersRef.current.clearLayers();

    data.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng]);
      marker.on("click", () => {
        setSelectedSurvey(index);
        listRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      markersRef.current.addLayer(marker);
    });
  }

  // ✅ Handle file upload (.json or .txt)
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

  // ✅ Layout
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

      {/* 🔹 Main Content */}
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

        {/* Map Section */}
        <section className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden mb-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">🗺️ Survey Locations</h2>
            <button
              onClick={() => setMapView((v) => (v === "satellite" ? "normal" : "satellite"))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              Switch to {mapView === "satellite" ? "🗺️ Normal View" : "🛰️ Satellite View"}
            </button>
          </div>

          <div
            id="map"
            className="w-full h-[calc(100vh-260px)] sm:h-[calc(100vh-250px)] lg:h-[calc(100vh-240px)] rounded-xl border border-gray-200 overflow-hidden"
          ></div>
        </section>

        {/* Survey List */}
        <section className="bg-white rounded-2xl shadow-lg p-6 w-full">
          <h2 className="text-2xl font-semibold mb-4">📋 Survey Titles</h2>
          <div className="max-h-[50vh] overflow-y-auto space-y-3">
            {surveyData.map((survey, index) => (
              <div
                key={index}
                ref={(el) => (listRefs.current[index] = el)}
                onClick={() => window.open(`/survey/${survey._id || index}`, "_blank")}
                className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                  selectedSurvey === index
                    ? "bg-blue-100 border-blue-500 shadow-md"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <p className="font-semibold text-lg text-blue-600 underline">
                  {survey.title || `Survey ${index + 1}`}
                </p>
              </div>
            ))}
          </div>
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
