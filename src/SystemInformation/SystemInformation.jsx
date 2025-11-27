import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertCircle, CheckCircle, Shield } from "lucide-react";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SystemInformation = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [systemData, setSystemData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ Check authorization on mount
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const role = currentUser?.role?.toLowerCase();
        
        // Only allow Super Admin and Admin
        if (!role || !["super_admin", "admin"].includes(role)) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        setIsAuthorized(true);

        // Check if consent was previously given
        const consentGiven = localStorage.getItem("systemInfoConsent") === "true";
        setHasConsent(consentGiven);
        
        if (consentGiven) {
          await collectAndSendSystemInfo();
          await fetchAnalytics();
        } else {
          setShowConsentBanner(true);
        }
      } catch (err) {
        console.error("Authorization check error:", err);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, []);

  // ✅ Collect system information
  const collectSystemInfo = () => {
    const systemInfo = {
      // Operating System
      os: getOS(),
      
      // Browser
      browser: getBrowserInfo(),
      
      // Screen Resolution
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      
      // Device Type
      deviceType: getDeviceType(),
      
      // CPU Architecture
      cpuArchitecture: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : "N/A",
      
      // Language
      language: navigator.language || navigator.userLanguage || "N/A",
      
      // Timezone
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Network Type
      networkType: getNetworkType(),
      
      // RAM (if available)
      ram: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : "N/A",
      
      // GPU (WebGL)
      gpu: getGPUInfo(),
      
      // User Agent
      userAgent: navigator.userAgent,
      
      // Timestamp
      timestamp: new Date().toISOString(),
    };

    return systemInfo;
  };

  // ✅ Helper: Get Operating System
  const getOS = () => {
    const ua = navigator.userAgent;
    
    if (ua.indexOf("Win") > -1) return "Windows";
    if (ua.indexOf("Mac") > -1) return "macOS";
    if (ua.indexOf("Linux") > -1) return "Linux";
    if (ua.indexOf("Android") > -1) return "Android";
    if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) return "iOS";
    
    return "N/A";
  };

  // ✅ Helper: Get Browser Info
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = "N/A";
    let version = "N/A";

    if (ua.indexOf("Firefox") > -1) {
      browser = "Firefox";
      version = ua.split("Firefox/")[1]?.split(" ")[0] || "N/A";
    } else if (ua.indexOf("Chrome") > -1) {
      browser = "Chrome";
      version = ua.split("Chrome/")[1]?.split(" ")[0] || "N/A";
    } else if (ua.indexOf("Safari") > -1) {
      browser = "Safari";
      version = ua.split("Version/")[1]?.split(" ")[0] || "N/A";
    } else if (ua.indexOf("Edge") > -1) {
      browser = "Edge";
      version = ua.split("Edge/")[1]?.split(" ")[0] || "N/A";
    }

    return { name: browser, version };
  };

  // ✅ Helper: Get Device Type
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk|(android(?!.*mobi))/i.test(ua)) {
      return "Tablet";
    }
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return "Mobile";
    }
    
    return "Desktop";
  };

  // ✅ Helper: Get Network Type
  const getNetworkType = () => {
    if (!navigator.connection) return "N/A";
    
    return navigator.connection.effectiveType || "N/A";
  };

  // ✅ Helper: Get GPU Info
  const getGPUInfo = () => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (err) {
      console.error("GPU detection error:", err);
    }
    
    return "N/A";
  };

  // ✅ Collect and send system info
  const collectAndSendSystemInfo = async () => {
    try {
      const systemInfo = collectSystemInfo();
      setSystemData(systemInfo);

      // Send to backend
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/system-info",
        systemInfo,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage("System information collected successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error collecting system info:", err);
      setError(err.response?.data?.message || "Failed to send system information");
    }
  };

  // ✅ Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        "http://localhost:5000/api/system-info/analytics",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAnalytics(response.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  // ✅ Handle consent
  const handleConsentAccept = async () => {
    localStorage.setItem("systemInfoConsent", "true");
    setHasConsent(true);
    setShowConsentBanner(false);
    
    await collectAndSendSystemInfo();
    await fetchAnalytics();
  };

  const handleConsentReject = () => {
    localStorage.setItem("systemInfoConsent", "false");
    setShowConsentBanner(false);
    setIsLoading(false);
  };

  // Show loading
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
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center border border-red-200"
        >
          <Shield size={48} className="mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">Only Super Admin and Admin users can access this page.</p>
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

  // Show consent banner
  if (!hasConsent) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FA]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg border border-blue-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-blue-600" size={32} />
            <h2 className="text-2xl font-bold text-gray-800">Privacy Notice</h2>
          </div>
          
          <p className="text-gray-700 mb-4">
            This page collects system information including OS, browser, device type, and network details. 
            This data is stored securely and used only for analytics and system monitoring purposes.
          </p>
          
          <p className="text-gray-600 text-sm mb-6">
            Your consent is required to proceed. You can withdraw it at any time from settings.
          </p>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleConsentReject}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Decline
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleConsentAccept}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Accept & Continue
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => navigate("/admin")}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={24} className="text-[#303345]" />
          </motion.button>
          <h1 className="text-3xl font-bold text-[#14142B]">System Information Analytics</h1>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="text-green-600" size={20} />
              <p className="text-green-800">{successMessage}</p>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-red-800">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Container */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">

        {/* Current System Info */}
        {systemData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-extrabold text-[#14142B]">DEVICE INFORMATION</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  collectAndSendSystemInfo();
                  fetchAnalytics();
                }}
                className="px-4 py-2 bg-[#303345] hover:bg-gray-600 text-white rounded-xl transition-colors text-sm font-medium"
              >
                Refresh Data
              </motion.button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-4 px-6 text-gray-600 font-medium">Property</th>
                    <th className="pb-4 px-6 text-gray-600 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">Operating System</td>
                    <td className="py-4 px-6 text-gray-800 text-sm">{systemData.os}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">Browser</td>
                    <td className="py-4 px-6 text-gray-800 text-sm">{systemData.browser.name} {systemData.browser.version}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">Device Type</td>
                    <td className="py-4 px-6 text-gray-800 text-sm">{systemData.deviceType}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">Network Type</td>
                    <td className="py-4 px-6 text-gray-800 text-sm">{systemData.networkType}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">Screen Resolution</td>
                    <td className="py-4 px-6 text-gray-800 text-sm">{systemData.screenResolution}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">CPU Cores</td>
                    <td className="py-4 px-6 text-gray-800 text-sm">{systemData.cpuArchitecture}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">RAM</td>
                    <td className="py-4 px-6 text-gray-800 text-sm">{systemData.ram}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">Language</td>
                    <td className="py-4 px-6 text-gray-800 text-sm">{systemData.language}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">Timezone</td>
                    <td className="py-4 px-6 text-gray-800 text-sm">{systemData.timezone}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">GPU</td>
                    <td className="py-4 px-6 text-gray-800 text-xs break-words">{systemData.gpu?.substring(0, 50) || "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Analytics Summary */}
        {analytics && (
          <div>
            <h2 className="text-2xl font-extrabold text-[#14142B] mb-4">ANALYTICS SUMMARY</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Operating System Stats */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Operating System</h3>
                <div className="space-y-2">
                  {analytics.osUsage?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-xs text-gray-700">{item._id}</span>
                      <span className="text-xs font-semibold text-gray-800 bg-blue-100 px-2 py-1 rounded">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Browser Stats */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Browsers</h3>
                <div className="space-y-2">
                  {analytics.browserUsage?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-xs text-gray-700">{item._id}</span>
                      <span className="text-xs font-semibold text-gray-800 bg-green-100 px-2 py-1 rounded">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Type Stats */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Device Types</h3>
                <div className="space-y-2">
                  {analytics.deviceTypeUsage?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-xs text-gray-700">{item._id}</span>
                      <span className="text-xs font-semibold text-gray-800 bg-yellow-100 px-2 py-1 rounded">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Type Stats */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Network Types</h3>
                <div className="space-y-2">
                  {analytics.networkTypeUsage?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-xs text-gray-700">{item._id}</span>
                      <span className="text-xs font-semibold text-gray-800 bg-purple-100 px-2 py-1 rounded">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Most Used Devices */}
        {analytics?.topDevices && analytics.topDevices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-extrabold text-[#14142B] mb-4">MOST USED DEVICES</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-4 px-6 text-gray-600 font-medium">Device Type</th>
                    <th className="pb-4 px-6 text-gray-600 font-medium">OS</th>
                    <th className="pb-4 px-6 text-gray-600 font-medium">Browser</th>
                    <th className="pb-4 px-6 text-gray-600 font-medium">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.topDevices.map((device, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-gray-800">{device.deviceType}</td>
                      <td className="py-4 px-6 text-gray-800">{device.os}</td>
                      <td className="py-4 px-6 text-gray-800">{device.browser}</td>
                      <td className="py-4 px-6">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {device.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        </div>
      </motion.div>
    </div>
  );
};

// ✅ Helper Component: Info Card
const InfoCard = ({ label, value }) => (
  <motion.div
    whileHover={{ translateY: -2 }}
    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
  >
    <p className="text-xs text-gray-600 font-medium mb-2 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-gray-800 font-semibold break-words">{value}</p>
  </motion.div>
);

export default SystemInformation;
