import { Inter } from "next/font/google";
import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { WorkerStatusProvider } from "@/lib/context/WorkerStatusContext";
import { FilterProvider } from "@/lib/context/FilterContext";
import { ToastProvider } from "@/components/Toast";
import { LanguageProvider } from "@/lib/context/LanguageContext";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "KaamSetu — हर काम, हर जगह",
  description:
    "KaamSetu — मिस्त्री, हलवाई, डांसर, ट्यूटर — सभी सेवाएँ एक ही जगह पर। India's Hindi-first local service marketplace.",
  keywords: "plumber, halwai, dancer, tutor, mistri, electrician, kaamsetu",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi" className={`${inter.variable} ${notoDevanagari.variable}`}>
      <body className="min-h-screen flex flex-col bg-brand-bg text-brand-navy antialiased">
        <LanguageProvider>
          <AuthProvider>
            <WorkerStatusProvider>
              <FilterProvider>
                <ToastProvider>
                  {children}
                  <FloatingWhatsApp />
                </ToastProvider>
              </FilterProvider>
            </WorkerStatusProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
