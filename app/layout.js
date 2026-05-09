import { Inter } from "next/font/google";
import { Noto_Sans_Devanagari } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { WorkerStatusProvider } from "@/lib/context/WorkerStatusContext";
import { FilterProvider } from "@/lib/context/FilterContext";
import { ToastProvider } from "@/components/Toast";

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
      <body className="min-h-screen flex flex-col bg-neutral-bg text-text-primary antialiased">
        <Script
          src="https://control.msg91.com/app/assets/otp-provider/otp-provider.js"
          strategy="beforeInteractive"
        />
        <AuthProvider>
          <WorkerStatusProvider>
            <FilterProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </FilterProvider>
          </WorkerStatusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
