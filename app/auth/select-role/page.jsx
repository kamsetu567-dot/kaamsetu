'use client';
import Link from 'next/link';
import { ChevronLeft, Wrench, UserCheck, Store } from 'lucide-react';

export default function SelectRolePage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Top bar */}
      <div className="bg-brand-navy px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-white/70 hover:text-white min-h-0">
          <ChevronLeft size={24} />
        </Link>
        <span className="font-black text-white text-lg">KAAM<span className="text-brand-yellow">SETU</span></span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-black text-brand-navy font-hindi mb-2">
              आप क्या करना चाहते हैं?
            </h1>
            <p className="text-gray-500">What would you like to do?</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* Worker */}
            <Link href="/auth/signup/worker"
              className="bg-brand-navy text-white rounded-3xl p-8 flex flex-col items-center text-center card-hover border-2 border-transparent hover:border-brand-yellow transition-all">
              <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mb-4">
                <Wrench size={32} className="text-brand-navy" />
              </div>
              <h2 className="text-xl font-black font-hindi mb-1">काम ढूंढें</h2>
              <p className="text-sm text-white/60 mb-2">Find Work</p>
              <p className="text-white/80 text-sm font-hindi">अपने हुनर का काम पाएँ</p>
            </Link>

            {/* Client */}
            <Link href="/auth/signup/client"
              className="bg-white text-brand-navy rounded-3xl p-8 flex flex-col items-center text-center card-hover border-2 border-brand-navy hover:border-brand-yellow transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <UserCheck size={32} className="text-brand-navy" />
              </div>
              <h2 className="text-xl font-black font-hindi mb-1">सेवा लें</h2>
              <p className="text-sm text-gray-400 mb-2">Hire Worker</p>
              <p className="text-gray-600 text-sm font-hindi">भरोसेमंद वर्कर से काम करवाएँ</p>
            </Link>

            {/* Shop */}
            <Link href="/auth/signup/shop"
              className="bg-brand-yellow text-brand-navy rounded-3xl p-8 flex flex-col items-center text-center card-hover border-2 border-transparent hover:border-brand-navy transition-all">
              <div className="w-16 h-16 bg-brand-navy/10 rounded-2xl flex items-center justify-center mb-4">
                <Store size={32} className="text-brand-navy" />
              </div>
              <h2 className="text-xl font-black font-hindi mb-1">दुकान/Shop</h2>
              <p className="text-sm text-brand-navy/60 mb-2">Business Owner</p>
              <p className="text-brand-navy/80 text-sm font-hindi">अपनी दुकान का बढ़ावा दें</p>
            </Link>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            <span className="font-hindi">पहले से account है? </span>
            <Link href="/auth/login" className="text-brand-navy font-bold hover:underline">
              Login करें
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
