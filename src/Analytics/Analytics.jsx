import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

// Fix marker icons in Vite
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

export default function Analytics() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markersRef = useRef(null);

  const [surveyData, setSurveyData] = useState([
    { lat: 14.5995, lng: 120.9842, title: "Survey 1", location: "Manila", respondent: "Juan Dela Cruz", date: "2025-09-20", notes: "Metro survey" },
    { lat: 10.3157, lng: 123.8854, title: "Survey 2", location: "Cebu", respondent: "Maria Santos", date: "2025-09-21", notes: "Visayas feedback" },
    { lat: 7.1907, lng: 125.4553, title: "Survey 3", location: "Davao", respondent: "Jose Ramirez", date: "2025-09-22", notes: "Mindanao survey" },
    { lat: 16.4023, lng: 120.5960, title: "Survey 4", location: "Baguio", respondent: "Anna Lopez", date: "2025-09-23", notes: "Highland feedback" },
    { lat: 6.9214, lng: 122.0790, title: "Survey 5", location: "Zamboanga", respondent: "Pedro Cruz", date: "2025-09-24", notes: "Community input" },
  ]);

  const [activeSurveyIndex, setActiveSurveyIndex] = useState(null);
  const [detailHtml, setDetailHtml] = useState(
    "<p>ℹ️ Click on a marker or a survey from the list to see details.</p>"
  );

  // Initialize map once
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = L.map("map", {
      center: [12.8797, 121.774],
      zoom: 6,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    markersRef.current = L.markerClusterGroup();
    mapRef.current.addLayer(markersRef.current);

    renderMarkers(surveyData);

    return () => {
      mapRef.current.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when surveyData updates
  useEffect(() => {
    if (!markersRef.current) return;
    renderMarkers(surveyData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyData]);

  function renderMarkers(data) {
    markersRef.current.clearLayers();

    data.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng]);
      marker.on("click", () => {
        showDetails(point);
        setActiveSurveyIndex(index);
        mapRef.current.setView([point.lat, point.lng], 12, { animate: true });
      });
      markersRef.current.addLayer(marker);
    });
  }

  function showDetails(point) {
    const html = `
      <div class="detail-item"><strong>${point.title}</strong></div>
      <div class="detail-item"><b>📍 Location:</b> ${point.location}</div>
      <div class="detail-item"><b>👤 Respondent:</b> ${point.respondent}</div>
      <div class="detail-item"><b>📅 Date:</b> ${point.date}</div>
      <div class="detail-item"><b>📝 Notes:</b> ${point.notes}</div>
      <div class="detail-item"><b>🌐 Coordinates:</b> ${point.lat}, ${point.lng}</div>
    `;
    setDetailHtml(html);
  }

  async function getLocationName(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      if (data && data.address) {
        return (
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.state ||
          "Unknown Location"
        );
      }
    } catch (e) {
      console.error("Reverse geocoding failed:", e);
    }
    return "Unknown Location";
  }

  async function handleFileUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const newPoints = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            const locationName = await getLocationName(lat, lng);
            newPoints.push({
              lat,
              lng,
              title: `Uploaded Survey ${surveyData.length + newPoints.length + 1}`,
              location: locationName,
              respondent: "N/A",
              date: new Date().toISOString().split("T")[0],
              notes: "Added from file upload",
            });
          }
        }
      }

      if (newPoints.length) {
        setSurveyData((prev) => [...prev, ...newPoints]);
      }
    }
  }

  function handleListItemClick(point, index) {
    if (!mapRef.current) return;
    mapRef.current.setView([point.lat, point.lng], 12, { animate: true });
    showDetails(point);
    setActiveSurveyIndex(index);
  }

  return (
    <div
      className="dashboard-page"
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f4f4f9",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 25px",
          background: "#1e3a8a",
          color: "#fff",
        }}
      >
        <h1 style={{ margin: 0 }}>📊 Analytics & Survey Map</h1>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "8px 14px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ⬅ Back to Dashboard
        </button>
      </header>

      {/* Main Content */}
      <div
        className="dashboard-container"
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* File Upload Section */}
        <div
          className="card"
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
          }}
        >
          <h3>📂 Upload Survey Coordinates (.txt)</h3>
          <input
            type="file"
            id="fileUpload"
            accept=".txt"
            multiple
            onChange={handleFileUpload}
          />
          <p style={{ color: "#555" }}>Format: latitude,longitude per line</p>
        </div>

        {/* Map + List + Details */}
        <div className="map-section" style={{ display: "flex", gap: 20 }}>
          {/* Map + Survey List */}
          <div
            className="map-container"
            style={{
              flex: 3,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div
              className="card"
              style={{
                background: "#fff",
                padding: 16,
                borderRadius: 12,
                boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
              }}
            >
              <h3>🗺️ Survey Locations</h3>
              <div
                id="map"
                style={{ height: 500, width: "100%", borderRadius: 10 }}
              ></div>
            </div>

            <div
              className="survey-list"
              style={{
                background: "#fff",
                padding: 15,
                borderRadius: 12,
                boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              <h3>📋 Survey List</h3>
              <div id="surveyList">
                {surveyData.map((point, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleListItemClick(point, idx)}
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #ddd",
                      cursor: "pointer",
                      background:
                        activeSurveyIndex === idx ? "#dbeafe" : "transparent",
                    }}
                  >
                    {point.title} - {point.location}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div
            className="details-panel"
            style={{
              flex: 1,
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              height: "fit-content",
            }}
          >
            <h3>📋 Survey Details</h3>
            <div id="surveyDetails" dangerouslySetInnerHTML={{ __html: detailHtml }} />
          </div>
        </div>
      </div>
    </div>
  );
}
