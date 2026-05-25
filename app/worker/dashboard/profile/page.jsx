"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Upload, X, User } from "lucide-react";
import { useForm } from "react-hook-form";
import CategorySelect from "@/components/CategorySelect";
import WorkerStatusBadge from "@/components/WorkerStatusBadge";
import { useWorkerStatus } from "@/lib/context/WorkerStatusContext";
import { updateWorker, updateWorkerStatus } from "@/lib/api/workers";
import { useToast } from "@/components/Toast";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";

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

  // Profile photo
  const [profilePhoto, setProfilePhoto] = useState(null);       // display src
  const [profilePhotoFile, setProfilePhotoFile] = useState(null); // File if new

  // Work photos: parallel arrays — stored base64 OR blob url | File or null
  const [workPhotos, setWorkPhotos] = useState([]);
  const [workPhotoFiles, setWorkPhotoFiles] = useState([]);

  // Aadhar
  const [aadharNumber, setAadharNumber] = useState("");
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharFrontFile, setAadharFrontFile] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [aadharBackFile, setAadharBackFile] = useState(null);

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
          setValue("city", w.location?.city || "");
          setValue("area", w.location?.address || "");
          setValue("experience", w.experience ?? 0);
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
          if (w.aadharNumber) setAadharNumber(w.aadharNumber);
          if (w.aadharFrontUrl) setAadharFront(w.aadharFrontUrl);
          if (w.aadharBackUrl) setAadharBack(w.aadharBackUrl);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Compress image using canvas → base64 JPEG
  function compressImage(file, maxPx = 1000, quality = 0.7) {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = URL.createObjectURL(file);
    });
  }

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
        ? await compressImage(profilePhotoFile, 500, 0.75)
        : profilePhoto;

      const finalAadharFront = aadharFrontFile
        ? await compressImage(aadharFrontFile, 1200, 0.7)
        : aadharFront;

      const finalAadharBack = aadharBackFile
        ? await compressImage(aadharBackFile, 1200, 0.7)
        : aadharBack;

      const finalWorkPhotos = await Promise.all(
        workPhotos.map((url, i) =>
          workPhotoFiles[i] ? compressImage(workPhotoFiles[i], 800, 0.65) : url
        )
      );

      await updateWorker(workerId, {
        ...data,
        category, subcategory, gender, serviceType, employmentType,
        skills: skillsArray,
        ...(photo && { photo }),
        ...(aadharNumber && { aadharNumber }),
        ...(finalAadharFront && { aadharFrontUrl: finalAadharFront }),
        ...(finalAadharBack !== null && { aadharBackUrl: finalAadharBack }),
        workPhotos: finalWorkPhotos,
      });

      // Reset file states after save
      setProfilePhotoFile(null);
      setAadharFrontFile(null);
      setAadharBackFile(null);
      setWorkPhotoFiles(finalWorkPhotos.map(() => null));
      setWorkPhotos(finalWorkPhotos);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error("Save failed. Please try again.");
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
          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper labelHi="शहर" labelEn="City">
              <input {...register("city")} placeholder="City"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy" />
            </FieldWrapper>
            <FieldWrapper labelHi="एरिया" labelEn="Area">
              <input {...register("area")} placeholder="Mohalla / Area"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy" />
            </FieldWrapper>
          </div>
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

        {/* Documents — Aadhar */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-4">
          <h3 className="font-bold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            दस्तावेज़ / Documents
          </h3>

          <FieldWrapper labelHi="आधार नंबर" labelEn="Aadhar Number">
            <input type="tel" inputMode="numeric" maxLength={12} value={aadharNumber}
              onChange={e => setAadharNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="12-digit Aadhar number"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-base" />
          </FieldWrapper>

          {/* Aadhar Front */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              आधार कार्ड - Front
            </p>
            <label className="block cursor-pointer">
              {aadharFront ? (
                <div className="relative">
                  <img src={aadharFront} alt="Aadhar Front" className="w-full h-36 object-cover rounded-xl border-2 border-brand-navy" />
                  <button type="button" onClick={e => { e.preventDefault(); setAadharFront(null); setAadharFrontFile(null); }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-brand-navy transition-colors">
                  <Upload size={22} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-gray-400 text-xs" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>आधार Front Upload करें</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setAadharFront(URL.createObjectURL(f)); setAadharFrontFile(f); } }} />
            </label>
          </div>

          {/* Aadhar Back */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              आधार कार्ड - Back <span className="text-gray-400 font-normal">(optional)</span>
            </p>
            <label className="block cursor-pointer">
              {aadharBack ? (
                <div className="relative">
                  <img src={aadharBack} alt="Aadhar Back" className="w-full h-36 object-cover rounded-xl border-2 border-gray-300" />
                  <button type="button" onClick={e => { e.preventDefault(); setAadharBack(null); setAadharBackFile(null); }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-brand-navy transition-colors">
                  <Upload size={22} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-gray-400 text-xs" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>आधार Back Upload करें</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setAadharBack(URL.createObjectURL(f)); setAadharBackFile(f); } }} />
            </label>
          </div>
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
