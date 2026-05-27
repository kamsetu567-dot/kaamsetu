"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Phone, CheckCircle, Loader2, Crosshair } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function ClientProfilePage() {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [coords, setCoords] = useState(null); // { lat, lng } | null
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
    const userData = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_user") : null;
    if (!token || !userData) { router.replace("/auth/login"); return; }
    try {
      const parsed = JSON.parse(userData);
      if (parsed.role !== "client") { router.replace("/auth/login"); return; }
      setUser(parsed);
    } catch { router.replace("/auth/login"); return; }

    async function load() {
      try {
        const res = await fetch("/api/client/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.client) {
          const c = data.client;
          setClient(c);
          setName(c.name || "");
          setAddress(c.location?.address || "");
          setCity(c.location?.city || "");
          setState(c.location?.state || "");
          setPincode(c.location?.pincode || "");
          const stored = c.location?.coordinates?.coordinates;
          if (Array.isArray(stored) && stored.length === 2) {
            // GeoJSON stores [lng, lat]
            setCoords({ lng: stored[0], lat: stored[1] });
          }
        }
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function detectLocation() {
    if (detecting) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Your browser doesn't support location / Browser location support नहीं करता");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDetecting(false);
        toast.success("Location detected! Click Save to apply / Save दबाएँ");
      },
      err => {
        setDetecting(false);
        const msg = err.code === 1
          ? "Location permission denied / Browser में location allow करें"
          : err.code === 3
          ? "Location request timed out / दोबारा try करें"
          : "Couldn't get your location";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required / नाम जरूरी है"); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("kaamsetu_token");
      const locationPayload = { address, city, state, pincode };
      if (coords) {
        locationPayload.coordinates = {
          type: "Point",
          coordinates: [coords.lng, coords.lat],
        };
      }
      const res = await fetch("/api/client/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          location: locationPayload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClient(data.client);
        const stored = JSON.parse(localStorage.getItem("kaamsetu_user") || "{}");
        stored.name = name.trim();
        localStorage.setItem("kaamsetu_user", JSON.stringify(stored));
        toast.success("Profile updated / Profile अपडेट हो गई!");
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Network error / Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-brand-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      {/* Header card */}
      <div className="bg-brand-navy rounded-3xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={32} className="text-white" />
        </div>
        <div>
          <p className="text-white font-black text-lg">{client?.name || user?.name || "—"}</p>
          <p className="text-white/50 text-sm flex items-center gap-1">
            <Phone size={12} /> +91 {user?.mobile}
          </p>
          {client?.totalRequests > 0 && (
            <p className="text-white/40 text-xs mt-0.5">{client.totalRequests} request{client.totalRequests !== 1 ? "s" : ""} placed</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Basic info */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h3 className="font-black text-brand-navy font-hindi">Basic Info / बेसिक जानकारी</h3>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 font-hindi">
              Full Name / पूरा नाम <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="अपना नाम लिखें"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-hindi focus:border-brand-navy outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Mobile (read-only)
            </label>
            <div className="flex items-center gap-2 border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50">
              <Phone size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">+91 {user?.mobile}</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h3 className="font-black text-brand-navy font-hindi flex items-center gap-2">
            <MapPin size={16} /> Location / पता
          </h3>

          {/* GPS coordinates — used by the distance filter on /workers */}
          <div className={`rounded-2xl p-4 border-2 ${coords ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
            <div className="flex items-start gap-3">
              <Crosshair size={20} className={`flex-shrink-0 mt-0.5 ${coords ? "text-green-600" : "text-yellow-700"}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${coords ? "text-green-700" : "text-yellow-800"}`}>
                  {coords ? "GPS location saved" : "GPS location not set"}
                </p>
                <p className={`text-xs mt-0.5 ${coords ? "text-green-700/80" : "text-yellow-700"}`}>
                  {coords
                    ? `Lat ${coords.lat.toFixed(5)}, Lng ${coords.lng.toFixed(5)}`
                    : "Needed to filter workers by distance (5/10/20 km)"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={detectLocation}
              disabled={detecting}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-brand-navy text-white font-bold text-sm py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {detecting ? (
                <><Loader2 size={14} className="animate-spin" /> Detecting…</>
              ) : (
                <><Crosshair size={14} /> {coords ? "Update my location" : "Detect my location"}</>
              )}
            </button>
            {coords && (
              <button
                type="button"
                onClick={() => setCoords(null)}
                className="mt-2 w-full text-xs text-gray-500 hover:text-red-600"
              >
                Clear saved GPS
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 font-hindi">
              Address / पता
            </label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="गली, मोहल्ला, कॉलोनी"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-hindi focus:border-brand-navy outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 font-hindi">City / शहर</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Delhi"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-navy outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">State</label>
              <input
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="Delhi"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-navy outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pincode</label>
            <input
              value={pincode}
              onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="110001"
              inputMode="numeric"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-navy outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-navy text-white font-bold py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 font-hindi"
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Saving…</>
          ) : (
            <><CheckCircle size={18} /> Save Changes / Save करें</>
          )}
        </button>
      </form>
    </div>
  );
}
