'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('hi');

  useEffect(() => {
    const saved = localStorage.getItem('kaamsetu_lang');
    if (saved === 'en' || saved === 'hi') setLang(saved);
  }, []);

  function toggleLang() {
    const next = lang === 'hi' ? 'en' : 'hi';
    setLang(next);
    localStorage.setItem('kaamsetu_lang', next);
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
