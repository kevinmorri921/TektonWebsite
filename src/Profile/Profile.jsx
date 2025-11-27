import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bgImage from "../assets/db-pic.jpg";
import { Home, BarChart3, Settings, User, LogOut, Lock, Phone, MapPin, Edit2, Check, X, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Profile = () => {
  const navigate = useNavigate();
  
  // State management
  const [userRole, setUserRole] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  
  // Editing states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [tempContact, setTempContact] = useState("");
  
  // Notification states
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Allowed roles for profile access
  const ALLOWED_ROLES = ["SUPER_ADMIN", "admin", "encoder", "researcher"];

  // ✅ Fetch user data from backend on component mount
  const fetchUserDataFromDB = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found, using localStorage data");
        return;
      }

      // Call endpoint to get current user data
      const response = await axios.get(
        "http://localhost:5000/api/auth/user-profile",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const userData = response.data.user;
        
        // Update state from database
        setFullname(userData.fullname || "");
        setEmail(userData.email || "");
        setAddress(userData.address || "");
        setContactNumber(userData.contactNumber || "");
        
        // Also update localStorage for offline support
        localStorage.setItem("fullname", userData.fullname || "");
        localStorage.setItem("email", userData.email || "");
        localStorage.setItem("userAddress", userData.address || "");
        localStorage.setItem("userContact", userData.contactNumber || "");
        
        console.log("✅ Profile data fetched from DB:", userData);
      }
    } catch (error) {
      console.error("Error fetching user data from DB:", error);
      // Fall back to localStorage data
      setFullname(localStorage.getItem("fullname") || "");
      setEmail(localStorage.getItem("email") || "");
      setAddress(localStorage.getItem("userAddress") || "");
      setContactNumber(localStorage.getItem("userContact") || "");
    }
  };

  // ✅ Check authorization and load data on component mount
  useEffect(() => {
    const initializeProfile = async () => {
      setIsLoading(true);
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const role = currentUser.role || "";
        
        setUserRole(role);
        
        // Get email from localStorage (set during login)
        const storedEmail = localStorage.getItem("email") || "";
        setEmail(storedEmail);
        
        // Check if user role is in allowed list
        if (!ALLOWED_ROLES.includes(role)) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        
        setIsAuthorized(true);
        
        // Fetch from database if available, otherwise use localStorage
        await fetchUserDataFromDB();
      } catch (error) {
        console.error("Error initializing profile:", error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, []);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  // ✅ Validation functions
  const validateAddress = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      showError("Address cannot be empty");
      return false;
    }
    if (trimmed.length < 5) {
      showError("Address must be at least 5 characters long");
      return false;
    }
    if (trimmed.length > 500) {
      showError("Address must not exceed 500 characters");
      return false;
    }
    return true;
  };

  const validateContactNumber = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      showError("Contact number cannot be empty");
      return false;
    }
    // Basic validation: at least 10 digits
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      showError("Contact number must contain at least 10 digits");
      return false;
    }
    if (trimmed.length > 20) {
      showError("Contact number must not exceed 20 characters");
      return false;
    }
    return true;
  };

  // ✅ Edit handlers
  const startEditingAddress = () => {
    setTempAddress(address);
    setIsEditingAddress(true);
    setErrorMessage("");
  };

  const cancelEditAddress = () => {
    setIsEditingAddress(false);
    setTempAddress("");
    setErrorMessage("");
  };

  const startEditingContact = () => {
    setTempContact(contactNumber);
    setIsEditingContact(true);
    setErrorMessage("");
  };

  const cancelEditContact = () => {
    setIsEditingContact(false);
    setTempContact("");
    setErrorMessage("");
  };

  // ✅ Save address to database
  const saveAddress = async () => {
    if (!validateAddress(tempAddress)) {
      return;
    }

    setSaveLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/auth/update-user-details",
        { address: tempAddress.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setAddress(tempAddress.trim());
        localStorage.setItem("userAddress", tempAddress.trim());
        setIsEditingAddress(false);
        showSuccess("✅ Address updated successfully");
      } else {
        showError(response.data.message || "Failed to update address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      if (error.response?.status === 401) {
        showError("Session expired. Please login again.");
        navigate("/login");
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError("Failed to save address. Please try again.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // ✅ Save contact to database
  const saveContact = async () => {
    if (!validateContactNumber(tempContact)) {
      return;
    }

    setSaveLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/auth/update-user-details",
        { contactNumber: tempContact.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setContactNumber(tempContact.trim());
        localStorage.setItem("userContact", tempContact.trim());
        setIsEditingContact(false);
        showSuccess("✅ Contact number updated successfully");
      } else {
        showError(response.data.message || "Failed to update contact number");
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      if (error.response?.status === 401) {
        showError("Session expired. Please login again.");
        navigate("/login");
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError("Failed to save contact number. Please try again.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // ✅ Refresh data from database
  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchUserDataFromDB();
    setIsLoading(false);
    showSuccess("✅ Profile data refreshed");
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to log logout event:", error);
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("fullname");
    localStorage.removeItem("email");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userAddress");
    localStorage.removeItem("userContact");
    navigate("/login");
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FA]">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  // Show authorization error
  if (!isAuthorized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center border border-red-200"
        >
          <Lock size={48} className="mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have permission to access profile settings.</p>
          <p className="text-sm text-gray-500 mb-6">Allowed roles: Super Admin, Admin, Encoder, Researcher</p>
          <p className="text-sm text-gray-700 mb-6">Current role: <span className="font-semibold text-blue-600">{userRole || "Unknown"}</span></p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate("/dashboard")}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Return to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex w-[90%] max-w-[1200px] h-[85vh] bg-[#F8F9FA] rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* SIDEBAR */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-[250px] bg-[#F8F9FA] flex flex-col py-6 px-6 rounded-l-[2rem]"
        >
          <p className="text-xl font-semibold italic text-center text-gray-800 mb-4 mt-6">
            Hi, <span className="font-bold">{fullname || "User"}</span>!
          </p>

          {/* Role Badge */}
          <div className="mb-6 text-center">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              Role: {userRole.replace("_", " ")}
            </span>
          </div>

          <nav className="space-y-5">
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/dashboard")} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium transition"> <Home size={18} /> Dashboard </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/analytics")} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium transition"> <BarChart3 size={18} /> Analytics </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("/settings")} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-[#303345] font-medium transition"> <Settings size={18} /> Settings </motion.button>
          </nav>

          <div className="space-y-4 mt-auto mb-6">
            <div className="border-t border-gray-300" />
            <motion.button whileHover={{ scale: 1.05 }} onClick={handleLogout} className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"> <LogOut size={18} /> Log Out </motion.button>
          </div>
        </motion.aside>

        <div className="w-[1px] bg-gray-300 my-8"></div>

        {/* MAIN CONTENT */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 p-10 bg-[#F8F9FA] overflow-y-auto rounded-r-[2rem]"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#14142B] mb-2">PROFILE</h2>
              <p className="text-sm text-gray-700">View and manage your personal information and account details.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
            >
              <RefreshCw size={16} /> Refresh
            </motion.button>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3"
              >
                <div className="text-green-600 flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-green-800">{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3"
              >
                <div className="text-red-600 flex-shrink-0 mt-0.5">
                  <AlertCircle size={20} />
                </div>
                <p className="text-red-800">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-4xl">
            {/* PERSONAL INFO CARD */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-6 text-[#303345] flex items-center gap-2">
                <User size={20} /> Personal Information
              </h3>
              
              <div className="space-y-6">
                {/* Username - Read Only */}
                <div className="pb-6 border-b border-gray-100">
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <p className="text-base text-gray-800 font-semibold mt-2">{fullname || "Not set"}</p>
                </div>

                {/* Email - Read Only */}
                <div className="pb-6 border-b border-gray-100">
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-base text-gray-800 font-semibold mt-2">{email || "Not set"}</p>
                </div>

                {/* Role - Read Only */}
                <div className="pb-6 border-b border-gray-100">
                  <label className="text-sm font-medium text-gray-600">User Role</label>
                  <div className="mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full">
                      {userRole.replace("_", " ").charAt(0).toUpperCase() + userRole.replace("_", " ").slice(1)}
                    </span>
                  </div>
                </div>

                {/* Address - Editable */}
                <div className="pb-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <MapPin size={16} /> Address
                      </label>
                      {isEditingAddress ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={tempAddress}
                            onChange={(e) => setTempAddress(e.target.value)}
                            placeholder="Enter your address (e.g., 123 Main St, City, State 12345)"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="3"
                          />
                          <p className="text-xs text-gray-500">{tempAddress.length}/500 characters</p>
                        </div>
                      ) : (
                        <p className="text-base text-gray-800 font-semibold mt-2">
                          {address ? <span className="whitespace-pre-wrap">{address}</span> : <span className="text-gray-400 font-normal italic">Not provided</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      {isEditingAddress ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={saveAddress}
                            disabled={saveLoading}
                            className="p-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                            title="Save"
                          >
                            <Check size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={cancelEditAddress}
                            disabled={saveLoading}
                            className="p-2.5 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 transition"
                            title="Cancel"
                          >
                            <X size={18} />
                          </motion.button>
                        </>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={startEditingAddress}
                          className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Number - Editable */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Phone size={16} /> Contact Number
                      </label>
                      {isEditingContact ? (
                        <div className="mt-3 space-y-2">
                          <input
                            type="tel"
                            value={tempContact}
                            onChange={(e) => setTempContact(e.target.value)}
                            placeholder="Enter your contact number (e.g., +1 (555) 123-4567)"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500">{tempContact.length}/20 characters</p>
                        </div>
                      ) : (
                        <p className="text-base text-gray-800 font-semibold mt-2">
                          {contactNumber || <span className="text-gray-400 font-normal italic">Not provided</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      {isEditingContact ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={saveContact}
                            disabled={saveLoading}
                            className="p-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                            title="Save"
                          >
                            <Check size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={cancelEditContact}
                            disabled={saveLoading}
                            className="p-2.5 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 transition"
                            title="Cancel"
                          >
                            <X size={18} />
                          </motion.button>
                        </>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={startEditingContact}
                          className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Info:</strong> Your profile information is securely stored in the database. Changes are saved immediately and will persist across all sessions.
              </p>
            </motion.div>
          </div>
        </motion.main>
      </motion.div>
    </div>
  );
};

export default Profile;