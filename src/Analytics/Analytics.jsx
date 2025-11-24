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

function Analytics() { // <-- receive userRole as prop
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const [surveyData, setSurveyData] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [mapView, setMapView] = useState("satellite");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSurveyList, setShowSurveyList] = useState(false);
  const [showSurveyDetails, setShowSurveyDetails] = useState(false);
  const [popupPos, setPopupPos] = useState({ left: 0, top: 0 });
  const API_URL = "http://localhost:5000/api/markers";
  const activeMarkerLatLng = useRef(null);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0);

   // ✅ Get current user role from localStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const userRole = currentUser?.role?.toLowerCase();
  

  useEffect(() => { fetchMarkers(); }, []);

  const fetchMarkers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("You are not logged in.");

      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSurveyData(res.data || []);

      // Auto-pan and zoom to the latest marker
      if (res.data && res.data.length > 0 && mapRef.current) {
        const latestIndex = res.data.length - 1;
        const latest = res.data[latestIndex];
        const lat = parseFloat(latest.latitude ?? latest.lat);
        const lng = parseFloat(latest.longitude ?? latest.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Use setView with zoom level 15 to center and zoom to latest marker
          mapRef.current.setView([lat, lng], 15);
          setCurrentMarkerIndex(latestIndex);
        }
      }
    } catch (err) {
      console.error('Failed to load markers:', err);
      alert("Failed to load markers!");
    }
  };

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", { center: [14.5995, 120.9842], zoom: 6 });

    const baseLayers = {
      normal: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
      satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"),
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
    if (!markersRef.current) return;
    
    markersRef.current.clearLayers();
    
    if (!Array.isArray(data) || data.length === 0) return;
    
    data.forEach((point, index) => {
      const lat = parseFloat(point.latitude ?? point.lat);
      const lng = parseFloat(point.longitude ?? point.lng);
      
      // Skip invalid coordinates
      if (isNaN(lat) || isNaN(lng)) return;

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
  if (userRole === "researcher") {
    return alert("You cannot upload files.");
  }

  const files = e.target.files;
  if (!files?.length) return;

  const token = localStorage.getItem("token");
  if (!token) return alert("You are not logged in. Cannot upload.");

  const newPoints = [];

  for (const file of files) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const entries = Array.isArray(json) ? json : [json];

      for (const item of entries) {
        const latitude = parseFloat(item.latitude ?? item.lat);
        const longitude = parseFloat(item.longitude ?? item.lng);

        if (isNaN(latitude) || isNaN(longitude)) {
          console.warn(`Skipping invalid coordinates in ${file.name}:`, item);
          continue;
        }

        newPoints.push({ ...item, latitude, longitude });
      }
    } catch (err) {
      console.error("JSON parse error:", err);
      alert(`Failed to parse ${file.name}. Check console for details.`);
    }
  }

  if (!newPoints.length) return alert("No valid coordinates found to upload.");

  try {
    const uploadedMarkerCount = newPoints.length;
    for (const p of newPoints) {
      await axios.post("http://localhost:5000/api/markers", p, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    
    // Log activity
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      const markerNames = newPoints.map((p) => p.name || "Unnamed").slice(0, 3).join(", ");
      const detailsText = newPoints.length > 3 
        ? `${markerNames}, and ${newPoints.length - 3} more` 
        : markerNames;
      
      await axios.post(
        "http://localhost:5000/api/activity-log",
        {
          action: "Uploaded Marker",
          details: `Uploaded ${uploadedMarkerCount} marker(s): ${detailsText}`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
      // Don't fail the upload if logging fails
    }
    
    await fetchMarkers();
    alert("Coordinates uploaded successfully!");
  } catch (err) {
    console.error("Upload error:", err.response ? err.response.data : err.message);
    alert("Failed to save coordinates. Check console for details.");
  }
}



  const handleExport = () => {
    if (!selectedDetails || !selectedMarker) return;
    const exportObj = {
      ...selectedDetails,
      latitude: selectedMarker.latitude ?? selectedMarker.lat ?? null,
      longitude: selectedMarker.longitude ?? selectedMarker.lng ?? null,
    };
    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `${selectedDetails.name || "survey"}.json`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // Log activity (fire and forget)
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .post(
          "http://localhost:5000/api/activity-log",
          {
            action: "Downloaded File",
            details: `Downloaded survey: ${filename}`,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .catch((err) => console.error("Failed to log download activity:", err));
    }
  };

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



      {/*
      {/* Upload Controls (hide for Researcher) *
      {userRole !== "Researcher" && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[2000]">
          <label className="flex items-center justify-center gap-2 bg-[#ffffff] text-[#303345] text-sm px-6 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition cursor-pointer whitespace-nowrap">
            <FilePlus2 className="w-5 h-5" />
            Upload Coordinates
            <input type="file" accept=".json" multiple onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )} */}

      {/* Upload Controls - only visible for Encoders/Admins */}
      {userRole && userRole !== "researcher" && (
  <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[2000]">
    <label className="flex items-center justify-center gap-2 bg-[#ffffff] text-[#303345] text-sm px-6 py-2 rounded-lg shadow hover:bg-[#b0a3a2] transition cursor-pointer whitespace-nowrap">
      <FilePlus2 className="w-5 h-5" />
      Upload Coordinates
      <input type="file" accept=".json" multiple onChange={handleFileUpload} className="hidden" />
    </label>
  </div>
)}





      {/* Survey List Popup */}
      {/* Survey List & Details Popup */}
      {/* Survey List Popup */}
    <AnimatePresence>
      {showSurveyList && selectedMarker && (
        <motion.div
          className="absolute z-[3000]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{ left: popupPos.left, top: popupPos.top, transform: "translate(-50%, -120%)" }}
        >
      <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-200 w-[380px] relative">

        {/* Top row: title + close */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg text-[#303345] font-semibold">Survey List</h3>
            <p className="text-xs text-gray-500 mt-1">{selectedMarker.name || `${(selectedMarker.latitude ?? selectedMarker.lat) || "--"}, ${(selectedMarker.longitude ?? selectedMarker.lng) || "--"}`}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-1">{selectedMarker.surveys ? selectedMarker.surveys.length : 0}</span>
            <ClipboardList className="w-5 h-5" style={{ color: "#303345" }} />
            <button
              onClick={() => setShowSurveyList(false)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition p-1 rounded"
              aria-label="Close survey list"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search surveys..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>

        {/* List */}
        <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {Array.isArray(selectedMarker.surveys) && selectedMarker.surveys.length > 0 ? (
            selectedMarker.surveys
              .filter((s) => (searchQuery ? (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) : true))
              .map((survey, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedSurvey(survey.name);
                    setShowSurveyList(false);
                    setShowSurveyDetails(true);
                  }}
                  className="flex items-center justify-between gap-3 bg-white hover:bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: "#303345" }}>  {(survey.name || `S${i+1}`)[0]} </div>
                    <div className="text-sm">
                      <div className="font-medium text-[#111827]">{survey.name || `Survey ${i + 1}`}</div>
                      <div className="text-xs text-gray-400">{survey.createdAt ? new Date(survey.createdAt).toLocaleDateString() : "No date"}</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">➡</div>
                </div>
              ))
          ) : (
            <div className="text-center text-sm text-gray-500 py-8">No surveys for this marker.</div>
          )}
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
      <div className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-[800px] h-[500px] relative">
        <button
          onClick={() => setShowSurveyDetails(false)}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-600 p-2 rounded"
          aria-label="Close details"
        >
          <X size={20} />
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-blue-600" style={{ color: "#303345" }}>{selectedDetails.name}</h3>
            <div className="text-sm text-gray-500 mt-1">{selectedDetails.createdAt ? new Date(selectedDetails.createdAt).toLocaleString() : "No date"}</div>
          </div>

          <div className="flex flex-col items-end gap-2 mr-12 text-sm opacity-90">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-white px-2.5 py-0.5 rounded text-xs transition"  style={{ backgroundColor: "#303345", color: "white", opacity: 0.9 }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2a2c3b")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#303345")}
            >
              <FilePlus2 className="w-3.5 h-3.5" /> Export
            </button>

               <button
              onClick={() => {
                try {
                  const exportObj = {
                    ...selectedDetails,
                    latitude: selectedMarker?.latitude ?? selectedMarker?.lat ?? null,
                    longitude: selectedMarker?.longitude ?? selectedMarker?.lng ?? null,
                  };
                  navigator.clipboard?.writeText(JSON.stringify(exportObj, null, 2));
                  alert("Copied to clipboard");
                } catch (err) {
                  console.error(err);
                  alert("Failed to copy");
                }
              }}
              className="flex items-center gap-1.5 border border-gray-200 px-2.5 py-0.5 rounded text-xs text-[#303345] transition opacity-90 hover:opacity-100"            >
              <ClipboardList className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-1 mt-5">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-[#303345]"><b>Radio 1:</b><span className="text-gray-700">{selectedDetails.radioOne || "N/A"}</span></div>
            <div className="flex items-center gap-2 text-[#303345]"><b>Radio 2:</b><span className="text-gray-700">{selectedDetails.radioTwo || "N/A"}</span></div>
            <div className="flex items-center gap-2 text-[#303345]"><b>Line Length:</b><span className="text-gray-700">{selectedDetails.lineLength || "N/A"}</span></div>
            <div className="flex items-center gap-2 text-[#303345]"><b>Line Increment:</b><span className="text-gray-700">{selectedDetails.lineIncrement || "N/A"}</span></div>
            <div className="flex items-center gap-2 text-[#303345]"><b>Points:</b><span className="text-gray-700">{Array.isArray(selectedDetails.surveyValues) ? selectedDetails.surveyValues.length : 0}</span></div>
            <div className="flex items-center gap-2 text-[#303345]"><b>Latitude:</b><span className="text-gray-700">{selectedMarker?.latitude ?? selectedMarker?.lat ?? "N/A"}</span></div>
            <div className="flex items-center gap-2 text-[#303345]"><b>Longitude:</b><span className="text-gray-700">{selectedMarker?.longitude ?? selectedMarker?.lng ?? "N/A"}</span></div>
          </div>

          <div>
            {Array.isArray(selectedDetails.surveyValues) && selectedDetails.surveyValues.length > 0 ? (
              <div className="overflow-auto max-h-[300px] border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-[#303345]">#</th>
                      <th className="px-2 py-2 text-[#303345]">From</th>
                      <th className="px-2 py-2 text-[#303345]">To</th>
                      <th className="px-2 py-2 text-[#303345]">Sign</th>
                      <th className="px-2 py-2 text-[#303345]">Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetails.surveyValues.map((sv, j) => (
                      <tr key={j} className={'${j % 2 === 0 ? "bg-white" : "bg-gray-50"} text-gray-500 text-center'}>
                        <td className="px-2 py-1">{j + 1}</td>
                        <td className="px-2 py-1">{sv.from}</td>
                        <td className="px-2 py-1">{sv.to}</td>
                        <td className="px-2 py-1">{sv.sign}</td>
                        <td className="px-2 py-1">{sv.number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">No survey values.</div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-5 justify-end">
          <button
            onClick={() => {
              setShowSurveyDetails(false);
              setShowSurveyList(true);
            }}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            ⬅ Back
          </button>

          <button
            onClick={() => setShowSurveyDetails(false)}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
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





//ALL GOODS
//GOODS NA EXPORT&COPY
//POP UP MODAL
//SURVEY LIST
