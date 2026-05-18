'use client';
import { useT } from '@/lib/i18n/useT';
import { CATEGORIES } from '@/lib/data/categories';

export default function CategoriesHeading() {
  const t = useT();
  return (
    <div className="mb-8">
      <h1
        className="text-3xl md:text-4xl font-black text-brand-navy mb-2"
        style={{ fontFamily: 'var(--font-noto-devanagari), sans-serif' }}
      >
        {t({ hi: 'सभी सेवाएँ', en: 'All Services' })}
      </h1>
      <p className="text-gray-500 text-lg">
        {t({ hi: `सभी श्रेणियां (${CATEGORIES.length})`, en: `All Service Categories (${CATEGORIES.length})` })}
      </p>
    </div>
  );
}
