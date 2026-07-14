"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Upload, X, User, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import CategorySelect from "@/components/CategorySelect";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import WorkerStatusBadge from "@/components/WorkerStatusBadge";
import { useWorkerStatus } from "@/lib/context/WorkerStatusContext";
import { updateWorker, updateWorkerStatus } from "@/lib/api/workers";
import { apiPatch } from "@/lib/api/client";
import { useToast } from "@/components/Toast";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";
import { compressImage } from "@/lib/utils/compressImage";

// Show only the last 4 digits of a 12-digit Aadhaar number.
function maskAadhaar(num) {
  const digits = String(num || "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  return `XXXX XXXX ${digits.slice(-4)}`;
}

export default function WorkerProfileEditPage() {
  useRoleGuard("worker");
  const { status, updateStatus } = useWorkerStatus();
  const toast = useToast();
  const [workerId, setWorkerId] = useState(null);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [gender, setGender] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [employmentType, setEmploymentType] = useState("any");
  const [skills, setSkills] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Structured location — { address, locality, city, state, pincode, lat, lng }.
  // Saved through PATCH /api/workers/me (which builds proper GeoJSON), NOT the
  // flat city/area path that the [id] route silently dropped.
  const [location, setLocation] = useState(null);

  // Profile photo
  const [profilePhoto, setProfilePhoto] = useState(null);       // display src
  const [profilePhotoFile, setProfilePhotoFile] = useState(null); // File if new

  // Work photos: parallel arrays — stored base64 OR blob url | File or null
  const [workPhotos, setWorkPhotos] = useState([]);
  const [workPhotoFiles, setWorkPhotoFiles] = useState([]);

  // Aadhaar — collected + required at signup, immutable afterward. Shown
  // read-only (masked); never edited from this page.
  const [aadharNumber, setAadharNumber] = useState("");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
        if (!token) return;
        const res = await fetch("/api/workers/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.worker) {
          const w = data.worker;
          setWorkerId(w._id || w.id);
          setValue("name", w.name || "");
          setValue("experience", w.experience ?? 0);
          // Rebuild the structured location object for AddressAutocomplete.
          // Coordinates are stored GeoJSON-style [lng, lat]; unpack to lat/lng.
          if (w.location) {
            const coords = w.location.coordinates?.coordinates;
            setLocation({
              address: w.location.address || "",
              locality: w.location.locality || "",
              city: w.location.city || "",
              state: w.location.state || "",
              pincode: w.location.pincode || "",
              lat: Array.isArray(coords) ? coords[1] : null,
              lng: Array.isArray(coords) ? coords[0] : null,
            });
          }
          if (w.category) setCategory(w.category);
          if (w.subcategory) setSubcategory(w.subcategory);
          if (w.gender) setGender(w.gender);
          if (w.serviceType) setServiceType(w.serviceType);
          if (w.employmentType) setEmploymentType(w.employmentType);
          if (w.skills?.length) setSkills(w.skills.join(", "));
          if (w.workStatus) updateStatus(w.workStatus);
          if (w.photo) setProfilePhoto(w.photo);
          if (w.workPhotos?.length) {
            setWorkPhotos(w.workPhotos);
            setWorkPhotoFiles(w.workPhotos.map(() => null)); // null = already stored
          }
          if (w.aadharNumber) setAadharNumber(w.aadharNumber); // read-only display only
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(URL.createObjectURL(file));
      setProfilePhotoFile(file);
    }
  }

  function handleWorkPhotoAdd(e) {
    const files = Array.from(e.target.files || []).slice(0, 5 - workPhotos.length);
    const urls = files.map(f => URL.createObjectURL(f));
    setWorkPhotos(p => [...p, ...urls].slice(0, 5));
    setWorkPhotoFiles(p => [...p, ...files].slice(0, 5));
  }

  function removeWorkPhoto(i) {
    setWorkPhotos(p => p.filter((_, j) => j !== i));
    setWorkPhotoFiles(p => p.filter((_, j) => j !== i));
  }

  async function onSubmit(data) {
    if (!workerId) { toast.error("Profile not loaded, please refresh"); return; }
    setLoading(true);
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);

      // Compress any new images
      const photo = profilePhotoFile
        ? await compressImage(profilePhotoFile, { maxPx: 500, quality: 0.75 })
        : profilePhoto;

      const finalWorkPhotos = await Promise.all(
        workPhotos.map((url, i) =>
          workPhotoFiles[i] ? compressImage(workPhotoFiles[i], { maxPx: 800, quality: 0.65 }) : url
        )
      );

      // Non-location fields go through the [id] self-update route. Aadhaar is
      // intentionally NOT sent — it's immutable after signup.
      await updateWorker(workerId, {
        name: data.name,
        experience: data.experience,
        category, subcategory, gender, serviceType, employmentType,
        skills: skillsArray,
        ...(photo && { photo }),
        workPhotos: finalWorkPhotos,
      });

      // Location goes through /api/workers/me, which normalizes the object and
      // writes proper GeoJSON coordinates (the [id] route only drops flat city).
      if (location && (location.city || location.address || (location.lat != null && location.lng != null))) {
        await apiPatch("/api/workers/me", { location });
      }

      // Reset file states after save
      setProfilePhotoFile(null);
      setWorkPhotoFiles(finalWorkPhotos.map(() => null));
      setWorkPhotos(finalWorkPhotos);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      if (err.message === "IMAGE_TOO_BIG") {
        toast.error("फोटो का size बहुत बड़ा है / Image size is too big");
      } else {
        toast.error("Save failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          प्रोफ़ाइल संपादित करें
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">Edit Profile</p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-500 rounded-2xl px-4 py-3">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-green-600 font-semibold" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Profile save हो गई! / Profile saved!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Profile Photo */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
          <h3 className="font-bold text-brand-navy mb-3" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            प्रोफाइल फ़ोटो / Profile Photo
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200 flex-shrink-0">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-gray-400" />
              )}
            </div>
            <label className="cursor-pointer flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-orange-500 transition-colors">
              <Upload size={18} className="text-gray-500" />
              <span className="text-gray-500 text-sm">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>फ़ोटो बदलें</span> / Change
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </label>
            {profilePhoto && (
              <button type="button" onClick={() => { setProfilePhoto(null); setProfilePhotoFile(null); }} className="text-red-500 p-1">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-4">
          <h3 className="font-bold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            बेसिक जानकारी / Basic Info
          </h3>
          <FieldWrapper labelHi="नाम" labelEn="Name *">
            <input {...register("name", { required: "नाम जरूरी है" })} placeholder="पूरा नाम / Full Name"
              className="w-full px-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </FieldWrapper>
          <FieldWrapper labelHi="लोकेशन" labelEn="Location">
            <AddressAutocomplete value={location} onChange={setLocation} />
            {/* City is what actually routes jobs to this worker, and the address
                picker can come back with coordinates but no city (reverse-geocode
                fails). Without an editable field a worker in that state has no way
                to fix it and would silently never receive a job. */}
            <input
              value={location?.city || ""}
              onChange={e => setLocation(prev => ({ ...(prev || {}), city: e.target.value }))}
              placeholder="शहर / City (e.g. Jind) *"
              className={`w-full mt-2 px-4 py-4 text-base border-2 rounded-xl focus:outline-none focus:border-brand-navy ${
                location?.city ? "border-gray-200" : "border-red-300 bg-red-50"
              }`}
            />
            {!location?.city && (
              <p className="text-red-600 text-xs mt-1 font-semibold font-hindi">
                शहर जरूरी है — इसके बिना आपको कोई job नहीं दिखेगी / Required: you receive jobs only from your city.
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              आपको सिर्फ अपने शहर की jobs दिखेंगी / You will only see jobs from your city
            </p>
          </FieldWrapper>
          <FieldWrapper labelHi="अनुभव (साल)" labelEn="Experience (years)">
            <input {...register("experience", { min: 0 })} type="number" min={0} placeholder="0"
              className="w-full px-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy" />
          </FieldWrapper>
        </div>

        {/* Profession */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-4">
          <h3 className="font-bold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            काम की जानकारी / Profession
          </h3>
          <CategorySelect value={category} onChange={setCategory} level="main" label="Category" labelEn="Main Category" />
          {category && category !== "__other__" && (
            <CategorySelect value={subcategory} onChange={setSubcategory} level="sub" parentSlug={category} label="Subcategory" labelEn="Specific Skill" />
          )}
        </div>

        {/* Gender */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लिंग / Gender</h3>
          <div className="flex gap-3">
            {[{ value: "male", hi: "पुरुष", en: "Male" }, { value: "female", hi: "महिला", en: "Female" }].map(g => (
              <button key={g.value} type="button" onClick={() => setGender(g.value)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${gender === g.value ? "bg-brand-navy text-white border-brand-navy" : "border-gray-200 text-gray-500 hover:border-brand-navy"}`}>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{g.hi}</span>
                <span className="font-normal text-sm"> / {g.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Service Type */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>सेवा का प्रकार / Service Type</h3>
          <div className="space-y-2">
            {[
              { value: "home_visit", hi: "घर पर आकर", en: "Home Visit" },
              { value: "shop_office", hi: "दुकान / ऑफिस पर", en: "Shop or Office" },
              { value: "both", hi: "दोनों", en: "Both" },
            ].map(st => (
              <button key={st.value} type="button" onClick={() => setServiceType(st.value)}
                className={`w-full py-3 px-4 rounded-xl border-2 font-semibold text-left transition-colors ${serviceType === st.value ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-500 hover:border-green-600"}`}>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{st.hi}</span>
                <span className="font-normal"> / {st.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Employment Type */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>काम का प्रकार / Employment Type</h3>
          <div className="flex gap-3">
            {[
              { value: "full_time", hi: "फुल टाइम", en: "Full Time" },
              { value: "part_time", hi: "पार्ट टाइम", en: "Part Time" },
              { value: "any", hi: "दोनों", en: "Any" },
            ].map(et => (
              <button key={et.value} type="button" onClick={() => setEmploymentType(et.value)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${employmentType === et.value ? "bg-brand-navy text-white border-brand-navy" : "border-gray-200 text-gray-500 hover:border-brand-navy"}`}>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{et.hi}</span>
                <span className="font-normal text-sm"> / {et.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
          <h3 className="font-bold text-brand-navy mb-3" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Skills / हुनर</h3>
          <input value={skills} onChange={e => setSkills(e.target.value)}
            placeholder="e.g. MS Excel, Tally, Typing — comma separated"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm" />
          <p className="text-gray-400 text-xs mt-1.5">Comma से अलग करें / Separate with commas</p>
        </div>

        {/* Work Photos */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
          <h3 className="font-bold text-brand-navy mb-3" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            काम की फ़ोटो / Work Photos <span className="text-gray-400 font-normal text-sm">(up to 5)</span>
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {workPhotos.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="w-full aspect-square object-cover rounded-xl border border-gray-200" />
                <button type="button" onClick={() => removeWorkPhoto(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                  <X size={12} />
                </button>
              </div>
            ))}
            {workPhotos.length < 5 && (
              <label className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl aspect-square flex items-center justify-center hover:border-brand-navy transition-colors">
                <Upload size={20} className="text-gray-400" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleWorkPhotoAdd} />
              </label>
            )}
          </div>
        </div>

        {/* Documents — Aadhaar (read-only; captured + verified at signup,
            immutable afterward). No edit/upload/delete controls. */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            दस्तावेज़ / Documents
          </h3>

          <div className="flex items-center justify-between bg-brand-bg border-2 border-gray-200 rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-gray-500" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>आधार नंबर / Aadhaar Number</p>
              <p className="font-black text-brand-navy tracking-widest text-base mt-0.5">
                {aadharNumber ? maskAadhaar(aadharNumber) : "—"}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 text-xs font-bold px-2.5 py-1 rounded-full">
              <ShieldCheck size={13} />
              <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>वेरिफाइड / Verified</span>
            </span>
          </div>

          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            आधार साइनअप के समय वेरिफाई किया गया था और बदला नहीं जा सकता। बदलाव के लिए सपोर्ट से संपर्क करें।
            {" "}Aadhaar was verified at signup and cannot be changed here. Contact support to update it.
          </p>
        </div>

        {/* Work Status */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                काम की स्थिति / Work Status
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">Current: <WorkerStatusBadge status={status} size="sm" /></p>
            </div>
          </div>
          <div className="flex gap-3">
            {[
              { val: "free", label: "🟢 खाली हूँ / Free", cls: "bg-green-600 border-green-600" },
              { val: "working", label: "🔴 व्यस्त / Working", cls: "bg-orange-500 border-orange-500" },
            ].map(s => (
              <button key={s.val} type="button"
                onClick={async () => { updateStatus(s.val); try { await updateWorkerStatus(null, s.val); } catch {} }}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${status === s.val ? `${s.cls} text-white` : "border-gray-200 text-gray-500"}`}>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button type="submit" disabled={loading}
          className="w-full bg-brand-navy text-white font-black text-xl py-5 rounded-2xl hover:opacity-90 transition-colors disabled:opacity-50 min-h-16">
          {loading ? "Save हो रहा है..." : (
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Profile Save करें / Save Profile</span>
          )}
        </button>
      </form>
    </div>
  );
}

function FieldWrapper({ labelHi, labelEn, children }) {
  return (
    <div>
      <label className="block mb-1.5 font-semibold text-brand-navy">
        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{labelHi}</span>
        {labelEn && <span className="text-gray-500 font-normal"> / {labelEn}</span>}
      </label>
      {children}
    </div>
  );
}
