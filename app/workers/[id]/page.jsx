"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Phone, Send, User, MapPin, Clock,
  Star, ShieldCheck, ChevronLeft, ChevronRight,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkerStatusBadge from "@/components/WorkerStatusBadge";
import RatingStars from "@/components/RatingStars";
import EmptyState from "@/components/EmptyState";
import { getWorkerById } from "@/lib/api/workers";

// Skeleton for the full profile while loading
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

// Simple photo gallery carousel
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
          {/* Dots */}
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
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    getWorkerById(id)
      .then(setWorker)
      .finally(() => setLoading(false));
  }, [id]);

  const serviceTypeLabel = {
    home_visit: { hi: "घर पर आकर", en: "Home Visit" },
    shop_office: { hi: "दुकान/ऑफिस पर", en: "Shop/Office" },
    both: { hi: "दोनों", en: "Both" },
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-neutral-bg pb-28">

        {/* Back nav + blue bar */}
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
          ) : worker === null ? (
            /* Worker not found (API returns null for now) — show placeholder */
            <div className="bg-white rounded-3xl border-2 border-border-light p-6">
              <div className="text-center py-8">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <User size={48} className="text-gray-400" />
                </div>
                <p
                  className="text-xl font-black text-text-primary mb-1"
                  style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                >
                  वर्कर का प्रोफ़ाइल
                </p>
                <p className="text-text-secondary text-sm mb-1">Worker Profile</p>
                <div className="inline-flex items-center gap-2 mt-2">
                  <WorkerStatusBadge status="free" size="md" />
                </div>

                {/* Demo info block */}
                <div className="mt-6 bg-neutral-bg rounded-2xl p-4 text-left space-y-3">
                  <InfoRow icon={Star} label="Rating / रेटिंग" value="— (No data yet)" />
                  <InfoRow icon={Clock} label="Experience / अनुभव" value="— years" />
                  <InfoRow icon={MapPin} label="Location / लोकेशन" value="—" />
                  <InfoRow icon={User} label="Gender / लिंग" value="—" />
                  <InfoRow icon={ShieldCheck} label="Service Type / सेवा प्रकार" value="—" />
                </div>

                {/* Work photos placeholder */}
                <div className="mt-5 text-left">
                  <h3
                    className="font-bold text-text-primary mb-2"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    काम की फ़ोटो / Work Photos
                  </h3>
                  <div className="bg-gray-100 rounded-2xl h-40 flex items-center justify-center">
                    <p className="text-text-secondary text-sm">No photos uploaded yet</p>
                  </div>
                </div>

                {/* Skills/tags placeholder */}
                <div className="mt-5 text-left">
                  <h3
                    className="font-bold text-text-primary mb-2"
                    style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
                  >
                    Skills / हुनर
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["—", "—", "—"].map((s, i) => (
                      <span key={i} className="bg-blue-50 text-primary-blue text-sm px-3 py-1 rounded-full border border-blue-100">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Real worker data */
            <>
              {/* Header card */}
              <div className="bg-white rounded-3xl border-2 border-border-light p-6">
                <div className="flex gap-4 mb-5">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-4 border-primary-blue">
                    {worker.photo ? (
                      <Image src={worker.photo} alt={`${worker.name} photo`} fill className="object-cover" />
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
                      <WorkerStatusBadge status={worker.status || "free"} size="md" />
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-3 border-t border-border-light pt-4">
                  {worker.experience > 0 && (
                    <InfoRow icon={Clock}
                      label="अनुभव / Experience"
                      value={`${worker.experience} साल / years`}
                    />
                  )}
                  {worker.location && (
                    <InfoRow icon={MapPin} label="लोकेशन / Location" value={worker.location} />
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
                </div>
              </div>

              {/* Work Photos */}
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

              {/* Skills */}
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

              {/* Reviews */}
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
          )}
        </div>

        {/* Sticky bottom action buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-border-light px-4 py-3 z-40">
          <div className="max-w-2xl mx-auto flex gap-3">
            {requestSent ? (
              <div className="flex-1 text-center bg-green-50 border-2 border-primary-green text-primary-green font-bold py-3 rounded-2xl">
                <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>✅ Request भेज दी!</span>
                <span className="text-sm font-normal block">Request sent!</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setRequestSent(true)}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-blue text-primary-blue font-bold py-3 rounded-2xl hover:bg-blue-50 transition-colors"
                  aria-label="Send service request"
                >
                  <Send size={18} />
                  <div>
                    <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>Request भेजें</span>
                    <span className="text-xs font-normal block">/ Send Request</span>
                  </div>
                </button>
                <a
                  href={worker?.mobile ? `tel:+91${worker.mobile}` : "#"}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-green text-white font-bold py-3 rounded-2xl hover:bg-green-700 transition-colors"
                  aria-label="Call worker now"
                >
                  <Phone size={18} />
                  <div>
                    <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>अभी कॉल करें</span>
                    <span className="text-xs font-normal block">/ Call Now</span>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// Small helper row for info items
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
