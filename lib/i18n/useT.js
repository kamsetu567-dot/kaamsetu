'use client';
import { useLang } from '@/lib/context/LanguageContext';

// Usage: const t = useT();  then  t({ hi: 'खोजें', en: 'Search' })
export function useT() {
  const { lang } = useLang();
  return (obj) => obj?.[lang] ?? obj?.hi ?? '';
}
