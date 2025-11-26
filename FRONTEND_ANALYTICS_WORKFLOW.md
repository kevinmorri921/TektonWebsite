# 🗺️ Frontend Analytics Workflow - Step by Step

## Overview

The Analytics page (`src/Analytics/Analytics.jsx`) is an interactive map-based survey management system. It allows users to:
- View markers on an interactive Leaflet map
- Upload survey coordinates via JSON files
- View, edit, and manage survey data
- Navigate between markers
- Export survey data
- Delete markers and surveys

**Role-Based Access:**
- 🔒 **Researchers**: View-only access (cannot upload/edit)
- ✏️ **Encoders**: Full access (upload, edit, delete)
- 👨‍💼 **Admins**: Full access (upload, edit, delete)

---

## Complete Workflow Process

### Phase 1: Page Load & Initialization

#### Step 1: Component Mounts
```
User navigates to /analytics
  ↓
ProtectedAdminRoute checks:
├─ Is authenticated? YES
└─ Is admin/encoder? YES
  ↓
Analytics component renders
```

#### Step 2: Check User Role
```javascript
// src/Analytics/Analytics.jsx
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
const userRole = currentUser?.role?.toLowerCase();
const canEditSurvey = userRole && ["encoder", "admin", "super_admin"].includes(userRole);
```

**Role mapping:**
| Role | Can View | Can Upload | Can Edit | Can Delete |
|------|----------|-----------|----------|-----------|
| Researcher | ✅ | ❌ | ❌ | ❌ |
| Encoder | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ |

#### Step 3: Initialize State
```javascript
const [surveyData, setSurveyData] = useState([])        // All markers with surveys
const [selectedMarker, setSelectedMarker] = useState(null)  // Currently selected marker
const [selectedSurvey, setSelectedSurvey] = useState(null)  // Currently selected survey
const [mapView, setMapView] = useState("satellite")     // Map view mode
const [searchQuery, setSearchQuery] = useState("")      // Search filter
const [showSurveyList, setShowSurveyList] = useState(false) // Show popup list
const [showSurveyDetails, setShowSurveyDetails] = useState(false) // Show details modal
// ... plus 10+ more state variables for modals, forms, loading
```

#### Step 4: Load Map
```javascript
useEffect(() => {
  if (mapRef.current) return; // Already initialized
  
  // Initialize Leaflet map centered on Philippines
  const map = L.map("map", { center: [14.5995, 120.9842], zoom: 6 });
  
  // Add base layers
  const baseLayers = {
    normal: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
    satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}")
  };
  
  baseLayers["satellite"].addTo(map);  // Default to satellite
  
  // Add marker clustering
  markersRef.current = L.markerClusterGroup();
  map.addLayer(markersRef.current);
  
  mapRef.current = map;
}, [])
```

**Map features:**
- ✅ Default center: 14.5995, 120.9842 (Philippines)
- ✅ Default zoom: Level 6
- ✅ Default layer: Satellite imagery
- ✅ Marker clustering for performance

#### Step 5: Fetch Markers from Backend
```javascript
useEffect(() => { fetchMarkers(); }, []);

const fetchMarkers = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return showToast("You are not logged in.", "error");

    const res = await axios.get("http://localhost:5000/api/markers", {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Response format:
    // [
    //   {
    //     _id: "xxx",
    //     latitude: 14.5995,
    //     longitude: 120.9842,
    //     surveys: [
    //       {
    //         name: "Survey 1",
    //         radioOne: "value",
    //         radioTwo: "value",
    //         surveyValues: [
    //           { from: "A", to: "B", sign: "+", number: 10 }
    //         ]
    //       }
    //     ]
    //   }
    // ]

    setSurveyData(res.data || []);

    // Auto-pan to latest marker
    if (res.data && res.data.length > 0 && mapRef.current) {
      const latest = res.data[res.data.length - 1];
      const lat = parseFloat(latest.latitude ?? latest.lat);
      const lng = parseFloat(latest.longitude ?? latest.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        mapRef.current.setView([lat, lng], 15);  // Zoom to latest
        setCurrentMarkerIndex(res.data.length - 1);
      }
    }
  } catch (err) {
    showToast("Failed to load markers!", "error");
  }
};
```

**Success flow:**
```
API returns markers
  ↓
setSurveyData with all markers
  ↓
Map pans to latest marker
  ↓
Markers rendered with clustering
```

---

### Phase 2: Map Interaction

#### Step 6: Render Markers on Map

When `surveyData` changes, markers are re-rendered:

