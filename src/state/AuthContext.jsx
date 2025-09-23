import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const AuthContext = createContext(null);
const API_URL = `${API_BASE_URL}/api/auth`; // your backend

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("cc_token") || "");
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("cc_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) {
      localStorage.setItem("cc_token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("cc_token");
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Keep user persisted locally
  useEffect(() => {
    if (user) {
      try { localStorage.setItem("cc_user", JSON.stringify(user)); } catch {}
    } else {
      localStorage.removeItem("cc_user");
    }
  }, [user]);

  // Auto-fetch profile whenever we obtain a token (e.g., on refresh)
  useEffect(() => {
    async function loadProfile() {
      try {
        if (!token) return;
        const res = await axios.get(`${API_URL}/profile`);
        setUser(res.data?.user || res.data);
      } catch (e) {
        // If token invalid, clear it to avoid stuck state
        console.warn("Failed to load profile:", e?.response?.data || e.message);
      }
    }
    loadProfile();
  }, [token]);

  const value = useMemo(() => ({
    isAuthenticated,
    token,
    user,

    // ✅ Login with backend
    login: async (email, password) => {
      try {
        const res = await axios.post(`${API_URL}/login`, { email, password });
        setToken(res.data.token);
        setUser(res.data.user);
        try { localStorage.setItem("cc_user", JSON.stringify(res.data.user)); } catch {}
        try { window.dispatchEvent(new Event('auth-changed')); } catch {}
        return true;
      } catch (err) {
        throw err.response?.data?.message || "Login failed";
      }
    },

    // ✅ Signup with backend
    signup: async (name, email, password) => {
      try {
        const res = await axios.post(`${API_URL}/signup`, { name, email, password });
        setToken(res.data.token);
        setUser(res.data.user);
        try { localStorage.setItem("cc_user", JSON.stringify(res.data.user)); } catch {}
        try { window.dispatchEvent(new Event('auth-changed')); } catch {}
        return true;
      } catch (err) {
        throw err.response?.data?.message || "Signup failed";
      }
    },

    // ✅ Update user data
    updateUser: (userData) => {
      setUser(userData);
      try { localStorage.setItem("cc_user", JSON.stringify(userData)); } catch {}
    },

    // Fetch latest user profile from backend
    refreshUser: async () => {
      try {
        const res = await axios.get(`${API_URL}/profile`);
        setUser(res.data?.user || res.data);
        try { localStorage.setItem("cc_user", JSON.stringify(res.data?.user || res.data)); } catch {}
        try { window.dispatchEvent(new Event('auth-changed')); } catch {}
      } catch (e) {
        throw e.response?.data?.message || "Failed to load profile";
      }
    },

    // ✅ Logout
    logout: () => {
      setToken("");
      setUser(null);
      localStorage.removeItem("cc_user");
      try { window.dispatchEvent(new Event('auth-changed')); } catch {}
    },
  }), [isAuthenticated, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
