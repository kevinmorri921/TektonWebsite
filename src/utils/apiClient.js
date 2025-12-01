/**
 * API Client Configuration
 * Supports local development
 * ngrok support available (see commented section below)
 */

// Determine API base URL from environment
// In development: http://localhost:5000
// For ngrok: Set VITE_API_URL environment variable (see below)
const getAPIBaseURL = () => {
  // Primary: Use localhost for local development
  return 'http://localhost:5000';
  
  // 🔶 COMMENTED: ngrok alternative
  // Uncomment below to use ngrok instead of localhost
  // First priority: Use environment variable (for ngrok or custom deployment)
  // if (import.meta.env.VITE_API_URL) {
  //   return import.meta.env.VITE_API_URL;
  // }
  // Fallback: Use localhost for development
  // return 'http://localhost:5000';
};

export const API_BASE_URL = getAPIBaseURL();

// Log API configuration (helpful for debugging)
if (typeof console !== 'undefined') {
  console.log('🔗 API Configuration:', {
    baseURL: API_BASE_URL,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  });
}

export default API_BASE_URL;
