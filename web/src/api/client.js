// -----------------------------------------------------------------------------
// File: client.js
// Purpose: Shared Axios instance pointed at the Web API. Attaches the JWT
//          from localStorage to every request and redirects to /login on a
//          401 response, so individual pages never handle auth headers.
// Module owner: Member A (Identity & Access) / shared infrastructure
// -----------------------------------------------------------------------------
import axios from "axios";

// Base URL is read from Vite env (falls back to the local dev API port).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5080/api";

const apiClient = axios.create({ baseURL: API_BASE_URL });

// Attaches the stored JWT (if any) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clears the session and bounces to /login whenever the API rejects the token.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
