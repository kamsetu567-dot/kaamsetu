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
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

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
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (file) setProfilePhoto(URL.createObjectURL(file));
  }

  async function onSubmit(data) {
    if (!workerId) {
      toast.error("Profile not loaded, please refresh");
      return;
    }
    setLoading(true);
    const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
    await updateWorker(workerId, { ...data, category, subcategory, gender, serviceType, employmentType, skills: skillsArray });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2
          className="text-xl font-black text-brand-navy"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          प्रोफ़ाइल संपादित करें
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">Edit Profile</p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-500 rounded-2xl px-4 py-3">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <p
            className="text-green-600 font-semibold"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            Profile save हो गई! / Profile saved!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Profile photo */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
          <h3
            className="font-bold text-brand-navy mb-3"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            प्रोफाइल फ़ोटो / Profile Photo
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200 flex-shrink-0">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile preview" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-gray-400" />
              )}
            </div>
            <label className="cursor-pointer flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-orange-500 transition-colors">
              <Upload size={18} className="text-gray-500" />
              <span className="text-gray-500 text-sm">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>फ़ोटो बदलें</span>
                {" / Change"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} aria-label="Upload profile photo" />
            </label>
            {profilePhoto && (
              <button type="button" onClick={() => setProfilePhoto(null)} className="text-red-500 p-1" aria-label="Remove photo">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-4">
          <h3
            className="font-bold text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            बेसिक जानकारी / Basic Info
          </h3>

          <FieldWrapper labelHi="नाम" labelEn="Name *">
            <input
              {...register("name", { required: "नाम जरूरी है" })}
              placeholder="पूरा नाम / Full Name"
              className="w-full px-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper labelHi="शहर" labelEn="City">
              <input
                {...register("city")}
                placeholder="City"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy"
              />
            </FieldWrapper>
            <FieldWrapper labelHi="एरिया" labelEn="Area">
              <input
                {...register("area")}
                placeholder="Mohalla / Area"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy"
              />
            </FieldWrapper>
          </div>

          <FieldWrapper labelHi="अनुभव (साल)" labelEn="Experience (years)">
            <input
              {...register("experience", { min: 0 })}
              type="number"
              min={0}
              placeholder="0"
              className="w-full px-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy"
            />
          </FieldWrapper>
        </div>

        {/* Profession */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-4">
          <h3
            className="font-bold text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            काम की जानकारी / Profession
          </h3>

          <CategorySelect
            value={category}
            onChange={setCategory}
            level="main"
            label="Category"
            labelEn="Main Category"
          />
          {category && category !== "__other__" && (
            <CategorySelect
              value={subcategory}
              onChange={setSubcategory}
              level="sub"
              parentSlug={category}
              label="Subcategory"
              labelEn="Specific Skill"
            />
          )}
        </div>

        {/* Gender */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-3">
          <h3
            className="font-bold text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            लिंग / Gender
          </h3>
          <div className="flex gap-3">
            {[{ value: "male", hi: "पुरुष", en: "Male" }, { value: "female", hi: "महिला", en: "Female" }].map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${
                  gender === g.value
                    ? "bg-brand-navy text-white border-brand-navy"
                    : "border-gray-200 text-gray-500 hover:border-brand-navy"
                }`}
                aria-label={g.en}
              >
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{g.hi}</span>
                <span className="font-normal text-sm"> / {g.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Service Type */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-3">
          <h3
            className="font-bold text-brand-navy"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            सेवा का प्रकार / Service Type
          </h3>
          <div className="space-y-2">
            {[
              { value: "home_visit", hi: "घर पर आकर", en: "Home Visit" },
              { value: "shop_office", hi: "दुकान / ऑफिस पर", en: "Shop or Office" },
              { value: "both", hi: "दोनों", en: "Both" },
            ].map(st => (
              <button
                key={st.value}
                type="button"
                onClick={() => setServiceType(st.value)}
                className={`w-full py-3 px-4 rounded-xl border-2 font-semibold text-left transition-colors ${
                  serviceType === st.value
                    ? "bg-green-600 text-white border-green-600"
                    : "border-gray-200 text-gray-500 hover:border-green-600"
                }`}
                aria-label={st.en}
              >
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{st.hi}</span>
                <span className="font-normal"> / {st.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Employment Type */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-brand-navy" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            काम का प्रकार / Employment Type
          </h3>
          <div className="flex gap-3">
            {[
              { value: "full_time", hi: "फुल टाइम", en: "Full Time" },
              { value: "part_time", hi: "पार्ट टाइम", en: "Part Time" },
              { value: "any",       hi: "दोनों",     en: "Any" },
            ].map(et => (
              <button key={et.value} type="button" onClick={() => setEmploymentType(et.value)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${
                  employmentType === et.value
                    ? "bg-brand-navy text-white border-brand-navy"
                    : "border-gray-200 text-gray-500 hover:border-brand-navy"
                }`}>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{et.hi}</span>
                <span className="font-normal text-sm"> / {et.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
          <h3 className="font-bold text-brand-navy mb-3" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
            Skills / हुनर
          </h3>
          <input
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="e.g. MS Excel, Tally, Typing — comma separated"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-navy text-sm"
          />
          <p className="text-gray-400 text-xs mt-1.5">Comma से अलग करें / Separate with commas</p>
        </div>

        {/* Work Status toggle */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="font-bold text-brand-navy"
                style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
              >
                काम की स्थिति / Work Status
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">
                Current: <WorkerStatusBadge status={status} size="sm" />
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {[{ val: "free", label: "🟢 खाली हूँ / Free", cls: "bg-green-600 border-green-600" },
              { val: "working", label: "🔴 व्यस्त / Working", cls: "bg-orange-500 border-orange-500" }].map(s => (
              <button key={s.val} type="button"
                onClick={async () => {
                  updateStatus(s.val);
                  try { await updateWorkerStatus(null, s.val); } catch {}
                }}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${
                  status === s.val ? `${s.cls} text-white` : "border-gray-200 text-gray-500"
                }`}>
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-navy text-white font-black text-xl py-5 rounded-2xl hover:opacity-90 transition-colors disabled:opacity-50 min-h-16"
          aria-label="Save profile"
        >
          {loading ? "Save हो रहा है..." : (
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              Profile Save करें / Save Profile
            </span>
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
