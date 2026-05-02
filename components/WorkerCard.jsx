import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, Clock, User } from "lucide-react";
import RatingStars from "./RatingStars";
import WorkerStatusBadge from "./WorkerStatusBadge";

export default function WorkerCard({ worker }) {
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
    home_visit: { hi: "घर पर आकर", en: "Home Visit" },
    shop_office: { hi: "दुकान/ऑफिस", en: "Shop/Office" },
    both: { hi: "दोनों", en: "Both" },
  };
  const st = serviceTypeLabel[serviceType] || serviceTypeLabel.both;

  return (
    <div className="bg-white rounded-2xl border-2 border-border-light p-4 hover:border-primary-orange hover:shadow-md transition-all">
      <div className="flex gap-3 mb-3">
        {/* Photo */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
          {photo ? (
            <Image src={photo} alt={`${name} photo`} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={32} className="text-gray-400" />
            </div>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-text-primary text-base truncate">{name}</h3>
            <WorkerStatusBadge status={status} size="sm" />
          </div>
          <p className="text-text-secondary text-sm truncate">{subcategory || category}</p>
          <RatingStars rating={rating} size={14} />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        {experience > 0 && (
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
            <Clock size={12} /> {experience} साल
          </span>
        )}
        {distance !== undefined && (
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
            <MapPin size={12} /> {distance} km
          </span>
        )}
        {gender && (
          <span className="bg-blue-50 text-primary-blue px-2 py-1 rounded-lg">
            {gender === "male" ? "पुरुष / Male" : "महिला / Female"}
          </span>
        )}
        <span className="bg-orange-50 text-primary-orange px-2 py-1 rounded-lg">
          <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>{st.hi}</span>
          <span> / {st.en}</span>
        </span>
      </div>

      {/* CTA */}
      <Link
        href={`/workers/${id}`}
        className="flex items-center justify-center gap-2 w-full bg-primary-green text-white font-bold text-base py-3 rounded-xl hover:bg-green-700 transition-colors min-h-12"
        aria-label={`Call ${name}`}
      >
        <Phone size={18} />
        <span style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}>📞 अभी कॉल करें</span>
        <span className="text-sm font-normal">/ Call Now</span>
      </Link>
    </div>
  );
}
