// ANALYTICS (UPDATED UI WITH ICONS)

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

import {
  ArrowLeft,
  Map,
  MapPinned,
  FilePlus2,
  ClipboardList,
  Info,
  Calendar,
  X
} from "lucide-react";

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
  const API_URL = "http://localhost:5000/api/markers";
  const activeMarkerLatLng = useRef(null);

  useEffect(() => { fetchMarkers(); }, []);

  const fetchMarkers = async () => {
    try {
      const res = await axios.get(API_URL);
      setSurveyData(res.data);
    } catch {
      alert("Failed to load markers!");
    }
  };

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", { center: [14.5995, 120.9842], zoom: 6 });

    const baseLayers = {
      normal: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
      satellite: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ),
    };

    baseLayers[mapView].addTo(map);
    mapRef.current = map;
    mapRef.current.baseLayers = baseLayers;

    markersRef.current = L.markerClusterGroup();
    map.addLayer(markersRef.current);

    const reposition = () => {
      if (!activeMarkerLatLng.current) return;
      const pt = mapRef.current.latLngToContainerPoint(activeMarkerLatLng.current);
      updatePopupPositionFromPoint(pt);
    };

    map.on("move", reposition);
    map.on("zoom", reposition);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const { baseLayers } = mapRef.current;
    Object.values(baseLayers).forEach((layer) => mapRef.current.removeLayer(layer));
    baseLayers[mapView].addTo(mapRef.current);
  }, [mapView]);

  useEffect(() => { if (!markersRef.current) return; renderMarkers(surveyData); }, [surveyData]);

  function updatePopupPositionFromPoint(pt) {
    setPopupPos({ left: pt.x + 20, top: pt.y - 10 });
  }

  function renderMarkers(data) {
    markersRef.current.clearLayers();
    data.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng]);
      marker.on("click", (e) => {
        activeMarkerLatLng.current = e.latlng;
        mapRef.current.panTo(e.latlng);
        const pt = mapRef.current.latLngToContainerPoint(e.latlng);
        updatePopupPositionFromPoint(pt);
        setSelectedSurvey(index);
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
        if (item.lat && item.lng)
          newPoints.push({ ...item, title: item.title || `Survey ${Date.now()}` });
      }
    }

    const updated = [...surveyData];
    const tolerance = 0.0001;

    try {
      for (const p of newPoints) {
        const idx = updated.findIndex(
          (s) => Math.abs(s.lat - p.lat) < tolerance && Math.abs(s.lng - p.lng) < tolerance
        );
        if (idx !== -1) {
          updated[idx].extraSurveys = updated[idx].extraSurveys || [];
          updated[idx].extraSurveys.push(p);
          await axios.put(`${API_URL}/${updated[idx]._id}`, updated[idx]);
        } else {
          updated.push(p);
          await axios.post(API_URL, p);
        }
      }
      setSurveyData(updated);
      alert("Coordinates uploaded!");
    } catch {
      alert("Failed to save coordinates!");
    }
  }

  const handleAddDetails = async (event) => {
    if (selectedSurvey === null) return alert("Select a survey marker first!");
    const file = event.target.files[0];
    if (!file) return;
    const json = JSON.parse(await file.text());
    setDetailsMap((prev) => ({
      ...prev,
      [selectedSurvey]: [...(prev[selectedSurvey] || []), ...(Array.isArray(json) ? json : [json])],
    }));
    alert("Details added!");
  };

  const selectedDetails = selectedSurvey !== null ? detailsMap[selectedSurvey] || [] : [];

  return (
    <div className="w-screen h-screen relative overflow-hidden">

      {/* Dashboard Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-4 right-4 z-[2000] flex items-center gap-2 bg-[#ffffff] text-[#303345] px-4 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Dashboard
      </button>

      {/* Map */}
      <div id="map" className="w-full h-full" />

      {/* View Toggle */}
      <button
        onClick={() => setMapView((v) => (v === "satellite" ? "normal" : "satellite"))}
        className="absolute bottom-4 left-4 z-[2000] flex items-center gap-2 bg-[#ffffff] text-[#303345] px-4 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition"
      >
        {mapView === "satellite" ? <Map className="w-5 h-5" /> : <MapPinned className="w-5 h-5" />}
        {mapView === "satellite" ? "Normal View" : "Satellite View"}
      </button>

      {/* Upload Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[2000]">
        <label className="flex items-center justify-center gap-2 bg-[#ffffff] text-[#303345] text-sm px-6 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition cursor-pointer whitespace-nowrap">
          <FilePlus2 className="w-5 h-5" />
          Upload Coordinates
          <input type="file" accept=".json" multiple onChange={handleFileUpload} className="hidden" />
        </label>

        <label className="flex items-center justify-center gap-2 bg-[#ffffff] text-[#303345] text-sm px-6 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition cursor-pointer whitespace-nowrap">
          <ClipboardList className="w-5 h-5" />
          Upload Survey Info
          <input type="file" accept=".json" onChange={handleAddDetails} className="hidden" />
        </label>
      </div>

{/* Survey List Popup */}
<AnimatePresence>
  {showSurveyList && selectedSurvey !== null && (
    <motion.div
      className="absolute z-[3000]"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ left: popupPos.left, top: popupPos.top, transform: "translate(-10%, -100%)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-200 w-[360px] relative">

        {/* Close Button */}
        <button
          onClick={() => setShowSurveyList(false)}
          className="absolute top-4 right-4 text-red-500 hover:text-red-600 transition"
        >
          <X size={20} strokeWidth={2.2} />
        </button>

        {/* Title */}
        <h2 className="text-xl text-[#303345] font-semibold text-center mb-4">Survey List</h2>

        <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">

          {/* Main Survey */}
          {surveyData[selectedSurvey] && (
            <div
              onClick={() => {
                setDetailsMap((prev) => ({
                  ...prev,
                  [selectedSurvey]: prev[selectedSurvey] || [surveyData[selectedSurvey]],
                }));
              }}
              className="bg-[#2C2F3A] text-white text-center py-3 rounded-full cursor-pointer hover:bg-[#3b3e4b] transition"
            >
              {surveyData[selectedSurvey].title || `Survey ${selectedSurvey + 1}`}
            </div>
          )}

          {/* Extra Surveys */}
          {surveyData[selectedSurvey]?.extraSurveys?.map((extra, i) => (
            <div
              key={i}
              onClick={() => {
                setDetailsMap((prev) => ({ ...prev, [selectedSurvey]: [extra] }));
              }}
              className="bg-[#2C2F3A] text-white text-center py-3 rounded-full cursor-pointer hover:bg-[#3b3e4b] transition"
            >
              {extra.title || `Survey (Extra ${i + 1})`}
            </div>
          ))}

          {/* ▼ DETAILS APPEAR HERE INSIDE SAME CONTAINER */}
          {selectedDetails.length > 0 && (
            <div className="mt-3 bg-gray-100 rounded-2xl p-4 text-sm text-[#303345] space-y-1">
              <p><b>Location:</b> {selectedDetails[0].location || "N/A"}</p>
              <p><b>Date:</b> {selectedDetails[0].date || "N/A"}</p>
              <p><b>Value:</b> {selectedDetails[0].value || "N/A"}</p>
              <p><b>Notes:</b> {selectedDetails[0].notes || "No notes provided"}</p>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

 
    </div>
  );
}

export default Analytics;
//GOODS