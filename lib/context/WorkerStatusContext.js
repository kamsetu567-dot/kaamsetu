"use client";

import { createContext, useContext, useState, useCallback } from "react";

const WorkerStatusContext = createContext(null);

export function WorkerStatusProvider({ children }) {
  const [status, setStatus] = useState("free"); // "free" | "working"
  const [lastUpdated, setLastUpdated] = useState(null);

  // TODO: Sync status to backend via API when ready.
  const updateStatus = useCallback((newStatus) => {
    setStatus(newStatus);
    setLastUpdated(new Date());
  }, []);

  const startWork = useCallback(() => updateStatus("working"), [updateStatus]);
  const endWork = useCallback(() => updateStatus("free"), [updateStatus]);

  return (
    <WorkerStatusContext.Provider value={{ status, lastUpdated, startWork, endWork, updateStatus }}>
      {children}
    </WorkerStatusContext.Provider>
  );
}

export function useWorkerStatus() {
  const ctx = useContext(WorkerStatusContext);
  if (!ctx) throw new Error("useWorkerStatus must be used within WorkerStatusProvider");
  return ctx;
}
