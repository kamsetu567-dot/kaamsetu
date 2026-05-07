"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OTPVerification from "@/components/OTPVerification";
import CategorySelect from "@/components/CategorySelect";
import LocationPicker from "@/components/LocationPicker";
import { createJobRequest } from "@/lib/api/jobs";
import { useToast } from "@/components/Toast";

function RequestForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preCategory = searchParams.get("category") || "";
  const toast = useToast();

  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mobile, setMobile] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [category, setCategory] = useState(preCategory);
  const [subcategory, setSubcategory] = useState("");
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState("form"); // "form" | "searching" | "success"
  const [searchProgress, setSearchProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("kaamsetu_token");
      const userData = localStorage.getItem("kaamsetu_user");
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          if (user.name) setValue("name", user.name);
        } catch {}
      }
      setIsCheckingAuth(false);
    }
  }, [setValue]);

  async function onSubmit(data) {
    const mobileToUse = currentUser?.mobile || (mobileVerified ? mobile : null);
    if (!mobileToUse) {
      toast.error("पहले मोबाइल verify करें / Please verify your mobile first");
      return;
    }
    if (!category) {
      toast.error("Category चुनें / Please select a category");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setStage("searching");
    setSearchProgress(0);

    // Animate progress 0→95 over 5s while API call runs
    let p = 0;
    const interval = setInterval(() => {
      p += 4;
      setSearchProgress(Math.min(p, 95));
      if (p >= 95) clearInterval(interval);
    }, 200);

    try {
      await createJobRequest({
        clientMobile: mobileToUse,
        clientName: data.name,
        clientId: currentUser?.id || null,
        category,
        subcategory,
        location,
        city: location,
        description: data.notes || "",
        source: "search",
      });
      clearInterval(interval);
      setSearchProgress(100);
      setTimeout(() => {
        setStage("success");
        // Redirect to dashboard after showing success briefly
        setTimeout(() => router.push("/client/dashboard"), 2000);
      }, 300);
    } catch (err) {
      clearInterval(interval);
      setStage("form");
      setSearchProgress(0);
      const msg = err?.message || "";
      if (msg.includes("fetch") || msg.includes("network")) {
        toast.error("इंटरनेट कनेक्शन चेक करें / Please check your internet connection");
      } else {
        toast.error("Request नहीं भेजी गई। फिर try करें / Request failed. Please try again");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return <div className="py-12 text-center text-text-secondary">Loading...</div>;
  }

  if (stage === "searching") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 bg-primary-orange rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Loader2 size={48} className="text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2 text-center" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          नज़दीकी वर्कर ढूंढ रहे हैं...
        </h2>
        <p className="text-text-secondary mb-6 text-center">Searching nearby workers...</p>
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 bg-primary-orange rounded-full transition-all duration-200"
            style={{ width: `${searchProgress}%` }}
          />
        </div>
        <p className="text-primary-orange font-bold mt-2">{searchProgress}%</p>
      </div>
    );
  }

  if (stage === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <CheckCircle size={72} className="text-primary-green mb-4" />
        <h2 className="text-2xl font-black text-text-primary mb-3" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          ✅ Request Send हो गई!
        </h2>
        <p className="text-text-secondary mb-2" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
          पहला worker accept करते ही आपको call आएगी।
        </p>
        <p className="text-text-secondary text-sm mb-4">First available worker will call you right away!</p>
        <p className="text-text-secondary text-xs">Dashboard पर redirect हो रहे हैं... / Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block mb-1.5 font-semibold">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>नाम</span>
          <span className="text-text-secondary font-normal"> / Name *</span>
        </label>
        <input
          {...register("name", { required: "नाम जरूरी है" })}
          placeholder="आपका नाम / Your Name"
          className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      {/* Mobile + OTP */}
      <div>
        <label className="block mb-1.5 font-semibold">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>मोबाइल</span>
          <span className="text-text-secondary font-normal"> / Mobile *</span>
        </label>
        {currentUser ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-semibold text-sm">✅ {currentUser.mobile} verified</p>
            <p className="text-green-600 text-xs mt-1" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
              आप पहले से logged in हैं / You are already logged in
            </p>
          </div>
        ) : mobileVerified ? (
          <p className="text-primary-green text-sm font-semibold">✓ +91 {mobile} verified</p>
        ) : (
          <OTPVerification
            onSuccess={(data) => {
              setMobile(data.mobile);
              setMobileVerified(true);
            }}
            onError={(msg) => toast.error(msg)}
            buttonText="मोबाइल वेरीफाई करें / Verify Mobile"
          />
        )}
      </div>

      {/* Category */}
      <CategorySelect
        value={category}
        onChange={setCategory}
        level="main"
        label="Category"
        labelEn="Service Category *"
      />

      {/* Subcategory */}
      {category && category !== "__other__" && (
        <CategorySelect
          value={subcategory}
          onChange={setSubcategory}
          level="sub"
          parentSlug={category}
          label="Subcategory"
          labelEn="Specific Service"
        />
      )}

      {/* Location */}
      <div>
        <label className="block mb-1.5 font-semibold">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>लोकेशन</span>
          <span className="text-text-secondary font-normal"> / Location *</span>
        </label>
        <LocationPicker value={location} onChange={setLocation} />
      </div>

      {/* When */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1.5 font-semibold text-sm">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>कब?</span>
            <span className="text-text-secondary font-normal"> / Date</span>
          </label>
          <input
            {...register("date")}
            type="date"
            className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-semibold text-sm">
            <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>समय</span>
            <span className="text-text-secondary font-normal"> / Time</span>
          </label>
          <input
            {...register("time")}
            type="time"
            className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block mb-1.5 font-semibold">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>नोट्स</span>
          <span className="text-text-secondary font-normal"> / Additional Notes (optional)</span>
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="कोई विशेष जानकारी / Any special requirements..."
          className="w-full px-4 py-4 text-base border-2 border-border-light rounded-xl focus:outline-none focus:border-primary-orange resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={(!currentUser && !mobileVerified) || !category || submitting}
        className="w-full bg-primary-orange text-white font-black text-xl py-5 rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-16"
        aria-label="Submit service request"
      >
        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Worker ढूंढें</span>
        <span className="block text-sm font-normal">/ Find Worker</span>
      </button>
    </form>
  );
}

export default function RequestServicePage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-neutral-bg">
        <div className="bg-primary-orange px-4 py-6">
          <div className="max-w-lg mx-auto">
            <Link href="/" className="text-white/70 hover:text-white flex items-center gap-2 mb-3 w-fit" aria-label="Back">
              <ArrowLeft size={20} />
              <span className="text-sm">Back / वापस</span>
            </Link>
            <h1
              className="text-2xl md:text-3xl font-black text-white"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              काम करवाओ
            </h1>
            <p className="text-white/80">Hire a Worker — Fast!</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl border-2 border-border-light p-6 shadow-lg">
            <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <RequestForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
