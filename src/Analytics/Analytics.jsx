import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

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
  const [detailsMap, setDetailsMap] = useState({});
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [mapView, setMapView] = useState("satellite");
  const [showSurveyList, setShowSurveyList] = useState(false);
  const [showSurveyDetails, setShowSurveyDetails] = useState(false);
  const [popupPos, setPopupPos] = useState({ left: 0, top: 0 });
  const listRefs = useRef([]);
  const API_URL = "http://localhost:5000/api/markers";
  const activeMarkerLatLng = useRef(null);

  useEffect(() => {
    fetchMarkers();
  }, []);

  const fetchMarkers = async () => {
    try {
      const res = await axios.get(API_URL);
      setSurveyData(res.data);
    } catch (err) {
      console.error("Error fetching markers:", err);
      alert("Failed to load markers!");
    }
  };

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
      center: [14.5995, 120.9842],
      zoom: 6,
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
          attribution: "&copy; Esri, OpenStreetMap",
        }
      ),
    };

    baseLayers[mapView].addTo(map);
    mapRef.current = map;
    mapRef.current.baseLayers = baseLayers;

    markersRef.current = L.markerClusterGroup();
    map.addLayer(markersRef.current);

    const reposition = () => {
      if (!activeMarkerLatLng.current || !mapRef.current) return;
      const pt = mapRef.current.latLngToContainerPoint(activeMarkerLatLng.current);
      updatePopupPositionFromPoint(pt);
    };
    map.on("move", reposition);
    map.on("zoom", reposition);

    return () => {
      map.off("move", reposition);
      map.off("zoom", reposition);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const { baseLayers } = mapRef.current;
    Object.values(baseLayers).forEach((layer) => mapRef.current.removeLayer(layer));
    baseLayers[mapView].addTo(mapRef.current);
  }, [mapView]);

  useEffect(() => {
    if (!markersRef.current) return;
    renderMarkers(surveyData);
  }, [surveyData]);

  function updatePopupPositionFromPoint(pt) {
    const offsetX = 20;
    const offsetY = -10;
    setPopupPos({ left: pt.x + offsetX, top: pt.y + offsetY });
  }

  function renderMarkers(data) {
    markersRef.current.clearLayers();

    data.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng]);
      marker.on("click", (e) => {
        activeMarkerLatLng.current = e.latlng;
        mapRef.current.panTo(e.latlng, { animate: true });
        const pt = mapRef.current.latLngToContainerPoint(e.latlng);
        updatePopupPositionFromPoint(pt);
        setSelectedSurvey(index);
        // Only show survey list, not details automatically
        setShowSurveyList(true);
        setShowSurveyDetails(false);
      });
      markersRef.current.addLayer(marker);
    });
  }

  async function handleFileUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;

    const newPoints = [];
    for (const file of files) {
      const text = await file.text();
      const json = JSON.parse(text);
      for (const item of json) {
        if (item.lat && item.lng) newPoints.push(item);
      }
    }

    if (!newPoints.length) return;

    const updatedSurveys = [...surveyData];
    const tolerance = 0.0001;

    newPoints.forEach((p) => {
      const existingIndex = updatedSurveys.findIndex(
        (s) => Math.abs(s.lat - p.lat) < tolerance && Math.abs(s.lng - p.lng) < tolerance
      );

      if (existingIndex !== -1) {
        if (!updatedSurveys[existingIndex].extraSurveys) {
          updatedSurveys[existingIndex].extraSurveys = [];
        }
        updatedSurveys[existingIndex].extraSurveys.push(p);
      } else {
        updatedSurveys.push(p);
      }
    });

    setSurveyData(updatedSurveys);
    alert("Coordinates uploaded!");
  }

  const handleAddDetails = async (event) => {
    if (selectedSurvey === null) return alert("Select a survey marker first!");
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      setDetailsMap((prev) => ({
        ...prev,
        [selectedSurvey]: [...(prev[selectedSurvey] || []), ...(Array.isArray(json) ? json : [json])],
      }));
      alert("Additional details added to this specific survey!");
    } catch {
      alert("Invalid file format for details!");
    }
  };

  const selectedDetails = selectedSurvey !== null ? detailsMap[selectedSurvey] || [] : [];

  return (
    <div className="font-inter bg-gray-50 min-h-screen w-screen flex flex-col overflow-x-hidden">
      <nav className="bg-blue-600 text-white fixed w-full top-0 z-50 flex justify-between items-center px-6 py-5 shadow-lg">
        <h1 className="text-2xl font-semibold">📊 Analytics & Survey Map</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-white text-blue-600 px-5 py-2 rounded-md font-semibold hover:bg-blue-100 transition"
        >
          ⬅ Back to Dashboard
        </button>
      </nav>

      <main className="flex-1 w-full pt-[90px] px-6 pb-10">
        <section className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">📂 Upload Coordinates</h2>
          <input type="file" accept=".json" multiple onChange={handleFileUpload} className="mb-2" />
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">🗺️ Survey Locations</h2>
            <button
              onClick={() => setMapView((v) => (v === "satellite" ? "normal" : "satellite"))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              Switch to {mapView === "satellite" ? "🗺️ Normal View" : "🛰️ Satellite View"}
            </button>
          </div>

          <div id="map" className="w-full h-[calc(100vh-260px)] rounded-xl border border-gray-200" />

          {/* Survey List Popup */}
          <AnimatePresence>
            {showSurveyList && selectedSurvey !== null && (
              <motion.div
                className="absolute z-[1000]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  left: popupPos.left,
                  top: popupPos.top,
                  transform: "translate(-10%, -100%)",
                }}
              >
                <div className="bg-white/70 backdrop-blur-lg rounded-xl shadow-2xl p-4 border border-gray-300 w-80 relative">
                  <button
                    onClick={() => setShowSurveyList(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
                  >
                    ❌
                  </button>
                  <h2 className="text-xl font-semibold mb-3 text-center text-blue-700">
                    📋 Survey List
                  </h2>

                  <div className="max-h-[250px] overflow-y-auto space-y-2">
                    {surveyData[selectedSurvey] && (
                      <>
                        {/* Main Survey */}
                        <div
                          onClick={() => {
                            setShowSurveyList(false);
                            setShowSurveyDetails(true);
                          }}
                          className="p-3 rounded-lg border bg-blue-50/80 border-blue-400 shadow-md cursor-pointer hover:bg-blue-100 transition"
                        >
                          <p className="font-semibold text-blue-700 underline">
                            {surveyData[selectedSurvey].title ||
                              `Survey ${selectedSurvey + 1}`}
                          </p>
                        </div>

                        {/* Extra Surveys */}
                        {surveyData[selectedSurvey].extraSurveys?.map((extra, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setShowSurveyList(false);
                              setShowSurveyDetails(true);
                              setDetailsMap((prev) => ({
                                ...prev,
                                [selectedSurvey]: [extra],
                              }));
                            }}
                            className="p-3 rounded-lg border bg-blue-50/80 border-blue-300 shadow-md cursor-pointer hover:bg-blue-100 transition"
                          >
                            <p className="font-semibold text-blue-700 underline">
                              {extra.title || `Survey (Extra ${i + 1})`}
                            </p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Survey Details Popup */}
          <AnimatePresence>
            {showSurveyDetails && (
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-[400px] relative">
                  <button
                    onClick={() => setShowSurveyDetails(false)}
                    className="absolute top-2 right-3 text-gray-600 hover:text-red-600 text-xl"
                  >
                    ❌
                  </button>

                  {selectedDetails.length > 0 ? (
                    selectedDetails.map((d, i) => (
                      <div key={i} className="mb-3 border-b pb-2">
                        <h3 className="text-2xl font-bold text-center mb-2 text-blue-700">
                          {d.title || `Detail ${i + 1}`}
                        </h3>
                        <p>📍 <b>Location:</b> {d.location || "N/A"}</p>
                        <p>📅 <b>Date:</b> {d.date || "N/A"}</p>
                        <p>📊 <b>Value:</b> {d.value || "N/A"}</p>
                        <p>📝 <b>Notes:</b> {d.notes || "No notes"}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-700 mb-3">
                        ⚠️ No details available for this survey.
                      </p>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        ➕ Add Details (JSON):
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleAddDetails}
                        className="mt-1 w-full text-sm"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => {
                        setShowSurveyDetails(false);
                        setShowSurveyList(true);
                      }}
                      className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                    >
                      ⬅ Back
                    </button>

                    <button
                      onClick={() => setShowSurveyDetails(false)}
                      className="flex-1 bg-gray-600 text-black-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

export default Analytics;
