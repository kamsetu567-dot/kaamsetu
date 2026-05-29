"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Phone, User, MapPin, Clock,
  Star, ShieldCheck, ChevronLeft, ChevronRight, MessageSquare, FileText, Briefcase, Flag,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkerStatusBadge from "@/components/WorkerStatusBadge";
import RatingStars from "@/components/RatingStars";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-2">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-14 bg-gray-200 rounded-2xl" />
    </div>
  );
}

function PhotoGallery({ photos, name }) {
  const [idx, setIdx] = useState(0);
  if (!photos || photos.length === 0) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-100">
      <div className="relative h-56 md:h-72 w-full">
        <Image
          src={photos[idx]}
          alt={`${name} work photo ${idx + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % photos.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/50"}`}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
        {idx + 1} / {photos.length}
      </div>
    </div>
  );
}

export default function WorkerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false); // true once guard confirms visitor may stay
  const [fetchError, setFetchError] = useState(null); // null | "not_found" | "server_error" | "network_error"

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    // Guests can't view worker profiles — push them to sign up first
    if (!localStorage.getItem("kaamsetu_token")) {
      router.replace("/auth/signup");
      return;
    }
    try {
      const u = JSON.parse(localStorage.getItem("kaamsetu_user") || "{}");
      if (u.role === "worker") { router.replace("/worker/dashboard"); return; }
    } catch {}
    setAuthChecked(true);
  }, [router]);

  const loadWorker = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    fetch(`/api/workers/${id}`)
      .then(async res => {
        if (!res.ok) {
          setFetchError(res.status === 404 ? "not_found" : "server_error");
          return;
        }
        const data = await res.json();
        setWorker(data.worker || null);
      })
      .catch(() => setFetchError("network_error"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (authChecked) loadWorker(); }, [authChecked, loadWorker]);

  async function submitReport() {
    if (!reportReason) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("kaamsetu_token") : null;
      if (!token) { toast.error("Please login to report"); return; }
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workerId: id, reason: reportReason, description: reportDesc }),
      });
      setReportSubmitted(true);
    } catch {}
  }

  const serviceTypeLabel = {
    home_visit: { hi: "घर पर आकर", en: "Home Visit" },
    shop_office: { hi: "दुकान/ऑफिस पर", en: "Shop/Office" },
    both: { hi: "दोनों", en: "Both" },
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-neutral-bg pb-28">

        <div className="bg-primary-blue px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/workers"
              className="text-white/70 hover:text-white flex items-center gap-2 mb-3 w-fit"
              aria-label="Back to workers list"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>वर्कर list</span>
                {" / Workers"}
              </span>
            </Link>
            <h1
              className="text-xl font-black text-white"
              style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
            >
              Worker Profile / वर्कर प्रोफ़ाइल
            </h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {loading ? (
            <div className="bg-white rounded-3xl border-2 border-border-light p-6">
              <ProfileSkeleton />
            </div>

          ) : fetchError ? (
            <div className="bg-white rounded-3xl border-2 border-border-light p-6 text-center py-12">
              {fetchError === "not_found" ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <User size={40} className="text-gray-400" />
                  </div>
                  <p className="font-black text-text-primary text-lg mb-2">Worker Not Found</p>
                  <p className="text-text-secondary text-sm mb-4">
                    This profile is no longer available or has been removed.
                  </p>
                  <Link
                    href="/workers"
                    className="inline-block bg-primary-blue text-white font-bold py-2.5 px-6 rounded-2xl text-sm"
                  >
                    Browse Workers
                  </Link>
                </>
              ) : (
                <>
                  <p className="font-black text-text-primary text-lg mb-2">Failed to load profile</p>
                  <p className="text-text-secondary text-sm mb-4">Please check your internet and try again.</p>
                  <button
                    onClick={loadWorker}
                    className="bg-primary-blue text-white font-bold py-2.5 px-6 rounded-2xl text-sm"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>

          ) : worker ? (
            <>
              {/* Header card */}
              <div className="bg-white rounded-3xl border-2 border-border-light p-6">
                <div className="flex gap-4 mb-5">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-4 border-primary-blue">
                    {worker.photo ? (
                      <img src={worker.photo} alt={`${worker.name} photo`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={40} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-text-primary">{worker.name}</h2>
                      {worker.verified && (
                        <ShieldCheck size={18} className="text-primary-blue flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-text-secondary text-sm mt-0.5">
                      {worker.subcategory || worker.category}
                    </p>
                    <div className="mt-1">
                      <RatingStars rating={worker.rating || 0} size={16} />
                    </div>
                    <div className="mt-2">
                      <WorkerStatusBadge status={worker.workStatus || "free"} size="md" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border-light pt-4">
                  {worker.experience > 0 && (
                    <InfoRow icon={Clock}
                      label="अनुभव / Experience"
                      value={`${worker.experience} साल / years`}
                    />
                  )}
                  {(worker.location?.city || worker.location?.address || typeof worker.location === "string") && (
                    <InfoRow
                      icon={MapPin}
                      label="लोकेशन / Location"
                      value={
                        typeof worker.location === "string"
                          ? worker.location
                          : [worker.location?.address, worker.location?.city].filter(Boolean).join(", ") || "—"
                      }
                    />
                  )}
                  {worker.gender && (
                    <InfoRow icon={User}
                      label="लिंग / Gender"
                      value={worker.gender === "male" ? "पुरुष / Male" : "महिला / Female"}
                    />
                  )}
                  {worker.serviceType && (
                    <InfoRow
                      icon={ShieldCheck}
                      label="सेवा प्रकार / Service Type"
                      value={(() => {
                        const st = serviceTypeLabel[worker.serviceType];
                        return st ? `${st.hi} / ${st.en}` : worker.serviceType;
                      })()}
                    />
                  )}
                  {worker.employmentType && worker.employmentType !== "any" && (
                    <InfoRow
                      icon={Briefcase}
                      label="काम का प्रकार / Employment Type"
                      value={worker.employmentType === "full_time" ? "फुल टाइम / Full Time" : "पार्ट टाइम / Part Time"}
                    />
                  )}
                </div>
              </div>

              {worker.workPhotos?.length > 0 && (
                <div className="bg-white rounded-3xl border-2 border-border-light p-5">
                  <h3
                    className="font-black text-text-primary mb-3"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    काम की फ़ोटो / Work Photos
                  </h3>
                  <PhotoGallery photos={worker.workPhotos} name={worker.name} />
                </div>
              )}

              {worker.biodata && (
                <div className="bg-white rounded-3xl border-2 border-border-light p-5">
                  <h3 className="font-black text-text-primary mb-3" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>
                    Biodata / बायोडेटा
                  </h3>
                  <a
                    href={worker.biodata}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3 hover:border-blue-500 transition-colors"
                  >
                    <FileText size={20} className="text-primary-blue flex-shrink-0" />
                    <div>
                      <p className="font-bold text-primary-blue text-sm">Download Biodata</p>
                      <p className="text-xs text-gray-500" style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>बायोडेटा डाउनलोड करें</p>
                    </div>
                  </a>
                </div>
              )}

              {worker.skills?.length > 0 && (
                <div className="bg-white rounded-3xl border-2 border-border-light p-5">
                  <h3
                    className="font-black text-text-primary mb-3"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    Skills / हुनर
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map(skill => (
                      <span key={skill} className="bg-blue-50 text-primary-blue text-sm px-3 py-1.5 rounded-full border border-blue-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={() => setShowReport(true)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors py-1">
                  <Flag size={13} /> Report this worker
                </button>
              </div>

              {showReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                    {reportSubmitted ? (
                      <div className="text-center py-4">
                        <p className="text-2xl mb-2">✅</p>
                        <p className="font-black text-brand-navy">Report Submit हो गई!</p>
                        <p className="text-gray-500 text-sm mt-1">We'll review it shortly.</p>
                        <button onClick={() => { setShowReport(false); setReportSubmitted(false); setReportReason(""); setReportDesc(""); }}
                          className="mt-4 w-full bg-brand-navy text-white font-bold py-3 rounded-xl">Close</button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-black text-brand-navy mb-1 flex items-center gap-2"><Flag size={16} className="text-red-500" /> Report Worker</h3>
                        <p className="text-gray-500 text-xs mb-4">Help us keep KaamSetu safe</p>
                        <div className="space-y-2 mb-4">
                          {[
                            { value: "fake_profile", label: "Fake Profile" },
                            { value: "fraud", label: "Fraud / Cheating" },
                            { value: "bad_behaviour", label: "Bad Behaviour" },
                            { value: "spam", label: "Spam" },
                            { value: "wrong_work", label: "Wrong / Poor Work" },
                          ].map(r => (
                            <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${reportReason === r.value ? "border-red-500 bg-red-50" : "border-gray-200"}`}>
                              <input type="radio" value={r.value} checked={reportReason === r.value}
                                onChange={e => setReportReason(e.target.value)} className="sr-only" />
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${reportReason === r.value ? "border-red-500 bg-red-500" : "border-gray-300"}`} />
                              <span className="text-sm font-semibold text-brand-navy">{r.label}</span>
                            </label>
                          ))}
                        </div>
                        <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)}
                          placeholder="Additional details (optional)..."
                          rows={2}
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none mb-4" />
                        <div className="flex gap-3">
                          <button onClick={() => setShowReport(false)}
                            className="flex-1 border-2 border-gray-200 text-gray-500 font-bold py-3 rounded-xl">Cancel</button>
                          <button onClick={submitReport} disabled={!reportReason}
                            className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-50">Submit</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl border-2 border-border-light p-5">
                <h3
                  className="font-black text-text-primary mb-3"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  Reviews / समीक्षाएँ
                </h3>
                <EmptyState
                  icon="default"
                  titleHi="अभी कोई review नहीं"
                  titleEn="No reviews yet"
                  descHi="पहले काम के बाद review आएगी"
                  descEn="Reviews will appear after the first job"
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Sticky action bar — only when worker profile is loaded */}
        {!loading && worker && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-border-light px-4 py-3 z-40">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <a
                  href={`tel:+91${worker.mobile}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary-green text-white font-bold py-2.5 rounded-2xl hover:bg-green-700 transition-colors text-sm"
                  aria-label="Call worker"
                >
                  <Phone size={16} />
                  <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>कॉल</span>
                  <span className="opacity-75">+91 {worker.mobile}</span>
                </a>
                <a
                  href={`https://wa.me/91${worker.mobile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white font-bold py-2.5 rounded-2xl hover:opacity-90 transition-opacity text-sm"
                  aria-label="WhatsApp worker"
                >
                  <MessageSquare size={16} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-primary-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p
          className="font-semibold text-text-primary text-sm truncate"
          style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
