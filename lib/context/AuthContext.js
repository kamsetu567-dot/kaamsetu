"use client";

import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

// Placeholder auth state — no persistence (backend will handle tomorrow)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // user shape: { mobile, role: "worker"|"client"|"shop"|"admin", name, token }

  // TODO: Persist via API when backend is ready
  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isLoggedIn = !!user;
  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
