import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, X } from "lucide-react";

const SystemInformationModal = ({ isOpen, onClose }) => {
  const [hasConsent, setHasConsent] = useState(false);
  const [systemData, setSystemData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const consentGiven = localStorage.getItem("systemInfoConsent") === "true";
      setHasConsent(consentGiven);
      
      if (consentGiven) {
        collectAndSendSystemInfo();
        fetchAnalytics();
      }
    }
  }, [isOpen]);

  const collectSystemInfo = () => {
    const systemInfo = {
      os: getOS(),
      browser: getBrowserInfo(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      deviceType: getDeviceType(),
      cpuArchitecture: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : "N/A",
      language: navigator.language || navigator.userLanguage || "N/A",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      networkType: getNetworkType(),
      ram: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : "N/A",
      gpu: getGPUInfo(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    return systemInfo;
  };

  const getOS = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf("Win") > -1) return "Windows";
    if (ua.indexOf("Mac") > -1) return "macOS";
    if (ua.indexOf("Linux") > -1) return "Linux";
    if (ua.indexOf("Android") > -1) return "Android";
    if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) return "iOS";
    return "N/A";
  };

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

  const getNetworkType = () => {
    if (!navigator.connection) return "N/A";
    return navigator.connection.effectiveType || "N/A";
  };

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

  const collectAndSendSystemInfo = async () => {
    try {
      setIsLoading(true);
      const systemInfo = collectSystemInfo();
      setSystemData(systemInfo);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/system-info`,
        systemInfo,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage("System information collected successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error collecting system info:", err);
      setError(err.response?.data?.message || "Failed to send system information");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${API_BASE_URL}/api/system-info/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAnalytics(response.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const handleConsentAccept = async () => {
    localStorage.setItem("systemInfoConsent", "true");
    setHasConsent(true);
    await collectAndSendSystemInfo();
    await fetchAnalytics();
  };

  const handleConsentReject = () => {
    localStorage.setItem("systemInfoConsent", "false");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh]"
      >
        <div className="space-y-4 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-extrabold text-[#14142B]">SYSTEM INFORMATION</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              collectAndSendSystemInfo();
              fetchAnalytics();
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-[#303345] hover:bg-gray-600 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={onClose}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <X size={20} className="text-gray-700" />
          </motion.button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="text-green-600" size={20} />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </motion.div>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-800 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consent Banner */}
      {!hasConsent ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="text-blue-600" size={20} />
            <h3 className="font-bold text-blue-900">Privacy Notice</h3>
          </div>
          <p className="text-blue-800 text-sm mb-3">
            This collects system information (OS, browser, device type, network details) for analytics purposes only.
          </p>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleConsentReject}
              className="flex-1 px-3 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium text-sm"
            >
              Decline
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleConsentAccept}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Accept"}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Current System Info Table */}
          {systemData && (
            <div>
              <h3 className="text-lg font-extrabold text-[#14142B] mb-3">DEVICE INFORMATION</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 px-4 text-gray-600 font-medium">Property</th>
                      <th className="pb-3 px-4 text-gray-600 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">Operating System</td>
                      <td className="py-3 px-4 text-gray-800 text-sm">{systemData.os}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">Browser</td>
                      <td className="py-3 px-4 text-gray-800 text-sm">{systemData.browser.name} {systemData.browser.version}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">Device Type</td>
                      <td className="py-3 px-4 text-gray-800 text-sm">{systemData.deviceType}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">Network Type</td>
                      <td className="py-3 px-4 text-gray-800 text-sm">{systemData.networkType}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">Resolution</td>
                      <td className="py-3 px-4 text-gray-800 text-sm">{systemData.screenResolution}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">CPU</td>
                      <td className="py-3 px-4 text-gray-800 text-sm">{systemData.cpuArchitecture}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">RAM</td>
                      <td className="py-3 px-4 text-gray-800 text-sm">{systemData.ram}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">Language</td>
                      <td className="py-3 px-4 text-gray-800 text-sm">{systemData.language}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">Timezone</td>
                      <td className="py-3 px-4 text-gray-800 text-sm">{systemData.timezone}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">GPU</td>
                      <td className="py-3 px-4 text-gray-800 text-xs break-words">{systemData.gpu?.substring(0, 40) || "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Summary */}
          {analytics && (
            <div>
              <h3 className="text-lg font-extrabold text-[#14142B] mb-3">ANALYTICS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Operating System Stats */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Operating System</h4>
                  <div className="space-y-1">
                    {analytics.osUsage?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">{item._id}</span>
                        <span className="text-xs font-semibold text-gray-800 bg-blue-100 px-2 py-0.5 rounded">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Browser Stats */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Browsers</h4>
                  <div className="space-y-1">
                    {analytics.browserUsage?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">{item._id}</span>
                        <span className="text-xs font-semibold text-gray-800 bg-green-100 px-2 py-0.5 rounded">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Type Stats */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Device Types</h4>
                  <div className="space-y-1">
                    {analytics.deviceTypeUsage?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">{item._id}</span>
                        <span className="text-xs font-semibold text-gray-800 bg-yellow-100 px-2 py-0.5 rounded">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Network Type Stats */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Network Types</h4>
                  <div className="space-y-1">
                    {analytics.networkTypeUsage?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">{item._id}</span>
                        <span className="text-xs font-semibold text-gray-800 bg-purple-100 px-2 py-0.5 rounded">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Devices Table */}
          {analytics?.topDevices && analytics.topDevices.length > 0 && (
            <div>
              <h3 className="text-lg font-extrabold text-[#14142B] mb-3">TOP DEVICES</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 px-4 text-gray-600 font-medium text-sm">Device Type</th>
                      <th className="pb-3 px-4 text-gray-600 font-medium text-sm">OS</th>
                      <th className="pb-3 px-4 text-gray-600 font-medium text-sm">Browser</th>
                      <th className="pb-3 px-4 text-gray-600 font-medium text-sm">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.topDevices.slice(0, 5).map((device, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-800 text-sm">{device.deviceType}</td>
                        <td className="py-3 px-4 text-gray-800 text-sm">{device.os}</td>
                        <td className="py-3 px-4 text-gray-800 text-sm">{device.browser}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                            {device.count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
        </div>
      </motion.div>
    </div>
  );
};

export default SystemInformationModal;