```javascript
useEffect(() => { 
  if (!markersRef.current) return; 
  renderMarkers(surveyData); 
}, [surveyData]);

const renderMarkers = (data) => {
  markersRef.current.clearLayers();
  
  data.forEach((point, index) => {
    const lat = parseFloat(point.latitude ?? point.lat);
    const lng = parseFloat(point.longitude ?? point.lng);
    
    // Skip invalid coordinates
    if (isNaN(lat) || isNaN(lng)) return;

    // Create marker at coordinate
    const marker = L.marker([lat, lng]);
    
    // Click handler
    marker.on("click", (e) => {
      activeMarkerLatLng.current = e.latlng;
      mapRef.current.panTo(e.latlng);
      const pt = mapRef.current.latLngToContainerPoint(e.latlng);
      setPopupPos({ left: pt.x + 20, top: pt.y - 10 });
      setSelectedMarker(point);
      setSelectedSurvey(null);
      setShowSurveyList(true);     // Show survey popup
      setShowSurveyDetails(false); // Hide details modal
    });
    
    markersRef.current.addLayer(marker);
  });
};
```

**Marker features:**
- ✅ Clustered for performance
- ✅ Clickable to show surveys
- ✅ Auto-positions popup near marker
- ✅ Skips invalid coordinates

#### Step 7: User Clicks Marker
```
1. User clicks marker on map
   ↓
2. Marker click handler triggered
   ↓
3. Panel:
   ├─ Pans map to marker
   ├─ Calculates popup position
   └─ Gets popup position from map coordinates
   ↓
4. State updates:
   ├─ setSelectedMarker(point)
   ├─ setShowSurveyList(true)  // Show survey list popup
   └─ setShowSurveyDetails(false)
   ↓
5. Popup appears with survey list
```

#### Step 8: View Toggle (Satellite/Normal)

```javascript
<button onClick={() => setMapView((v) => (v === "satellite" ? "normal" : "satellite"))}>
  {mapView === "satellite" ? "Normal View" : "Satellite View"}
</button>

// When mapView changes:
useEffect(() => {
  if (!mapRef.current) return;
  
  // Remove old layer
  Object.values(mapRef.current.baseLayers).forEach((layer) => 
    mapRef.current.removeLayer(layer)
  );
  
  // Add new layer
  mapRef.current.baseLayers[mapView].addTo(mapRef.current);
}, [mapView]);
```

**Map layers:**
- **Satellite** (default): ArcGIS World Imagery
- **Normal**: OpenStreetMap

#### Step 9: Navigate Markers (Previous/Next)

```javascript
// Previous marker button
onClick={() => {
  const prevIndex = (currentMarkerIndex - 1 + surveyData.length) % surveyData.length;
  const prevMarker = surveyData[prevIndex];
  const lat = prevMarker.latitude ?? prevMarker.lat;
  const lng = prevMarker.longitude ?? prevMarker.lng;
  
  if (lat && lng && mapRef.current) {
    mapRef.current.setView([lat, lng], 14);
    setSelectedMarker(prevMarker);
    setCurrentMarkerIndex(prevIndex);
    setShowSurveyList(true);
  }
}}

// Next marker button (similar logic)
```

**Flow:**
```
User clicks "Previous" or "Next"
  ↓
Calculate new marker index (with wraparound)
  ↓
Get coordinates from marker
  ↓
Map pans and zooms to marker
  ↓
Update selected marker
  ↓
Show survey list for new marker
```

---

### Phase 3: Survey List Popup

#### Step 10: Display Survey List Popup

When `showSurveyList` is true and marker is selected:

```jsx
<AnimatePresence>
  {showSurveyList && selectedMarker && (
    <motion.div
      className="absolute z-[3000]"
      style={{ left: popupPos.left, top: popupPos.top }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-5">
        
        {/* Header with survey count */}
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold">Survey List</h3>
            <p className="text-xs text-gray-500">{selectedMarker.name}</p>
          </div>
          
          {canEditSurvey && (
            <button className="...">
              {/* Delete menu: Delete Survey or Delete Marker */}
            </button>
          )}
          
          <button onClick={() => setShowSurveyList(false)}>✕</button>
        </div>

        {/* Search bar */}
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search surveys..."
        />

        {/* Survey list */}
        <div className="space-y-2">
          {selectedMarker.surveys?.map((survey, i) => (
            <div
              key={i}
              onClick={() => {
                setSelectedSurvey(survey.name);
                setShowSurveyList(false);
                setShowSurveyDetails(true);  // Switch to details modal
              }}
              className="cursor-pointer hover:bg-gray-50 p-3 rounded"
            >
              <div className="font-medium">{survey.name}</div>
              <div className="text-xs text-gray-400">{survey.createdAt}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**Features:**
- ✅ Positioned near marker on map
- ✅ Shows all surveys for marker
- ✅ Search filter by survey name
- ✅ Delete menu (for encoders/admins)
- ✅ Click to view survey details

#### Step 11: Search Surveys

```javascript
<input
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search surveys..."
/>

