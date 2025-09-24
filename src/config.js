// Use local backend in development, production backend in production
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
//   (import.meta.env.DEV ? "http://localhost:5000" : "https://backend-dot-craftconnect-hackathon-2025.uc.r.appspot.com");


// src/config.js

// Always read from env; no hardcoded fallbacks
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
