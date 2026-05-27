'use client';
import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, Clock, User } from "lucide-react";
import RatingStars from "./RatingStars";
import WorkerStatusBadge from "./WorkerStatusBadge";
import { useT } from "@/lib/i18n/useT";

export default function WorkerCard({ worker }) {
  const t = useT();
  const {
    id,
    name,
    photo,
    rating = 0,
    experience = 0,
    distance,
    category,
    subcategory,
    gender,
    serviceType,
    status = "free",
  } = worker;

  const serviceTypeLabel = {
    home_visit:  { hi: "घर पर आकर",  en: "Home Visit" },
    shop_office: { hi: "दुकान/ऑफिस", en: "Shop/Office" },
    both:        { hi: "दोनों",       en: "Both" },
  };
  const st = serviceTypeLabel[serviceType] || serviceTypeLabel.both;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 hover:border-brand-yellow hover:shadow-md transition-all">
      <div className="flex gap-3 mb-3">
        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
          {photo ? (
            <img src={photo} alt={`${name} photo`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={32} className="text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-brand-navy text-base truncate">{name}</h3>
            <WorkerStatusBadge status={status} size="sm" />
          </div>
          <p className="text-gray-500 text-sm truncate">{subcategory || category}</p>
          <RatingStars rating={rating} size={14} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        {experience > 0 && (
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
            <Clock size={12} /> {experience} {t({ hi: 'साल', en: 'yrs' })}
          </span>
        )}
        {distance !== undefined && (
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
            <MapPin size={12} /> {distance} km
          </span>
        )}
        {gender && (
          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
            {gender === "male" ? t({ hi: 'पुरुष', en: 'Male' }) : t({ hi: 'महिला', en: 'Female' })}
          </span>
        )}
        <span className="bg-brand-yellow/20 text-brand-navy px-2 py-1 rounded-lg font-hindi">
          {t(st)}
        </span>
      </div>

      <Link
        href={`/workers/${id}`}
        className="flex items-center justify-center gap-2 w-full bg-brand-navy text-white font-bold text-base py-3 rounded-xl hover:opacity-90 transition-opacity min-h-12"
        aria-label={`Call ${name}`}
      >
        <Phone size={18} />
        <span className="font-hindi">{t({ hi: 'अभी कॉल करें', en: 'Call Now' })}</span>
      </Link>
    </div>
  );
}
