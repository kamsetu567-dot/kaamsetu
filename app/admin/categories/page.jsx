"use client";

import { useState, useEffect } from "react";
import { Tag, Trash2, CheckCircle, Clock, PlusCircle } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { CATEGORIES } from "@/lib/data/categories";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n/useT";

export default function AdminCategoriesPage() {
  const t = useT();
  const [custom, setCustom] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newNameHi, setNewNameHi] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadCustom(); }, []);

  async function loadCustom() {
    setLoading(true);
    try {
      const data = await apiGet("/api/categories/custom");
      setCustom(data.categories || []);
    } catch {}
    setLoading(false);
  }

  async function handleApprove(id) {
    try {
      await apiPatch(`/api/categories/custom/${id}`, { status: "approved" });
      await loadCustom();
    } catch {}
  }

  async function handleDelete(id) {
    if (!confirm(t({ hi: 'इस कैटेगरी को delete करें?', en: 'Delete this category?' }))) return;
    try {
      await apiPatch(`/api/categories/custom/${id}`, { status: "deleted" });
      await loadCustom();
    } catch {}
  }

  async function handleAddNew(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await apiPost("/api/categories/custom", { nameEn: newName.trim(), nameHi: newNameHi.trim() || newName.trim() });
      setNewName("");
      setNewNameHi("");
      await loadCustom();
    } catch {}
    setAdding(false);
  }

  const pendingCustom = custom.filter(c => c.status === "pending");
  const approvedCustom = custom.filter(c => c.status === "approved");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-brand-navy font-hindi">{t({ hi: 'कैटेगरी प्रबंधन', en: 'Category Management' })}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{t({ hi: 'इन-बिल्ट और यूज़र द्वारा सबमिट की गई कैटेगरी मैनेज करें', en: 'Manage built-in and user-submitted categories' })}</p>
      </div>

      {/* Add new custom category */}
      <div className="bg-white rounded-3xl border-2 border-brand-navy p-5">
        <h2 className="font-black text-brand-navy mb-4 flex items-center gap-2">
          <PlusCircle size={18} className="text-orange-500" /> {t({ hi: 'नई कैटेगरी जोड़ें', en: 'Add New Category' })}
        </h2>
        <form onSubmit={handleAddNew} className="flex flex-col sm:flex-row gap-3">
          <input value={newNameHi} onChange={e => setNewNameHi(e.target.value)}
            placeholder={t({ hi: 'हिंदी नाम (जैसे: सफाई सेवा)', en: 'Hindi name (e.g. सफाई सेवा)' })}
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-navy font-hindi" />
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder={t({ hi: 'अंग्रेज़ी नाम (जैसे: Cleaning Service)', en: 'English name (e.g. Cleaning Service)' })}
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-navy" />
          <button type="submit" disabled={adding || !newName.trim()}
            className="bg-brand-navy text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50 whitespace-nowrap">
            {adding ? t({ hi: 'जोड़ रहे हैं...', en: 'Adding...' }) : t({ hi: 'जोड़ें', en: 'Add' })}
          </button>
        </form>
      </div>

      {/* Built-in categories (read-only display) */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h2 className="font-black text-brand-navy mb-4 flex items-center gap-2">
          <Tag size={18} className="text-blue-500" /> {t({ hi: 'इन-बिल्ट कैटेगरी', en: 'Built-in Categories' })} ({CATEGORIES.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-brand-navy truncate font-hindi">{cat.nameHi}</p>
                <p className="text-xs text-gray-400 truncate">{cat.nameEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending custom categories */}
      {pendingCustom.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-orange-200 p-5">
          <h2 className="font-black text-brand-navy mb-4 flex items-center gap-2">
            <Clock size={18} className="text-orange-500" /> {t({ hi: 'अप्रूवल के लिए लंबित', en: 'Pending Approval' })} ({pendingCustom.length})
          </h2>
          <div className="space-y-2">
            {pendingCustom.map(cat => (
              <div key={cat._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                <div>
                  <p className="font-bold text-brand-navy text-sm font-hindi">{cat.nameHi}</p>
                  <p className="text-xs text-gray-500">{cat.nameEn} · Slug: {cat.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(cat._id)}
                    className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-xl hover:bg-green-200">
                    <CheckCircle size={12} /> {t({ hi: 'अप्रूव', en: 'Approve' })}
                  </button>
                  <button onClick={() => handleDelete(cat._id)}
                    className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-xl hover:bg-red-200">
                    <Trash2 size={12} /> {t({ hi: 'डिलीट', en: 'Delete' })}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved custom categories */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5">
        <h2 className="font-black text-brand-navy mb-4 flex items-center gap-2">
          <CheckCircle size={18} className="text-green-600" /> {t({ hi: 'अप्रूव की गई कस्टम कैटेगरी', en: 'Approved Custom' })} ({approvedCustom.length})
        </h2>
        {loading ? (
          <p className="text-gray-400 text-sm">{t({ hi: 'लोड हो रहा है...', en: 'Loading...' })}</p>
        ) : approvedCustom.length === 0 ? (
          <EmptyState icon="default" titleHi="कोई Custom Category नहीं" titleEn="No approved custom categories" descHi="" descEn="" />
        ) : (
          <div className="space-y-2">
            {approvedCustom.map(cat => (
              <div key={cat._id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div>
                  <p className="font-bold text-brand-navy text-sm font-hindi">{cat.nameHi}</p>
                  <p className="text-xs text-gray-500">{cat.nameEn} · Slug: {cat.slug}</p>
                </div>
                <button onClick={() => handleDelete(cat._id)}
                  className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-xl hover:bg-red-200">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