{/* Filtered list */}
{selectedMarker.surveys
  .filter((s) => 
    searchQuery 
      ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) 
      : true
  )
  .map((survey, i) => (...))}
```

**Example:**
- User types "survey"
- List filters to show only surveys with "survey" in name
- Case-insensitive matching

#### Step 12: Click Survey in Popup

```javascript
<div
  onClick={() => {
    setSelectedSurvey(survey.name);      // Set active survey
    setShowSurveyList(false);            // Close popup
    setShowSurveyDetails(true);          // Open details modal
  }}
>
  {survey.name}
</div>
```

**Result:**
- Popup closes
- Details modal opens with full survey information

---

### Phase 4: Survey Details Modal

#### Step 13: Display Survey Details

When `showSurveyDetails` is true:

```jsx
<motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm">
  <div className="bg-white/95 backdrop-blur-xl rounded-2xl w-[800px] h-[500px]">
    
    {/* Title */}
    <h3 className="text-2xl font-bold">{selectedDetails.name}</h3>
    <div className="text-sm text-gray-500">{selectedDetails.createdAt}</div>

    {/* Left side: Survey metadata */}
    <div className="grid grid-cols-[1fr_2fr]">
      <div className="space-y-3">
        <div><b>Radio 1:</b> {selectedDetails.radioOne || "N/A"}</div>
        <div><b>Radio 2:</b> {selectedDetails.radioTwo || "N/A"}</div>
        <div><b>Line Length:</b> {selectedDetails.lineLength || "N/A"}</div>
        <div><b>Line Increment:</b> {selectedDetails.lineIncrement || "N/A"}</div>
        <div><b>Points:</b> {selectedDetails.surveyValues?.length || 0}</div>
        <div><b>Latitude:</b> {selectedMarker.latitude || "N/A"}</div>
        <div><b>Longitude:</b> {selectedMarker.longitude || "N/A"}</div>
      </div>

      {/* Right side: Survey values table */}
      <div className="overflow-auto max-h-[300px]">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>From</th>
              <th>To</th>
              <th>Sign</th>
              <th>Number</th>
              {canEditSurvey && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {selectedDetails.surveyValues?.map((sv, j) => (
              <tr key={j}>
                <td>{j + 1}</td>
                <td>{sv.from}</td>
                <td>{sv.to}</td>
                <td>{sv.sign}</td>
                <td>{sv.number}</td>
                {canEditSurvey && (
                  <td>
                    <button onClick={() => handleEditSurveyValue(j)}>
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Action buttons */}
    <div className="flex gap-3">
      {canEditSurvey && (
        <button onClick={() => { /* open manage modal */ }}>
          Manage
        </button>
      )}
      <button onClick={handleExport}>Export</button>
      <button onClick={() => { /* copy to clipboard */ }}>Copy</button>
      <button onClick={() => setShowSurveyDetails(false)}>Close</button>
    </div>
  </div>
</motion.div>
```

**What's shown:**
- ✅ Survey name and date created
- ✅ Survey metadata (Radio 1/2, Line Length, Line Increment)
- ✅ Survey values table with From/To/Sign/Number
- ✅ Marker coordinates (latitude/longitude)
- ✅ Export button (for download as JSON)
- ✅ Copy button (copy to clipboard)
- ✅ Manage button (for encoders/admins to edit)

#### Step 14: Export Survey Data

```javascript
const handleExport = () => {
  if (!selectedDetails || !selectedMarker) return;
  
  // Build export object
  const exportObj = {
    ...selectedDetails,
    latitude: selectedMarker.latitude ?? selectedMarker.lat ?? null,
    longitude: selectedMarker.longitude ?? selectedMarker.lng ?? null,
  };
  
  // Convert to JSON string
  const dataStr = JSON.stringify(exportObj, null, 2);
  
  // Create blob and download
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${selectedDetails.name || "survey"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  // Log activity
  axios.post(
    "http://localhost:5000/api/activity-log",
    {
      action: "Downloaded File",
      details: `Downloaded survey: ${a.download}`
    },
    { headers: { Authorization: `Bearer ${token}` } }
  ).catch(err => console.error("Failed to log:", err));
};
```

**Export flow:**
```
User clicks "Export"
  ↓
Combine survey data + coordinates
  ↓
Convert to JSON string
  ↓
Create blob
  ↓
Trigger browser download
  ↓
Log activity to backend
  ↓
File saved: survey_name.json
```

#### Step 15: Copy to Clipboard

```javascript
<button onClick={() => {
  try {
    const exportObj = {
      ...selectedDetails,
      latitude: selectedMarker?.latitude ?? selectedMarker?.lat ?? null,
      longitude: selectedMarker?.longitude ?? selectedMarker?.lng ?? null,
    };
    
    // Copy to clipboard
    navigator.clipboard?.writeText(
      JSON.stringify(exportObj, null, 2)
    );
    
    showToast("Copied to clipboard", "success");
  } catch (err) {
    showToast("Failed to copy", "error");
  }
}}>
  Copy
</button>
```

**Result:**
- Survey data (JSON format) copied to clipboard
- User can paste anywhere
- Toast notification confirms

---

### Phase 5: Upload Coordinates

#### Step 16: Access Upload (Encoder/Admin Only)

```jsx
{/* Upload Controls - only visible for Encoders/Admins */}
{userRole && userRole !== "researcher" && (
  <div className="absolute bottom-4 right-4">
    <label className="flex items-center gap-2 bg-white px-6 py-2 rounded cursor-pointer">
      <FilePlus2 className="w-5 h-5" />
      Upload Coordinates
      <input 
        type="file" 
        accept=".json" 
        multiple 
        onChange={handleFileUpload} 
        className="hidden" 
      />
    </label>
  </div>
)}
```

**Availability:**
- ✅ Researchers: Hidden (role check)
- ✅ Encoders: Visible
- ✅ Admins: Visible

#### Step 17: Select and Upload JSON Files

```javascript
async function handleFileUpload(e) {
  // Role check
  if (userRole === "researcher") {
    return showToast("You cannot upload files.", "error");
  }

  const files = e.target.files;
  if (!files?.length) return;

  const token = localStorage.getItem("token");
  if (!token) return showToast("You are not logged in. Cannot upload.", "error");

  const newPoints = [];

  // Step 1: Parse JSON files
  for (const file of files) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const entries = Array.isArray(json) ? json : [json];

      // Step 2: Validate coordinates
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
      showToast(`Failed to parse ${file.name}`, "error");
    }
  }

  if (!newPoints.length) {
    return showToast("No valid coordinates found to upload.", "error");
  }

  // Step 3: Upload each point to backend
  try {
    const uploadedMarkerCount = newPoints.length;
    
    for (const p of newPoints) {
      await axios.post(
        "http://localhost:5000/api/markers",
        p,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    }

    // Step 4: Log activity
    try {
      const markerNames = newPoints
        .map((p) => p.name || "Unnamed")
        .slice(0, 3)
        .join(", ");
      const detailsText = newPoints.length > 3 
        ? `${markerNames}, and ${newPoints.length - 3} more` 
        : markerNames;
      
      await axios.post(
        "http://localhost:5000/api/activity-log",
        {
          action: "Uploaded Marker",
          details: `Uploaded ${uploadedMarkerCount} marker(s): ${detailsText}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    // Step 5: Refresh markers
    await fetchMarkers();
    
    // Step 6: Show success
    showToast("Coordinates uploaded successfully!", "success");
  } catch (err) {
    console.error("Upload error:", err);
    showToast("Failed to save coordinates.", "error");
  }
}
```

**Upload flow:**
```
User selects JSON file(s)
  ↓
Parse JSON content
  ↓
Validate coordinates (latitude/longitude)
  ├─ Valid? → Add to upload list
  └─ Invalid? → Skip with warning
  ↓
For each valid point:
  POST to /api/markers
  ↓
All uploaded successfully
  ↓
Log activity to backend
  ↓
Refresh map with new markers
  ↓
Show success toast
```

**Expected JSON format:**
```json
[
  {
    "latitude": 14.5995,
    "longitude": 120.9842,
    "name": "Survey Location 1",
    "surveys": [
      {
        "name": "Survey A",
        "radioOne": "value",
        "radioTwo": "value",
        "surveyValues": [
          {"from": "A", "to": "B", "sign": "+", "number": 10}
        ]
      }
    ]
  }
]
```

---

### Phase 6: Manage Survey Data

#### Step 18: Open Manage Survey Modal

```javascript
<button onClick={() => {
  setEditMarkerData({
    name: selectedDetails?.name || "",
    radioOne: selectedDetails?.radioOne || "",
    radioTwo: selectedDetails?.radioTwo || "",
    lineLength: selectedDetails?.lineLength || "",
    lineIncrement: selectedDetails?.lineIncrement || "",
  });
  setNewSurveyValue({ from: "", to: "", sign: "", number: "" });
  setEditSurveyValueIndex(null);
  setManageSurveyTab("edit");  // Start on Edit Metadata tab
  setShowManageSurvey(true);   // Open modal
}}>
  Manage
</button>
```

#### Step 19: Edit Survey Metadata

**Tab: Edit Metadata**

```jsx
<div className="space-y-4">
  <input
    label="Survey Name"
    value={editMarkerData.name}
    onChange={(e) => setEditMarkerData({ ...editMarkerData, name: e.target.value })}
  />
  <input
    label="Radio 1"
    value={editMarkerData.radioOne}
    onChange={(e) => setEditMarkerData({ ...editMarkerData, radioOne: e.target.value })}
  />
  <input
    label="Radio 2"
    value={editMarkerData.radioTwo}
    onChange={(e) => setEditMarkerData({ ...editMarkerData, radioTwo: e.target.value })}
  />
  <input
    label="Line Length"
    value={editMarkerData.lineLength}
    onChange={(e) => setEditMarkerData({ ...editMarkerData, lineLength: e.target.value })}
  />
  <input
    label="Line Increment"
    value={editMarkerData.lineIncrement}
    onChange={(e) => setEditMarkerData({ ...editMarkerData, lineIncrement: e.target.value })}
  />
</div>

<button onClick={handleEditMarkerDetails}>
  Save Changes
</button>
```

**Submit handler:**

```javascript
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

    const markerId = selectedMarker._id;
    const surveyIndex = selectedMarker.surveys.findIndex(
      (s) => s.name === selectedSurvey
    );

    if (surveyIndex === -1) {
      showToast("Survey not found", "error");
      return;
    }

    // Build payload (only include non-empty optional fields)
    const updatePayload = { name: editMarkerData.name.trim() };
    if (editMarkerData.radioOne.trim()) 
      updatePayload.radioOne = editMarkerData.radioOne.trim();
    if (editMarkerData.radioTwo.trim()) 
      updatePayload.radioTwo = editMarkerData.radioTwo.trim();
    if (editMarkerData.lineLength.trim()) 
      updatePayload.lineLength = editMarkerData.lineLength.trim();
    if (editMarkerData.lineIncrement.trim()) 
      updatePayload.lineIncrement = editMarkerData.lineIncrement.trim();

    // Send to backend
    const response = await axios.put(
      `http://localhost:5000/api/markers/${markerId}/surveys/${surveyIndex}`,
      updatePayload,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Update local state
    setSurveyData((prevData) =>
      prevData.map((marker) =>
        marker._id === markerId ? response.data.data : marker
      )
    );
    setSelectedMarker(response.data.data);

    // Log activity
    await axios.post(
      "http://localhost:5000/api/activity-log",
      {
        action: "Updated Survey",
        details: `Updated marker details: ${editMarkerData.name}`
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(err => console.error("Failed to log:", err));

    showToast("Survey details updated successfully", "success");

    // Close modal after 500ms
    setTimeout(() => {
      setShowManageSurvey(false);
      setManageSurveyTab("edit");
      setEditSurveyValueIndex(null);
      setEditMarkerData({
        name: "",
        radioOne: "",
        radioTwo: "",
        lineLength: "",
        lineIncrement: ""
      });
    }, 500);
  } catch (err) {
    showToast(err.response?.data?.message || "Failed to update survey details", "error");
  } finally {
    setSubmittingData(false);
  }
};
```

**Flow:**
```
1. User fills in fields
2. Click "Save Changes"
3. Validate name is not empty
4. Send PUT request to /api/markers/:id/surveys/:index
5. Backend updates database
6. Frontend updates state
7. Log activity
8. Show success toast
9. Close modal
```

#### Step 20: Add Survey Values

**Tab: Add Survey Value**

```jsx
<div className="space-y-4">
  <input
    label="From"
    value={newSurveyValue.from}
    onChange={(e) => setNewSurveyValue({ ...newSurveyValue, from: e.target.value })}
  />
  <input
    label="To"
    value={newSurveyValue.to}
    onChange={(e) => setNewSurveyValue({ ...newSurveyValue, to: e.target.value })}
  />
  <input
    label="Sign (e.g., +, -, *, /)"
    value={newSurveyValue.sign}
    onChange={(e) => setNewSurveyValue({ ...newSurveyValue, sign: e.target.value })}
  />
  <input
    label="Number"
    type="number"
    value={newSurveyValue.number}
    onChange={(e) => setNewSurveyValue({ ...newSurveyValue, number: e.target.value })}
    step="0.01"
  />
</div>

<button onClick={handleAddSurveyValue}>
  Add Value
</button>
```

**Submit handler:**

```javascript
const handleAddSurveyValue = async () => {
  // Validation
  if (!newSurveyValue.from.trim() || !newSurveyValue.to.trim() || 
      !newSurveyValue.sign.trim() || !newSurveyValue.number.trim()) {
    showToast("All fields are required", "error");
    return;
  }

  if (isNaN(parseFloat(newSurveyValue.number))) {
    showToast("Number field must be numeric", "error");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    showToast("You are not logged in", "error");
    return;
  }

  try {
    setSubmittingData(true);

    const markerId = selectedMarker._id;
    const surveyIndex = selectedMarker.surveys.findIndex(
      (s) => s.name === selectedSurvey
    );

    if (surveyIndex === -1) {
      showToast("Survey not found", "error");
      return;
    }

    let response;
    const isEditing = editSurveyValueIndex !== null;

    if (isEditing) {
      // Edit existing value
      response = await axios.put(
        `http://localhost:5000/api/markers/${markerId}/surveys/${surveyIndex}/values/${editSurveyValueIndex}`,
        {
          from: newSurveyValue.from.trim(),
          to: newSurveyValue.to.trim(),
          sign: newSurveyValue.sign.trim(),
          number: parseFloat(newSurveyValue.number)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      // Add new value
      response = await axios.put(
        `http://localhost:5000/api/markers/${markerId}/surveys/${surveyIndex}/values`,
        {
          from: newSurveyValue.from.trim(),
          to: newSurveyValue.to.trim(),
          sign: newSurveyValue.sign.trim(),
          number: parseFloat(newSurveyValue.number)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    // Update local state
    setSurveyData((prevData) =>
      prevData.map((marker) =>
        marker._id === markerId ? response.data.data : marker
      )
    );
    setSelectedMarker(response.data.data);

    // Log activity
    const action = isEditing ? "Updated survey value" : "Added survey value";
    await axios.post(
      "http://localhost:5000/api/activity-log",
      {
        action: "Updated Survey",
        details: `${action} in ${selectedDetails?.name} (From: ${newSurveyValue.from}, To: ${newSurveyValue.to}, Sign: ${newSurveyValue.sign}, Number: ${newSurveyValue.number})`
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(err => console.error("Failed to log:", err));

    // Reset form
    setNewSurveyValue({ from: "", to: "", sign: "", number: "" });
    setEditSurveyValueIndex(null);

    const toastMessage = isEditing 
      ? "Survey value updated successfully" 
      : "Survey value added successfully";
    showToast(toastMessage, "success");

    // Close modal
    setTimeout(() => {
      setShowManageSurvey(false);
      setManageSurveyTab("edit");
      setEditSurveyValueIndex(null);
      setNewSurveyValue({ from: "", to: "", sign: "", number: "" });
    }, 500);
  } catch (err) {
    showToast(err.response?.data?.message || "Failed to add/update survey value", "error");
  } finally {
    setSubmittingData(false);
  }
};
```

**Flow:**
```
1. User fills in From/To/Sign/Number
2. Click "Add Value"
3. Validate all fields required
4. Validate number is numeric
5. If editing:
   PUT to /api/markers/:id/surveys/:index/values/:valueIndex
6. If adding new:
   PUT to /api/markers/:id/surveys/:index/values
7. Backend updates database
8. Frontend updates state
9. Log activity
10. Show success toast
11. Reset form
12. Close modal (500ms delay)
```

#### Step 21: Edit Survey Value

In the survey details table:

```javascript
<button onClick={() => handleEditSurveyValue(j)}>
  Edit
</button>

const handleEditSurveyValue = (index) => {
  if (!selectedDetails?.surveyValues || !selectedDetails.surveyValues[index]) {
    showToast("Survey value not found", "error");
    return;
  }
  
  const value = selectedDetails.surveyValues[index];
  
  // Populate form with existing values
  setNewSurveyValue({
    from: value.from?.toString() || "",
    to: value.to?.toString() || "",
    sign: value.sign || "",
    number: value.number?.toString() || ""
  });
  
  // Mark this as edit mode
  setEditSurveyValueIndex(index);
  
  // Switch to Add tab (will show "Update Value" button)
  setManageSurveyTab("add");
  
  // Open modal
  setShowManageSurvey(true);
};
```

**Result:**
- Modal opens on "Add Survey Value" tab
- Form pre-populated with existing values
- Button changes to "Update Value"
- Submit updates existing value instead of adding new

---

### Phase 7: Delete Operations

#### Step 22: Delete Marker

**Trigger:**
```javascript
// From "Delete Marker" option in survey list menu
<button onClick={() => handleDeleteMarker(selectedMarker)}>
  Delete Marker
</button>

const handleDeleteMarker = async (marker) => {
  setMarkerToDelete(marker);
  setShowDeleteConfirm(true);  // Show confirmation modal
};
```

**Confirmation modal:**
```jsx
<motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm">
  <div className="bg-white rounded-2xl">
    <h3>Delete Marker</h3>
    <p>Are you sure you want to delete this marker?</p>
    <p className="text-red-600 bg-red-50">
      ⚠️ This action cannot be undone. All survey data will be permanently deleted.
    </p>
    
    <button onClick={() => {
      setShowDeleteConfirm(false);
      setMarkerToDelete(null);
    }}>
      Cancel
    </button>
    
    <button onClick={confirmDeleteMarker}>
      Delete
    </button>
  </div>
</motion.div>
```

**Confirm delete:**

```javascript
const confirmDeleteMarker = async () => {
  if (!markerToDelete || !markerToDelete._id) {
    showToast("Marker not found", "error");
    return;
  }

  try {
    setDeleting(true);
    const token = localStorage.getItem("token");
    
    // Send DELETE request
    await axios.delete(
      `http://localhost:5000/api/markers/${markerToDelete._id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Remove from local state
    setSurveyData((prevData) =>
      prevData.filter((marker) => marker._id !== markerToDelete._id)
    );

    // Log activity
    const markerName = markerToDelete.name || 
                      markerToDelete.surveys?.[0]?.name || 
                      `${markerToDelete.latitude}, ${markerToDelete.longitude}`;
    
    await axios.post(
      "http://localhost:5000/api/activity-log",
      {
        action: "Deleted Marker",
        details: `Deleted marker: ${markerName}`
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(err => console.error("Failed to log:", err));

    // Close all popups
    setShowSurveyList(false);
    setShowSurveyDetails(false);
    setSelectedMarker(null);
    setSelectedSurvey(null);
    setShowDeleteConfirm(false);
    setMarkerToDelete(null);

    showToast("Marker deleted successfully", "success");
  } catch (err) {
    showToast(err.response?.data?.message || "Failed to delete marker", "error");
  } finally {
    setDeleting(false);
  }
};
```

**Flow:**
```
1. User clicks "Delete Marker"
2. Confirmation modal shows
3. User clicks "Delete"
4. Send DELETE to /api/markers/:id
5. Backend deletes from MongoDB
6. Frontend removes from state
7. Log activity
8. Close all modals
9. Show success toast
10. Map re-renders without marker
```

#### Step 23: Delete Single Survey

```javascript
// From survey details modal
const handleDeleteSurvey = (marker, survey, surveyIndex) => {
  setSurveyToDelete({ marker, survey, surveyIndex });
  setShowDeleteSurveyConfirm(true);
};

const confirmDeleteSurvey = async () => {
  if (!surveyToDelete) return;

  try {
    setDeletingSurvey(true);
    const token = localStorage.getItem("token");
    const { marker, surveyIndex } = surveyToDelete;
    const markerId = marker._id;

    // Send DELETE request
    const response = await axios.delete(
      `http://localhost:5000/api/markers/${markerId}/surveys/${surveyIndex}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Update state with updated marker
    if (response.data.data) {
      setSurveyData((prevData) =>
        prevData.map((m) =>
          m._id === markerId ? response.data.data : m
        )
      );
      setSelectedMarker(response.data.data);
    }

    // Log activity
    const surveyName = surveyToDelete.survey.name || "Unnamed Survey";
    await axios.post(
      "http://localhost:5000/api/activity-log",
      {
        action: "Deleted Survey",
        details: `Deleted survey: ${surveyName}`
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(err => console.error("Failed to log:", err));

    // Close modals
    setShowDeleteSurveyConfirm(false);
    setSurveyToDelete(null);
    setSelectedSurvey(null);

    showToast("Survey deleted successfully", "success");
  } catch (err) {
    showToast(err.response?.data?.message || "Failed to delete survey", "error");
  } finally {
    setDeletingSurvey(false);
  }
};
```

#### Step 24: Delete Multiple Surveys

**Trigger:**
```javascript
// From survey list menu
<button onClick={() => {
  setShowSurveySelector(true);
}}>
  Delete Survey
</button>
```

**Survey selector modal:**
```jsx
<div className="fixed inset-0 bg-black/50">
  <div className="bg-white rounded-2xl">
    <h3>Select Surveys to Delete</h3>
    
    <div className="space-y-2">
      {selectedMarker.surveys?.map((survey, idx) => (
        <label key={idx}>
          <input
            type="checkbox"
            checked={selectedSurveysToDelete.includes(idx)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedSurveysToDelete([...selectedSurveysToDelete, idx]);
              } else {
                setSelectedSurveysToDelete(
                  selectedSurveysToDelete.filter((i) => i !== idx)
                );
              }
            }}
          />
          {survey.name}
        </label>
      ))}
    </div>

    <button onClick={confirmDeleteMultipleSurveys}>
      Delete ({selectedSurveysToDelete.length})
    </button>
  </div>
</div>
```

**Confirm multiple delete:**

```javascript
const confirmDeleteMultipleSurveys = async () => {
  if (!selectedSurveysToDelete || selectedSurveysToDelete.length === 0) {
    showToast("No surveys selected", "error");
    return;
  }

  try {
    setDeletingSurvey(true);
    const token = localStorage.getItem("token");
    const markerId = selectedMarker._id;

    // Sort indices in reverse order so deletion doesn't shift indices
    const sortedIndices = [...selectedSurveysToDelete].sort((a, b) => b - a);
    
    let updatedMarker = null;
    let deletionErrors = [];

    // Delete each survey
    for (const surveyIndex of sortedIndices) {
      try {
        const response = await axios.delete(
          `http://localhost:5000/api/markers/${markerId}/surveys/${surveyIndex}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Keep latest marker data
        if (response.data.data) {
          updatedMarker = response.data.data;
        }
      } catch (err) {
        deletionErrors.push({
          index: surveyIndex,
          error: err.response?.data?.message || err.message
        });
      }
    }

    // All deletions failed
    if (deletionErrors.length === sortedIndices.length) {
      showToast("Failed to delete surveys", "error");
      return;
    }

    // Update state if we have updated marker
    if (updatedMarker) {
      setSurveyData((prevData) =>
        prevData.map((m) =>
          m._id === markerId ? updatedMarker : m
        )
      );
      setSelectedMarker(updatedMarker);
    }

    // Log activity
    const successCount = sortedIndices.length - deletionErrors.length;
    await axios.post(
      "http://localhost:5000/api/activity-log",
      {
        action: "Deleted Surveys",
        details: `Deleted ${successCount} survey(s)`
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(err => console.error("Failed to log:", err));

    // Close modals
    setShowSurveySelector(false);
    setSelectedSurveysToDelete([]);
    setSelectedSurvey(null);

    showToast(`${successCount} survey(s) deleted successfully`, "success");
  } catch (err) {
    showToast("Failed to delete surveys", "error");
  } finally {
    setDeletingSurvey(false);
  }
};
```

**Key feature:** Delete in reverse order so indices don't shift during deletion

---

### Phase 8: Toast Notifications

All operations show toast notifications:

```jsx
<AnimatePresence>
  {toast.show && (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-[9999] ${
        toast.type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      <span>{toast.message}</span>
    </motion.div>
  )}
</AnimatePresence>
```

**Usage:**
```javascript
showToast("Operation successful", "success");  // Green toast
showToast("Operation failed", "error");         // Red toast
// Auto-hides after 3 seconds
```

---

## Complete Analytics Workflow Summary

### User Journey

```
1. User navigates to /analytics
   ↓
2. Page checks role (must be encoder/admin)
   ↓
3. Map loads with marker clustering
   ↓
4. All markers fetched from backend
   ↓
5. User can:
   
   A. View Markers
   ├─ Click marker
   ├─ See survey list popup
   ├─ Search surveys
   └─ Click survey to see details
   
   B. Upload Coordinates (Encoder/Admin only)
   ├─ Select JSON files
   ├─ Parse and validate
   ├─ Send to backend
   ├─ Refresh map
   └─ Show success
   
   C. Manage Survey Data (Encoder/Admin only)
   ├─ Edit metadata (name, radio, line values)
   ├─ Add survey values (From/To/Sign/Number)
   ├─ Edit existing values
   ├─ Log all changes
   └─ Update state
   
   D. Export Data
   ├─ Download as JSON file
   ├─ Copy to clipboard
   └─ Log download activity
   
   E. Delete (Encoder/Admin only)
   ├─ Delete marker (with all surveys)
   ├─ Delete single survey
   ├─ Delete multiple surveys
   ├─ Require confirmation
   └─ Log deletions
   
   F. Navigate Map
   ├─ View toggle (Satellite/Normal)
   ├─ Previous/Next marker buttons
   └─ Pan to marker
   
6. All actions logged to activity log
7. All changes persist to MongoDB
8. Toast notifications confirm/alert user
9. State updates trigger re-renders
10. Map reflects all changes in real-time
```

---

## Key Features

### ✅ Role-Based Access Control
- Researchers: View-only
- Encoders/Admins: Full control

### ✅ Interactive Map
- Leaflet with marker clustering
- Satellite and normal view toggle
- Pan, zoom, click handlers

### ✅ Survey Management
- Create/Edit/Delete operations
- Metadata editing
- Survey values table with edit/delete

### ✅ Data Import/Export
- JSON file upload (with parsing validation)
- JSON file download (with browser download)
- Clipboard copy functionality

### ✅ Activity Logging
- All CRUD operations logged
- Timestamps and user info tracked
- Activity log viewable in Event Log

### ✅ User Feedback
- Toast notifications (success/error)
- Loading states
- Confirmation modals for destructive actions

### ✅ State Management
- Component-level state (useState)
- localStorage for auth
- Refs for map and markers

---

**Last Updated:** November 26, 2025
**Status:** ✅ Complete with Full CRUD Operations
**Version:** 1.0.0
