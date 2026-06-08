"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { LayoutDashboard, Save, Sliders, Info, Image as ImageIcon, MapPin, Clock, FileText } from "lucide-react";

export default function AdminDashboardUtama() {
  const [loading, setLoading] = useState(true);
  
  const [globalConfig, setGlobalConfig] = useState({
    logoText: "PMII",
    komisariatName: "Komisariat UIN Malang",
    logoUrl: "",
    tentangPmii: "PMII Komisariat adalah organisasi mahasiswa Islam yang berkomitmen untuk membangun intelektual muslim yang berkarakter dan berakhlak mulia berdasarkan nilai-nilai Ahlussunnah Wal Jama'ah.",
    jamSeninJumat: "08:00 - 16:00 WIB",
    jamSabtuMinggu: "09:00 - 14:00 WIB",
    lokasi: "Jl. Gajayana No. 50\nKota Malang, Jawa Timur",
    footerText: "© 2026 PMII Komisariat. Powered by Divisi Kominfo."
  });

  useEffect(() => {
    async function loadGlobalSettings() {
      try {
        const docRef = doc(db, "website_config", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalConfig({ ...globalConfig, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Gagal mengambil data global:", error);
      } finally {
        setLoading(false);
      }
    }
    loadGlobalSettings();
  }, []);

  const handleSaveGlobal = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "website_config", "global");
      await setDoc(docRef, globalConfig);
      alert("Pengaturan Komponen Global Berhasil Disimpan!");
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  if (loading) return <p className="text-slate-500 text-sm font-medium">Memuat panel kontrol...</p>;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pusat Pengendalian Website</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola isian komponen inti, identitas organisasi, logo, dan seluruh teks pada antarmuka publik.</p>
      </div>

      <form onSubmit={handleSaveGlobal} className="space-y-8">
        
        {/* ================= BAGIAN 1: IDENTITAS UTAMA & LOGO ================= */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <Sliders size={18} className="text-slate-500" />
            <h2 className="text-base font-semibold text-slate-800">Identitas Utama & Logo Website</h2>
          </div>

          <div className="p-6 space-y-5 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Singkatan / Teks Logo Kotak</label>
                <input 
                  type="text" required
                  value={globalConfig.logoText}
                  onChange={(e) => setGlobalConfig({...globalConfig, logoText: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                  placeholder="Contoh: PMII"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Nama Sub-Judul Komisariat</label>
                <input 
                  type="text" required
                  value={globalConfig.komisariatName}
                  onChange={(e) => setGlobalConfig({...globalConfig, komisariatName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                  placeholder="Contoh: Komisariat UIN Malang"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-1.5">
                 <ImageIcon size={16} className="text-slate-500"/> URL / Tautan Gambar Logo
              </label>
              <input 
                type="text" 
                value={globalConfig.logoUrl}
                onChange={(e) => setGlobalConfig({...globalConfig, logoUrl: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                placeholder="Tempelkan link gambar eksternal di sini..."
              />
              <p className="text-xs text-slate-500 mt-1.5">Jika dikosongkan, website akan otomatis menggunakan teks kotak inisial sebagai logo utama.</p>
            </div>
          </div>
        </div>

        {/* ================= BAGIAN 2: PENGATURAN FOOTER ================= */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <FileText size={18} className="text-slate-500" />
            <h2 className="text-base font-semibold text-slate-800">Manajemen Konten Footer</h2>
          </div>

          <div className="p-6 space-y-6 max-w-4xl">
            
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Teks Tentang PMII Komisariat</label>
              <textarea 
                rows="3" required
                value={globalConfig.tentangPmii}
                onChange={(e) => setGlobalConfig({...globalConfig, tentangPmii: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm resize-none"
                placeholder="Tuliskan deskripsi singkat profil pergerakan..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Clock size={16} className="text-slate-500"/> Jam Operasional
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Senin - Jumat</p>
                    <input 
                      type="text" required
                      value={globalConfig.jamSeninJumat}
                      onChange={(e) => setGlobalConfig({...globalConfig, jamSeninJumat: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Sabtu - Minggu</p>
                    <input 
                      type="text" required
                      value={globalConfig.jamSabtuMinggu}
                      onChange={(e) => setGlobalConfig({...globalConfig, jamSabtuMinggu: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                  <MapPin size={16} className="text-slate-500"/> Lokasi Sekretariat
                </label>
                <textarea 
                  rows="3" required
                  value={globalConfig.lokasi}
                  onChange={(e) => setGlobalConfig({...globalConfig, lokasi: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm resize-none mt-2"
                  placeholder="Jl. Gajayana No. 50&#10;Kota Malang, Jawa Timur"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Teks Hak Cipta (Paling Bawah)</label>
              <input 
                type="text" required
                value={globalConfig.footerText}
                onChange={(e) => setGlobalConfig({...globalConfig, footerText: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl bg-slate-50 p-4 rounded-lg border border-slate-200">
           <div className="flex items-start gap-2.5 text-sm text-slate-600">
             <Info size={18} className="shrink-0 text-slate-400" />
             <p>Perubahan yang disimpan akan langsung memperbarui antarmuka pengunjung secara real-time.</p>
           </div>
           
           <button 
              type="submit" 
              className="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              Simpan Pembaruan
            </button>
        </div>

      </form>
    </div>
  );
}