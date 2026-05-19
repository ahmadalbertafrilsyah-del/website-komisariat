"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Link as LinkIcon, Newspaper } from "lucide-react";

export default function AdminBerita() {
  const [loading, setLoading] = useState(true);
  const [externalLink, setExternalLink] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try {
        const docRef = doc(db, "website_config", "berita_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExternalLink(docSnap.data().externalNewsLink || "");
        }
      } catch (error) {
        console.error("Gagal mengambil data konfigurasi berita:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "website_config", "berita_config");
      await setDoc(docRef, { externalNewsLink: externalLink }, { merge: true });
      alert("Pengaturan Tautan Berita Utama Berhasil Disimpan!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat modul berita...</p>;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Newspaper size={24} className="text-blue-600" /> Manajemen Arsip & Portal Berita
        </h1>
        <p className="text-sm text-slate-500 mt-1">Kelola tautan portal berita eksternal dan publikasi artikel Anda di sini.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden max-w-3xl">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800">
           <LinkIcon size={18} className="text-blue-600" /> Konfigurasi Tautan Portal Utama
        </div>
        <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Tautan Web Berita Utama (Contoh: Wordpress)</label>
            <input 
              type="url" 
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="https://beritapmii.com..."
            />
            <p className="text-[11px] text-slate-500 mt-2">
              Jika Anda mengisi kolom ini, akan muncul tombol besar <strong>"Kunjungi Portal Berita Utama Kami"</strong> di halaman Berita. Jika dikosongkan, tombol tersebut akan otomatis hilang.
            </p>
          </div>
          
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              Simpan Tautan <Save size={16} />
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-10 text-center max-w-3xl">
         <p className="text-slate-500">Fitur penambahan dan pengeditan Artikel Firebase akan segera diimplementasikan di sini.</p>
      </div>

    </div>
  );
}