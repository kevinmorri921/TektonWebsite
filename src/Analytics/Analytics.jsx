import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiClient";
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
  const API_URL = `${API_BASE_URL}/api/markers`;
  const activeMarkerLatLng = useRef(null);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0);
  const [showManageSurvey, setShowManageSurvey] = useState(false);
  const [manageSurveyTab, setManageSurveyTab] = useState("edit"); // "edit" or "add"
  const [editMarkerData, setEditMarkerData] = useState({ name: "", radioOne: "", radioTwo: "", lineLength: "", lineIncrement: "" });
  const [newSurveyValue, setNewSurveyValue] = useState({ from: "", to: "", sign: "", number: "" });
  const [submittingData, setSubmittingData] = useState(false);
  const [editSurveyValueIndex, setEditSurveyValueIndex] = useState(null); // Track which value is being edited
  const [toast, setToast] = useState({ show: false, message: "", type: "success" }); // Toast notification state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Confirmation modal for deletion
  const [markerToDelete, setMarkerToDelete] = useState(null); // Marker pending deletion
  const [deleting, setDeleting] = useState(false); // Loading state for deletion
  const [showDeleteSurveyConfirm, setShowDeleteSurveyConfirm] = useState(false); // Survey deletion confirmation
  const [surveyToDelete, setSurveyToDelete] = useState(null); // Survey pending deletion
  const [deletingSurvey, setDeletingSurvey] = useState(false); // Loading state for survey deletion
  const [openMenuIndex, setOpenMenuIndex] = useState(null); // Tracks which survey's menu is open
  const [showSurveySelector, setShowSurveySelector] = useState(false); // Modal for selecting surveys to delete
  const [selectedSurveysToDelete, setSelectedSurveysToDelete] = useState([]); // Surveys selected for deletion

   // ✅ Get current user role from localStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const userRole = currentUser?.role?.toLowerCase();
  const canEditSurvey = userRole && ["encoder", "admin", "super_admin"].includes(userRole);
  
  console.log("[DEBUG] User role:", userRole, "Can delete:", (userRole === "admin" || userRole === "encoder"));
  
  // Helper function to show toast notification
  const showToast = (message, type = "success") => {
    console.log("[TOAST] Showing toast:", message, type);
    setToast({ show: true, message, type });
    // Use a ref-based timeout to avoid closure issues
    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout);
    }
    window.toastTimeout = setTimeout(() => {
      console.log("[TOAST] Hiding toast");
      setToast({ show: false, message: "", type: "success" });
      delete window.toastTimeout;
    }, 3000);
  };

  // Observe any existing DOM-created notifications (legacy code) and convert them into React toasts
  useEffect(() => {
    // MutationObserver disabled - using pure React toast system now
    // All notifications go through showToast() function
    return () => {};
  }, []);
  

  useEffect(() => { fetchMarkers(); }, []);

  const fetchMarkers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return showToast("You are not logged in.", "error");

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
      showToast("Failed to load markers!", "error");
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
    return showToast("You cannot upload files.", "error");
  }

  const files = e.target.files;
  if (!files?.length) return;

  const token = localStorage.getItem("token");
  if (!token) return showToast("You are not logged in. Cannot upload.", "error");

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
      showToast(`Failed to parse ${file.name}. Check console for details.`, "error");
    }
  }

  if (!newPoints.length) return showToast("No valid coordinates found to upload.", "error");

  try {
    const uploadedMarkerCount = newPoints.length;
    for (const p of newPoints) {
      await axios.post(`${API_BASE_URL}/api/markers`, p, {
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
        `${API_BASE_URL}/api/activity-log`,
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
    
    // Get the first uploaded marker and zoom to it
    if (newPoints.length > 0) {
      const firstMarker = newPoints[0];
      const lat = firstMarker.latitude ?? firstMarker.lat;
      const lng = firstMarker.longitude ?? firstMarker.lng;
      
      if (lat && lng && mapRef.current) {
        // Zoom to the marker location
        mapRef.current.setView([lat, lng], 14);
        
        // Set the marker as selected and show survey list after a brief delay to allow re-render
        setTimeout(() => {
          // Find the marker in surveyData (it should be there after fetchMarkers)
          const uploadedMarker = surveyData.find(
            (m) => (m.latitude ?? m.lat) === lat && (m.longitude ?? m.lng) === lng
          );
          
          if (uploadedMarker) {
            setSelectedMarker(uploadedMarker);
            setSelectedSurvey(null);
            setShowSurveyList(true);
            setShowSurveyDetails(false);
            setCurrentMarkerIndex(surveyData.indexOf(uploadedMarker));
            
            // Calculate popup position based on map container
            const mapContainer = document.getElementById("map");
            if (mapContainer) {
              setPopupPos({
                left: mapContainer.offsetWidth / 2,
                top: mapContainer.offsetHeight / 2,
              });
            }
          }
        }, 100);
      }
    }
    
    showToast("Coordinates uploaded successfully!", "success");
  } catch (err) {
    console.error("Upload error:", err.response ? err.response.data : err.message);
    showToast("Failed to save coordinates. Check console for details.", "error");
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
          `${API_BASE_URL}/api/activity-log`,
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

  const handleManageSurveySubmit = async () => {
    if (manageSurveyTab === "edit") {
      await handleEditMarkerDetails();
    } else {
      await handleAddSurveyValue();
    }
  };

  const handleAddSurveyValue = async () => {
    // Validation
    if (!newSurveyValue.from.trim() || !newSurveyValue.to.trim() || !newSurveyValue.sign.trim() || !newSurveyValue.number.trim()) {
      showToast("All fields are required", "error");
      return;
    }

    if (isNaN(parseFloat(newSurveyValue.number))) {
      showToast("Number field must be numeric", "error");
      return;
    }

    if (!selectedDetails || !selectedMarker) {
      showToast("Please select a survey first", "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("You are not logged in", "error");
      return;
    }

    try {
      setSubmittingData(true);

      // Get the marker ID and survey index
      const markerId = selectedMarker._id;
      const surveyIndex = selectedMarker.surveys.findIndex((s) => s.name === selectedSurvey);

      if (surveyIndex === -1) {
        showToast("Survey not found", "error");
        return;
      }

      let response;
      const isEditing = editSurveyValueIndex !== null;

      // Check if we're editing an existing value or adding a new one
      if (isEditing) {
        // Edit existing value
        console.log("[DEBUG] Editing survey value at index:", editSurveyValueIndex);
        
        response = await axios.put(
          `${API_BASE_URL}/api/markers/${markerId}/surveys/${surveyIndex}/values/${editSurveyValueIndex}`,
          {
            from: newSurveyValue.from.trim(),
            to: newSurveyValue.to.trim(),
            sign: newSurveyValue.sign.trim(),
            number: parseFloat(newSurveyValue.number),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("[SUCCESS] Survey value updated:", response.data);
      } else {
        // Add new value
        response = await axios.put(
          `${API_BASE_URL}/api/markers/${markerId}/surveys/${surveyIndex}/values`,
          {
            from: newSurveyValue.from.trim(),
            to: newSurveyValue.to.trim(),
            sign: newSurveyValue.sign.trim(),
            number: parseFloat(newSurveyValue.number),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("[SUCCESS] Survey value added:", response.data);
      }

      // Capture survey name for logging before updating state
      const surveyNameForLog = selectedDetails?.name || "Unknown Survey";

      // Update local state with new marker data from response
      if (response.data.data) {
        setSurveyData((prevData) =>
          prevData.map((marker) =>
            marker._id === markerId ? response.data.data : marker
          )
        );
        // Also update selectedMarker so selectedDetails re-derives with new data
        setSelectedMarker(response.data.data);
        console.log("[DEBUG] Updated marker data:", response.data.data.surveys);
      }

      // Log activity
      try {
        const action = isEditing ? "Updated survey value" : "Added survey value";
        await axios.post(
          `${API_BASE_URL}/api/activity-log`,
          {
            action: "Updated Survey",
            details: `${action} in ${surveyNameForLog} (From: ${newSurveyValue.from}, To: ${newSurveyValue.to}, Sign: ${newSurveyValue.sign}, Number: ${newSurveyValue.number})`,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (logErr) {
        console.error("Failed to log activity:", logErr);
      }

      // Reset form but keep modal open on the "add" tab so user stays with values
      setNewSurveyValue({ from: "", to: "", sign: "", number: "" });
      setEditSurveyValueIndex(null);
      setManageSurveyTab("add");

      // Show react toast notification
      const toastMessage = isEditing ? "Survey value updated successfully" : "Survey value added successfully";
      console.log("[HANDLE_ADD] Calling showToast with message:", toastMessage);
      showToast(toastMessage, "success");

      // Close the modal after a short delay so user sees the success toast
      setTimeout(() => {
        setShowManageSurvey(false);
        setManageSurveyTab("edit");
        setEditSurveyValueIndex(null);
        setNewSurveyValue({ from: "", to: "", sign: "", number: "" });
      }, 500);
    } catch (err) {
      console.error("[ERROR] Error adding/updating survey value:", err.response?.data || err.message);
      showToast(err.response?.data?.message || "Failed to add/update survey value", "error");
    } finally {
      setSubmittingData(false);
    }
  };

  const handleEditMarkerDetails = async () => {
    // Validation
    if (!editMarkerData.name.trim()) {
      showToast("Marker name is required", "error");
      return;
    }

    if (!selectedMarker) {
      showToast("No marker selected", "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("You are not logged in", "error");
      return;
    }

    try {
      setSubmittingData(true);

      // Get the marker ID and survey index
      const markerId = selectedMarker._id;
      const surveyIndex = selectedMarker.surveys.findIndex((s) => s.name === selectedSurvey);
      
      console.log("[DEBUG] Edit Marker Details:", {
        markerId,
        surveyIndex,
        selectedSurvey,
        totalSurveys: selectedMarker.surveys?.length,
        editData: editMarkerData,
      });

      // Validate survey index
      if (surveyIndex === -1) {
        console.error("Survey not found in marker surveys");
        showToast("Survey not found. Please refresh and try again", "error");
        return;
      }

      // Update the survey details in the backend
      const updatePayload = {
        name: editMarkerData.name.trim(),
      };
      
      // Only include optional fields if they have values
      if (editMarkerData.radioOne.trim()) updatePayload.radioOne = editMarkerData.radioOne.trim();
      if (editMarkerData.radioTwo.trim()) updatePayload.radioTwo = editMarkerData.radioTwo.trim();
      if (editMarkerData.lineLength.trim()) updatePayload.lineLength = editMarkerData.lineLength.trim();
      if (editMarkerData.lineIncrement.trim()) updatePayload.lineIncrement = editMarkerData.lineIncrement.trim();
      
      console.log("[DEBUG] Sending payload:", updatePayload);

      const response = await axios.put(
        `${API_BASE_URL}/api/markers/${markerId}/surveys/${surveyIndex}`,
        updatePayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("[SUCCESS] Update response:", response.data);

      // Update local state with new marker data from response
      if (response.data.data) {
        setSurveyData((prevData) =>
          prevData.map((marker) =>
            marker._id === markerId ? response.data.data : marker
          )
        );
        // Also update selectedMarker so selectedDetails re-derives with new data
        setSelectedMarker(response.data.data);
        console.log("[DEBUG] Updated marker data after metadata edit:", response.data.data.surveys);
      }

      // Log activity
      try {
        await axios.post(
          `${API_BASE_URL}/api/activity-log`,
          {
            action: "Updated Survey",
            details: `Updated marker details: ${editMarkerData.name}`,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (logErr) {
        console.error("Failed to log activity:", logErr);
      }

      // Show success notification
      showToast("Survey details updated successfully", "success");

      // Close modal and reset state shortly after showing notification
      setTimeout(() => {
        setShowManageSurvey(false);
        setManageSurveyTab("edit");
        setEditSurveyValueIndex(null);
        setEditMarkerData({ name: "", radioOne: "", radioTwo: "", lineLength: "", lineIncrement: "" });
      }, 500);
    } catch (err) {
      console.error("[ERROR] Full error object:", err);
      console.error("[ERROR] Response data:", err.response?.data);
      console.error("[ERROR] Response status:", err.response?.status);
      console.error("[ERROR] Message:", err.message);
      showToast(err.response?.data?.message || "Failed to update survey details", "error");
    } finally {
      setSubmittingData(false);
    }
  };

  const handleDeleteMarker = async (marker) => {
    setMarkerToDelete(marker);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMarker = async () => {
    if (!markerToDelete || !markerToDelete._id) {
      showToast("Marker not found", "error");
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not logged in", "error");
        return;
      }

      // Call DELETE endpoint
      const response = await axios.delete(
        `${API_BASE_URL}/api/markers/${markerToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("[DELETE] Marker deleted successfully:", response.data);

      // Remove marker from local state
      setSurveyData((prevData) =>
        prevData.filter((marker) => marker._id !== markerToDelete._id)
      );

      // Log activity
      try {
        const markerName = markerToDelete.name || 
                          markerToDelete.surveys?.[0]?.name || 
                          `${markerToDelete.latitude}, ${markerToDelete.longitude}`;
        
        await axios.post(
          `${API_BASE_URL}/api/activity-log`,
          {
            action: "Deleted Marker",
            details: `Deleted marker: ${markerName}`,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (logErr) {
        console.error("Failed to log activity:", logErr);
      }

      // Close all popups and reset state
      setShowSurveyList(false);
      setShowSurveyDetails(false);
      setSelectedMarker(null);
      setSelectedSurvey(null);
      setShowDeleteConfirm(false);
      setMarkerToDelete(null);

      // Show success toast
      showToast("Marker deleted successfully", "success");
    } catch (err) {
      console.error("[ERROR] Error deleting marker:", err.response?.data || err.message);
      showToast(err.response?.data?.message || "Failed to delete marker", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSurvey = (marker, survey, surveyIndex) => {
    setSurveyToDelete({ marker, survey, surveyIndex });
    setShowDeleteSurveyConfirm(true);
  };

  const confirmDeleteSurvey = async () => {
    if (!surveyToDelete || !surveyToDelete.marker || !surveyToDelete.survey) {
      showToast("Survey not found", "error");
      return;
    }

    try {
      setDeletingSurvey(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not logged in", "error");
        return;
      }

      const { marker, surveyIndex } = surveyToDelete;
      const markerId = marker._id;

      // Call DELETE endpoint for survey
      const response = await axios.delete(
        `${API_BASE_URL}/api/markers/${markerId}/surveys/${surveyIndex}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("[DELETE SURVEY] Survey deleted successfully:", response.data);

      // Update local state with the updated marker
      if (response.data.data) {
        setSurveyData((prevData) =>
          prevData.map((m) =>
            m._id === markerId ? response.data.data : m
          )
        );
        setSelectedMarker(response.data.data);
      }

      // Log activity
      try {
        const surveyName = surveyToDelete.survey.name || "Unnamed Survey";
        await axios.post(
          `${API_BASE_URL}/api/activity-log`,
          {
            action: "Deleted Survey",
            details: `Deleted survey: ${surveyName} from marker ${marker.name || `${marker.latitude}, ${marker.longitude}`}`,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (logErr) {
        console.error("Failed to log activity:", logErr);
      }

      // Close confirmation and reset
      setShowDeleteSurveyConfirm(false);
      setSurveyToDelete(null);
      setSelectedSurvey(null);

      // Show success toast
      showToast("Survey deleted successfully", "success");
    } catch (err) {
      console.error("[ERROR] Error deleting survey:", err.response?.data || err.message);
      showToast(err.response?.data?.message || "Failed to delete survey", "error");
    } finally {
      setDeletingSurvey(false);
    }
  };

  const handleEditSurveyValue = (index) => {
    if (!selectedDetails || !selectedDetails.surveyValues || !selectedDetails.surveyValues[index]) {
      showToast("Survey value not found", "error");
      return;
    }
    const value = selectedDetails.surveyValues[index];
    setNewSurveyValue({
      from: value.from?.toString() || "",
      to: value.to?.toString() || "",
      sign: value.sign || "",
      number: value.number?.toString() || "",
    });
    setEditSurveyValueIndex(index);
    setManageSurveyTab("add");
    setShowManageSurvey(true);
  };

  const confirmDeleteMultipleSurveys = async () => {
    if (!selectedSurveysToDelete || selectedSurveysToDelete.length === 0) {
      showToast("No surveys selected", "error");
      return;
    }

    try {
      setDeletingSurvey(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not logged in", "error");
        setDeletingSurvey(false);
        return;
      }

      const markerId = selectedMarker._id;
      
      // Delete surveys in reverse order so indices don't shift
      const sortedIndices = [...selectedSurveysToDelete].sort((a, b) => b - a);
      let updatedMarker = null;
      let deletionErrors = [];
      
      console.log(`[DELETE SURVEY] Starting deletion of ${sortedIndices.length} survey(s) in reverse order:`, sortedIndices);
      
      for (const surveyIndex of sortedIndices) {
        try {
          console.log(`[DELETE SURVEY] Attempting to delete survey at index ${surveyIndex}`);
          
          const response = await axios.delete(
            `${API_BASE_URL}/api/markers/${markerId}/surveys/${surveyIndex}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          console.log(`[DELETE SURVEY] Response received:`, response);
          console.log(`[DELETE SURVEY] Response status: ${response.status}`);
          console.log(`[DELETE SURVEY] Response data:`, response.data);

          // Check if response has data
          if (response.status === 200 && response.data) {
            // The response.data should contain the updated marker directly
            updatedMarker = response.data.data || response.data;
            console.log(`[DELETE SURVEY] Successfully extracted marker data:`, updatedMarker);
          } else {
            console.error(`[DELETE SURVEY] Unexpected response format`);
            deletionErrors.push({
              index: surveyIndex,
              error: "Unexpected response format"
            });
          }
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message || "Unknown error";
          const errorStatus = err.response?.status || "unknown";
          console.error(`[ERROR] Error deleting survey at index ${surveyIndex}:`, {
            status: errorStatus,
            statusText: err.response?.statusText,
            data: err.response?.data,
            message: err.message
          });
          deletionErrors.push({
            index: surveyIndex,
            error: errorMsg,
            status: errorStatus
          });
        }
      }

      console.log(`[DELETE SURVEY] Deletion summary:`, {
        totalAttempted: sortedIndices.length,
        totalErrors: deletionErrors.length,
        errors: deletionErrors,
        updatedMarker: updatedMarker ? "YES" : "NO"
      });

      // If all deletions failed, show error
      if (deletionErrors.length === sortedIndices.length) {
        console.error(`[ERROR] All deletions failed:`, deletionErrors);
        showToast(`Failed to delete surveys: ${deletionErrors[0]?.error || "Unknown error"}`, "error");
        setDeletingSurvey(false);
        return;
      }

      // Update local state with the latest marker data after successful deletions
      if (updatedMarker) {
        console.log(`[DELETE SURVEY] Updating survey data state with marker:`, updatedMarker);
        setSurveyData((prevData) =>
          prevData.map((m) =>
            m._id === markerId ? updatedMarker : m
          )
        );
        setSelectedMarker(updatedMarker);
        console.log(`[DELETE SURVEY] State updated successfully`);
      } else {
        console.warn(`[DELETE SURVEY] No updated marker received, attempting to refetch...`);
        // Refetch the marker data if we didn't get it from response
        try {
          const refreshResponse = await axios.get(
            `${API_BASE_URL}/api/markers/${markerId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log(`[DELETE SURVEY] Refetch response:`, refreshResponse.data);
          if (refreshResponse.data) {
            setSurveyData((prevData) =>
              prevData.map((m) =>
                m._id === markerId ? refreshResponse.data : m
              )
            );
            setSelectedMarker(refreshResponse.data);
          }
        } catch (refreshErr) {
          console.error(`[ERROR] Failed to refresh marker data:`, refreshErr.message);
        }
      }

      // Log activity
      try {
        const successCount = sortedIndices.length - deletionErrors.length;
        await axios.post(
          `${API_BASE_URL}/api/activity-log`,
          {
            action: "Deleted Surveys",
            details: `Deleted ${successCount} survey(s) from marker ${selectedMarker.name || `${selectedMarker.latitude}, ${selectedMarker.longitude}`}`,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (logErr) {
        console.error("Failed to log activity:", logErr.message);
      }

      // Show success toast
      const successCount = sortedIndices.length - deletionErrors.length;
      showToast(`${successCount} survey(s) deleted successfully`, "success");

      // Close modal and reset after showing toast
      setShowSurveySelector(false);
      setSelectedSurveysToDelete([]);
      setSelectedSurvey(null);
    } catch (err) {
      console.error("[ERROR] Unexpected error deleting surveys:", err);
      showToast("Failed to delete surveys", "error");
    } finally {
      setDeletingSurvey(false);
    }
  };

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
      Upload JSON file
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
      <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-200 w-[380px] relative" onClick={() => setOpenMenuIndex(null)}>

        {/* Top row: title + close */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg text-[#303345] font-semibold">Survey List</h3>
            <p className="text-xs text-gray-500 mt-1">{selectedMarker.name || `${(selectedMarker.latitude ?? selectedMarker.lat) || "--"}, ${(selectedMarker.longitude ?? selectedMarker.lng) || "--"}`}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-1">{selectedMarker.surveys ? selectedMarker.surveys.length : 0}</span>
            <ClipboardList className="w-5 h-5" style={{ color: "#303345" }} />
            
            {canEditSurvey && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuIndex(openMenuIndex === null ? "header" : null);
                  }}
                  className="text-gray-500 hover:text-gray-700 transition p-1 rounded hover:bg-gray-100"
                  aria-label="More options"
                  title="More options"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {openMenuIndex === "header" && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[5000] py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSurveySelector(true);
                        setOpenMenuIndex(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Survey
                    </button>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMarker(selectedMarker);
                        setOpenMenuIndex(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Marker
                    </button>
                  </div>
                )}
              </div>
            )}
            
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
                  showToast("Copied to clipboard", "success");
                } catch (err) {
                  console.error(err);
                  showToast("Failed to copy", "error");
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
                      {canEditSurvey && <th className="px-2 py-2 text-[#303345]">Action</th>}
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
                        {canEditSurvey && (
                          <td className="px-2 py-1">
                            <button
                              onClick={() => handleEditSurveyValue(j)}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                            >
                              Edit
                            </button>
                          </td>
                        )}
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

        <div className="flex gap-3 mt-5 justify-between">
          <div>
            {canEditSurvey && (
              <button
                onClick={() => {
                  setEditMarkerData({
                    name: selectedDetails?.name || "",
                    radioOne: selectedDetails?.radioOne || "",
                    radioTwo: selectedDetails?.radioTwo || "",
                    lineLength: selectedDetails?.lineLength || "",
                    lineIncrement: selectedDetails?.lineIncrement || "",
                  });
                  setNewSurveyValue({ from: "", to: "", sign: "", number: "" });
                  setEditSurveyValueIndex(null);
                  setManageSurveyTab("edit");
                  setShowManageSurvey(true);
                }}
                className="flex items-center gap-1.5 border border-purple-500 px-3 py-1.5 rounded text-sm text-purple-600 transition hover:bg-purple-50"
              >
                <FilePlus2 className="w-4 h-4" /> Manage
              </button>
            )}
          </div>

          <div className="flex gap-3">
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
      </div>
    </motion.div>
  )}
</AnimatePresence>

{/* Unified Manage Survey Modal (Edit Metadata + Add Values) */}
<AnimatePresence>
  {showManageSurvey && selectedDetails && selectedMarker && (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[3000]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-[#303345]">Manage Survey</h3>
          <button
            onClick={() => {
              setShowManageSurvey(false);
              setManageSurveyTab("edit");
              setEditSurveyValueIndex(null);
              setEditMarkerData({ name: "", radioOne: "", radioTwo: "", lineLength: "", lineIncrement: "" });
              setNewSurveyValue({ from: "", to: "", sign: "", number: "" });
            }}
            className="text-gray-600 hover:text-red-600 p-2 rounded"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Context Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <b>Marker:</b> {selectedMarker?.name || selectedMarker?.surveys?.[0]?.name || "N/A"}<br />
            <b>Survey:</b> {selectedDetails?.name || "N/A"}<br />
            <b>Coordinates:</b> {selectedMarker?.latitude ?? "N/A"}, {selectedMarker?.longitude ?? "N/A"}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setManageSurveyTab("edit")}
            className={`px-4 py-2 font-semibold transition ${
              manageSurveyTab === "edit"
                ? "text-[#303345] border-b-2 border-[#303345]"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Edit Metadata
          </button>
          <button
            onClick={() => {
              setManageSurveyTab("add");
              setEditSurveyValueIndex(null);
              setNewSurveyValue({ from: "", to: "", sign: "", number: "" });
            }}
            className={`px-4 py-2 font-semibold transition ${
              manageSurveyTab === "add"
                ? "text-[#303345] border-b-2 border-[#303345]"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {editSurveyValueIndex !== null ? "Edit Survey Value" : "Add Survey Value"}
          </button>
        </div>

        {/* Edit Metadata Tab */}
        {manageSurveyTab === "edit" && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Survey Name</label>
              <input
                type="text"
                value={editMarkerData.name}
                onChange={(e) => setEditMarkerData({ ...editMarkerData, name: e.target.value })}
                placeholder="Enter survey name..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radio 1</label>
              <input
                type="text"
                value={editMarkerData.radioOne}
                onChange={(e) => setEditMarkerData({ ...editMarkerData, radioOne: e.target.value })}
                placeholder="Enter radio 1 value (optional)..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radio 2</label>
              <input
                type="text"
                value={editMarkerData.radioTwo}
                onChange={(e) => setEditMarkerData({ ...editMarkerData, radioTwo: e.target.value })}
                placeholder="Enter radio 2 value (optional)..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Line Length</label>
              <input
                type="text"
                value={editMarkerData.lineLength}
                onChange={(e) => setEditMarkerData({ ...editMarkerData, lineLength: e.target.value })}
                placeholder="Enter line length (optional)..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Line Increment</label>
              <input
                type="text"
                value={editMarkerData.lineIncrement}
                onChange={(e) => setEditMarkerData({ ...editMarkerData, lineIncrement: e.target.value })}
                placeholder="Enter line increment (optional)..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Add Survey Value Tab */}
        {manageSurveyTab === "add" && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="text"
                value={newSurveyValue.from}
                onChange={(e) => setNewSurveyValue({ ...newSurveyValue, from: e.target.value })}
                placeholder="Enter 'from' value..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="text"
                value={newSurveyValue.to}
                onChange={(e) => setNewSurveyValue({ ...newSurveyValue, to: e.target.value })}
                placeholder="Enter 'to' value..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sign</label>
              <input
                type="text"
                value={newSurveyValue.sign}
                onChange={(e) => setNewSurveyValue({ ...newSurveyValue, sign: e.target.value })}
                placeholder="Enter sign (e.g., +, -, *, /)..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
              <input
                type="number"
                value={newSurveyValue.number}
                onChange={(e) => setNewSurveyValue({ ...newSurveyValue, number: e.target.value })}
                placeholder="Enter numeric value..."
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setShowManageSurvey(false);
              setManageSurveyTab("edit");
              setEditSurveyValueIndex(null);
              setEditMarkerData({ name: "", radioOne: "", radioTwo: "", lineLength: "", lineIncrement: "" });
              setNewSurveyValue({ from: "", to: "", sign: "", number: "" });
            }}
            disabled={submittingData}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleManageSurveySubmit}
            disabled={submittingData}
            className="flex-1 px-4 py-2 bg-[#303345] text-white rounded-lg hover:bg-[#2a2c3b] transition font-medium disabled:opacity-50"
          >
            {submittingData
              ? manageSurveyTab === "edit"
                ? "Saving..."
                : "Adding..."
              : manageSurveyTab === "edit"
              ? "Save Changes"
              : editSurveyValueIndex !== null
              ? "Update Value"
              : "Add Value"}
          </button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

    {/* Survey Selector Modal - For Deleting Multiple Surveys */}
    <AnimatePresence>
      {showSurveySelector && selectedMarker && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[4000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
          >
            <h3 className="text-xl font-bold text-[#303345] mb-4">Select Surveys to Delete</h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Check the surveys you want to delete from <strong>{selectedMarker.name || "this marker"}</strong>
            </p>

            <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg p-3">
              {Array.isArray(selectedMarker.surveys) && selectedMarker.surveys.length > 0 ? (
                selectedMarker.surveys.map((survey, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSurveysToDelete.includes(idx)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSurveysToDelete([...selectedSurveysToDelete, idx]);
                        } else {
                          setSelectedSurveysToDelete(selectedSurveysToDelete.filter((i) => i !== idx));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{survey.name || `Survey ${idx + 1}`}</div>
                      <div className="text-xs text-gray-500">
                        {survey.createdAt ? new Date(survey.createdAt).toLocaleDateString() : "No date"}
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">No surveys available</div>
              )}
            </div>

            <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg">
              ⚠️ This action cannot be undone. Selected surveys will be permanently deleted.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSurveySelector(false);
                  setSelectedSurveysToDelete([]);
                }}
                disabled={deletingSurvey}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMultipleSurveys}
                disabled={deletingSurvey || selectedSurveysToDelete.length === 0}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {deletingSurvey ? "Deleting..." : `Delete (${selectedSurveysToDelete.length})`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Delete Confirmation Modal */}
    <AnimatePresence>
      {showDeleteConfirm && markerToDelete && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[4000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]"
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
          >
            <h3 className="text-xl font-bold text-[#303345] mb-4">Delete Marker</h3>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this marker?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                {markerToDelete.name || markerToDelete.surveys?.[0]?.name || `${markerToDelete.latitude}, ${markerToDelete.longitude}`}
              </span>
            </p>

            <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg">
              ⚠️ This action cannot be undone. All survey data for this marker will be permanently deleted.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMarkerToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMarker}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Delete Survey Confirmation Modal */}
    <AnimatePresence>
      {showDeleteSurveyConfirm && surveyToDelete && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[4000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]"
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
          >
            <h3 className="text-xl font-bold text-[#303345] mb-4">Delete Survey</h3>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this survey?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                {surveyToDelete.survey.name || "Unnamed Survey"}
              </span>
            </p>

            <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg">
              ⚠️ This action cannot be undone. All survey values and metadata will be permanently deleted.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteSurveyConfirm(false);
                  setSurveyToDelete(null);
                }}
                disabled={deletingSurvey}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSurvey}
                disabled={deletingSurvey}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {deletingSurvey ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Toast Notification */}
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-[9999] flex items-center space-x-2 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{toast.message}</span>
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
