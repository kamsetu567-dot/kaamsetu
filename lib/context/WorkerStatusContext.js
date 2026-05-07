"use client";

import { createContext, useContext, useState, useCallback } from "react";

const WorkerStatusContext = createContext(null);

export function WorkerStatusProvider({ children }) {
  const [status, setStatus] = useState("free");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = useCallback(async (newStatus) => {
    const prev = status;
    // Optimistic update
    setStatus(newStatus);
    setLastUpdated(new Date());
    setIsUpdating(true);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
      if (token) {
        const res = await fetch("/api/workers/status", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ workStatus: newStatus }),
        });
        if (!res.ok) {
          // Rollback on failure
          setStatus(prev);
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Status update failed");
        }
      }
    } catch (err) {
      setStatus(prev);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [status]);

  const startWork = useCallback(() => updateStatus("working"), [updateStatus]);
  const endWork = useCallback(() => updateStatus("free"), [updateStatus]);

  return (
    <WorkerStatusContext.Provider
      value={{ status, lastUpdated, startWork, endWork, updateStatus, isUpdating }}
    >
      {children}
    </WorkerStatusContext.Provider>
  );
}

export function useWorkerStatus() {
  const ctx = useContext(WorkerStatusContext);
  if (!ctx) throw new Error("useWorkerStatus must be used within WorkerStatusProvider");
  return ctx;
}
