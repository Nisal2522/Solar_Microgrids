// -----------------------------------------------------------------------------
// File: AuthContext.jsx
// Purpose: Global auth state (current user + token), backed by localStorage
//          so a page refresh keeps the session. Exposes login()/logout()
//          used by every protected route and role guard.
// Module owner: Member A (Identity & Access) / shared infrastructure
// -----------------------------------------------------------------------------
import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

// Wraps the app, loading any previously-saved session from localStorage on mount.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Calls the login endpoint, stores the JWT + user profile on success.
  async function login(identifier, password) {
    const { data } = await apiClient.post("/auth/login", { identifier, password });
    localStorage.setItem("token", data.token);
    const profile = { id: data.userId, userType: data.userType, fullName: data.fullName, nic: data.nic };
    setUser(profile);
    return profile;
  }

  // Clears the session and forgets the JWT.
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook for consuming the auth context.
export function useAuth() {
  return useContext(AuthContext);
}
