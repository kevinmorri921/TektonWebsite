import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

import { ArrowLeft, Map, MapPinned, FilePlus2, ClipboardList, X } from "lucide-react";

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
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [mapView, setMapView] = useState("satellite");
  const [showSurveyList, setShowSurveyList] = useState(false);
  const [showSurveyDetails, setShowSurveyDetails] = useState(false);
  const [popupPos, setPopupPos] = useState({ left: 0, top: 0 });
  const API_URL = "http://localhost:5000/api/markers";
  const activeMarkerLatLng = useRef(null);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0);

  useEffect(() => { fetchMarkers(); }, []);

  const fetchMarkers = async () => {
    try {
      const res = await axios.get(API_URL);
      setSurveyData(res.data);

      if (res.data.length > 0 && mapRef.current) {
      const latestIndex = res.data.length - 1;
      const latest = res.data[res.data.length - 1];
      const lat = latest.latitude ?? latest.lat;
      const lng = latest.longitude ?? latest.lng;
      if (lat && lng) {
        mapRef.current.setView([lat, lng], 14); // zoom level 14
        setCurrentMarkerIndex(latestIndex);
      }
    }
    } catch (err) {
      console.error(err);
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
      setPopupPos({ left: pt.x + 20, top: pt.y - 10 });
    };

    map.on("move", reposition);
    map.on("zoom", reposition);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    Object.values(mapRef.current.baseLayers).forEach((layer) => mapRef.current.removeLayer(layer));
    mapRef.current.baseLayers[mapView].addTo(mapRef.current);
  }, [mapView]);

  useEffect(() => { if (!markersRef.current) return; renderMarkers(surveyData); }, [surveyData]);

  const renderMarkers = (data) => {
    markersRef.current.clearLayers();
    data.forEach((point) => {
      const lat = point.latitude ?? point.lat;
      const lng = point.longitude ?? point.lng;
      if (!lat || !lng) return;

      const marker = L.marker([lat, lng]);
      marker.on("click", (e) => {
        activeMarkerLatLng.current = e.latlng;
        mapRef.current.panTo(e.latlng);
        const pt = mapRef.current.latLngToContainerPoint(e.latlng);
        setPopupPos({ left: pt.x + 20, top: pt.y - 10 });
        setSelectedMarker(point);
        setSelectedSurvey(null);
        setShowSurveyList(true);
        setShowSurveyDetails(false);
      });
      markersRef.current.addLayer(marker);
    });
  };

  async function handleFileUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;

    const newPoints = [];
    for (const file of files) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const entries = Array.isArray(json) ? json : [json];
        for (const item of entries) {
          const latitude = parseFloat(item.latitude ?? item.lat);
          const longitude = parseFloat(item.longitude ?? item.lng);
          if (!isNaN(latitude) && !isNaN(longitude)) {
            newPoints.push({ ...item, latitude, longitude });
          }
        }
      } catch {
        alert(`Failed to parse ${file.name}`);
      }
    }
    if (!newPoints.length) return;

    try {
      for (const p of newPoints) await axios.post(API_URL, p);
      await fetchMarkers();
      alert("Coordinates uploaded!");
    } catch {
      alert("Failed to save coordinates!");
    }
  }

  const selectedDetails =
    selectedMarker &&
    selectedMarker.surveys?.find((s) => s.name === selectedSurvey);

  return (
    <div className="w-screen h-screen relative overflow-hidden">

      {/* Dashboard Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-4 right-4 z-[2000] flex items-center gap-2 bg-[#ffffff] text-[#303345] px-4 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition"
      >
        <ArrowLeft className="w-5 h-5" /> Dashboard
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

      {/* Previous Marker Button */}
      <button
        onClick={() => {
          if (surveyData.length === 0) return;
          const prevIndex =
            (currentMarkerIndex - 1 + surveyData.length) % surveyData.length;
          const prevMarker = surveyData[prevIndex];
          const lat = prevMarker.latitude ?? prevMarker.lat;
          const lng = prevMarker.longitude ?? prevMarker.lng;
          if (lat && lng && mapRef.current) {
            mapRef.current.setView([lat, lng], 14);
            setSelectedMarker(prevMarker);
            setSelectedSurvey(null);
            setShowSurveyList(true);
            setShowSurveyDetails(false);
            setCurrentMarkerIndex(prevIndex);
          }
        }}
        className="absolute bottom-19 right-25 z-[2000] flex items-center gap-2 bg-[#ffffff] text-[#303345] px-4 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition"
      >
        ◀ Previous
      </button>

      {/* Next Marker Button */}
      <button
        onClick={() => {
          if (surveyData.length === 0) return;
          const nextIndex = (currentMarkerIndex + 1) % surveyData.length;
          const nextMarker = surveyData[nextIndex];
          const lat = nextMarker.latitude ?? nextMarker.lat;
          const lng = nextMarker.longitude ?? nextMarker.lng;
          if (lat && lng && mapRef.current) {
            mapRef.current.setView([lat, lng], 14);
            setSelectedMarker(nextMarker);
            setSelectedSurvey(null);
            setShowSurveyList(true);
            setShowSurveyDetails(false);
            setCurrentMarkerIndex(nextIndex);
          }
        }}
        className="absolute bottom-19 right-4 z-[2000] flex items-center gap-2 bg-[#ffffff] text-[#303345] px-4 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition"
      >
        Next ▶
      </button>



      {/* Upload Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[2000]">
        <label className="flex items-center justify-center gap-2 bg-[#ffffff] text-[#303345] text-sm px-6 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition cursor-pointer whitespace-nowrap">
          <FilePlus2 className="w-5 h-5" />
          Upload Coordinates
          <input type="file" accept=".json" multiple onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Survey List Popup */}
      {/* Survey List & Details Popup */}
      {/* Survey List Popup */}
<AnimatePresence>
  {showSurveyList && selectedMarker && (
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
          {selectedMarker.surveys?.map((survey, i) => (
            <div
              key={i}
              onClick={() => {
                setSelectedSurvey(survey.name); // select the survey
                setShowSurveyList(false);        // close the list
                setShowSurveyDetails(true);      // open the details modal
              }}
              className="bg-[#2C2F3A] text-white text-center py-3 rounded-full cursor-pointer hover:bg-[#3b3e4b] transition"
            >
              {survey.name || `Survey ${i + 1}`}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

{/* Survey Details Modal */}
<AnimatePresence>
  {showSurveyDetails && selectedDetails && (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-[450px] relative">
        <button
          onClick={() => setShowSurveyDetails(false)}
          className="absolute top-2 right-3 text-gray-600 hover:text-red-600 text-xl"
        >
          ❌
        </button>

        <h3 className="text-2xl font-bold text-center mb-3 text-blue-700">
          {selectedDetails.name}
        </h3>

        <div className="space-y-1 text-sm">
          <p>🌍 <b>Radio 1:</b> {selectedDetails.radioOne || "N/A"}</p>
          <p>🌎 <b>Radio 2:</b> {selectedDetails.radioTwo || "N/A"}</p>
          <p>📏 <b>Line Length:</b> {selectedDetails.lineLength || "N/A"}</p>
          <p>📈 <b>Line Increment:</b> {selectedDetails.lineIncrement || "N/A"}</p>
          <p>📅 <b>Created At:</b> {selectedDetails.createdAt ? new Date(selectedDetails.createdAt).toLocaleString() : "N/A"}</p>
        </div>

        {Array.isArray(selectedDetails.surveyValues) && selectedDetails.surveyValues.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-blue-600 mb-2 text-center">Survey Values</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-300 rounded-lg">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-3 py-2 border-b">#</th>
                    <th className="px-3 py-2 border-b">From</th>
                    <th className="px-3 py-2 border-b">To</th>
                    <th className="px-3 py-2 border-b">Sign</th>
                    <th className="px-3 py-2 border-b">Number</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDetails.surveyValues.map((sv, j) => (
                    <tr key={j} className={j % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 border-b text-center">{j + 1}</td>
                      <td className="px-3 py-2 border-b text-center">{sv.from}</td>
                      <td className="px-3 py-2 border-b text-center">{sv.to}</td>
                      <td className="px-3 py-2 border-b text-center">{sv.sign}</td>
                      <td className="px-3 py-2 border-b text-center">{sv.number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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



    </div>
  );
}

export default Analytics;
