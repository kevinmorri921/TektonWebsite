/**
 * API Client Configuration
 * Supports both local development and ngrok public URLs
 */

// Determine API base URL from environment
// In development: http://localhost:5000
// In production or ngrok: Use VITE_API_URL environment variable
const getAPIBaseURL = () => {
  // First priority: Use environment variable (for ngrok or custom deployment)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback: Use localhost for development
  return 'http://localhost:5000';
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
