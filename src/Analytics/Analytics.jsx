import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
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

  const [surveyData, setSurveyData] = useState([
    { lat: 14.5995, lng: 120.9842, title: "Survey 1", location: "Manila", respondent: "Juan Dela Cruz", date: "2025-09-20", notes: "Metro survey" },
    { lat: 10.3157, lng: 123.8854, title: "Survey 2", location: "Cebu", respondent: "Maria Santos", date: "2025-09-21", notes: "Visayas feedback" },
    { lat: 7.1907, lng: 125.4553, title: "Survey 3", location: "Davao", respondent: "Jose Ramirez", date: "2025-09-22", notes: "Mindanao survey" },
    { lat: 16.4023, lng: 120.5960, title: "Survey 4", location: "Baguio", respondent: "Anna Lopez", date: "2025-09-23", notes: "Highland feedback" },
    { lat: 6.9214, lng: 122.0790, title: "Survey 5", location: "Zamboanga", respondent: "Pedro Cruz", date: "2025-09-24", notes: "Community input" },
  ]);

  const [activeSurveyIndex, setActiveSurveyIndex] = useState(null);
  const [detailHtml, setDetailHtml] = useState("<p>ℹ️ Click a marker or a list item to view details.</p>");

  useEffect(() => {
    if (mapRef.current) return;

    // Initialize map
    mapRef.current = L.map("map", {
      center: [12.8797, 121.774],
      zoom: 6,
    });

    // ✅ Google Maps-like style (Carto Voyager)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>',
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
      <h4>${point.title}</h4>
      <p><b>📍 Location:</b> ${point.location}</p>
      <p><b>👤 Respondent:</b> ${point.respondent}</p>
      <p><b>📅 Date:</b> ${point.date}</p>
      <p><b>📝 Notes:</b> ${point.notes}</p>
      <p><b>🌐 Coordinates:</b> ${point.lat}, ${point.lng}</p>
    `;
    setDetailHtml(html);
  }

  async function getLocationName(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      if (data && data.address) {
        return (
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.state ||
          "Unknown"
        );
      }
    } catch {
      return "Unknown";
    }
  }

  async function handleFileUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of files) {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const newPoints = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            const loc = await getLocationName(lat, lng);
            newPoints.push({
              lat,
              lng,
              title: `Uploaded Survey ${surveyData.length + newPoints.length + 1}`,
              location: loc,
              respondent: "N/A",
              date: new Date().toISOString().split("T")[0],
              notes: "Added from upload",
            });
          }
        }
      }

      if (newPoints.length) {
        setSurveyData((prev) => [...prev, ...newPoints]);
      }
    }
  }

  return (
    <div
      style={{
        fontFamily: "Inter, Arial, sans-serif",
        background: "#f9fafb",
        color: "black", // ✅ make all text black
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          background: "#2563eb",
          color: "white",
          padding: "15px 50px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0, color: "white" }}>
          📊 Analytics & Survey Map
        </h1>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "white",
            color: "#2563eb",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ⬅ Back to Dashboard
        </button>
      </nav>

      {/* Main Content */}
      <div style={{ padding: "30px 60px", display: "flex", flexDirection: "column", gap: 30 }}>
        {/* Upload Section */}
        <section
          style={{
            background: "white",
            borderRadius: 10,
            padding: 20,
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            color: "black",
          }}
        >
          <h2>📂 Upload Coordinates File</h2>
          <input type="file" accept=".txt" multiple onChange={handleFileUpload} />
          <p style={{ color: "black" }}>Format: latitude,longitude per line</p>
        </section>

        {/* Map Section */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 1fr",
            gap: 25,
            color: "black",
          }}
        >
          {/* Map */}
          <div
            style={{
              background: "white",
              borderRadius: 10,
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              padding: 10,
              color: "black",
            }}
          >
            <h2>🗺️ Survey Locations</h2>
            <div id="map" style={{ height: "80vh", width: "100%", borderRadius: 10 }}></div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, color: "black" }}>
            {/* Survey List */}
            <div
              style={{
                background: "white",
                padding: 15,
                borderRadius: 10,
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                maxHeight: "40vh",
                overflowY: "auto",
                color: "black",
              }}
            >
              <h3>📋 Survey List</h3>
              {surveyData.map((point, i) => (
                <div
                  key={i}
                  onClick={() => {
                    showDetails(point);
                    setActiveSurveyIndex(i);
                    mapRef.current.setView([point.lat, point.lng], 12);
                  }}
                  style={{
                    padding: "8px 10px",
                    marginBottom: 5,
                    borderRadius: 6,
                    background:
                      activeSurveyIndex === i ? "#e0f2fe" : "transparent",
                    cursor: "pointer",
                    color: "black",
                  }}
                >
                  <b>{point.title}</b>
                  <div style={{ fontSize: "0.9rem", color: "black" }}>{point.location}</div>
                </div>
              ))}
            </div>

            {/* Details */}
            <div
              style={{
                background: "white",
                padding: 15,
                borderRadius: 10,
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                flex: 1,
                color: "black",
              }}
            >
              <h3>📄 Details</h3>
              <div dangerouslySetInnerHTML={{ __html: detailHtml }} />
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "15px",
          background: "#f1f5f9",
          color: "black", // ✅ black footer text
          marginTop: 30,
          fontSize: "0.9rem",
        }}
      >
        © {new Date().getFullYear()} Survey Analytics — All rights reserved.
      </footer>
    </div>
  );
}
