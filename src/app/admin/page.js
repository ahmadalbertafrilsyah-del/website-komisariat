"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { LayoutDashboard, Save, Sliders, Info, Image as ImageIcon, MapPin, Clock, FileText } from "lucide-react";

export default function AdminDashboardUtama() {
  const [loading, setLoading] = useState(true);
  
  // State lengkap untuk semua komponen Global & Footer
  const [globalConfig, setGlobalConfig] = useState({
    logoText: "PMII",
    komisariatName: "Komisariat UIN Malang",
    logoUrl: "", // Tautan gambar logo
    tentangPmii: "PMII Komisariat adalah organisasi mahasiswa Islam yang berkomitmen untuk membangun intelektual muslim yang berkarakter dan berakhlak mulia berdasarkan nilai-nilai Ahlussunnah Wal Jama'ah.",
    jamSeninJumat: "08:00 - 16:00 WIB",
    jamSabtuMinggu: "09:00 - 14:00 WIB",
    lokasi: "Jl. Gajayana No. 50\nKota Malang, Jawa Timur",
    footerText: "© 2026 PMII Komisariat. Powered by Divisi Kominfo."
  });

  // Ambil data dari Firebase saat halaman dibuka
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

  // Fungsi simpan data ke Firebase
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

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat panel kontrol...</p>;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard size={24} className="text-blue-600" /> Pusat Pengendalian Website
          </h1>
          <p className="text-sm text-slate-500 mt-1">Kelola isian komponen inti, identitas organisasi, logo, dan seluruh teks pada Footer.</p>
        </div>
      </div>

      <form onSubmit={handleSaveGlobal} className="space-y-6">
        
        {/* ================= BAGIAN 1: IDENTITAS UTAMA & LOGO ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center gap-2">
            <Sliders size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Identitas Utama & Logo Website</h2>
          </div>

          <div className="p-6 space-y-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Singkatan / Teks Logo Kotak</label>
                <input 
                  type="text" required
                  value={globalConfig.logoText}
                  onChange={(e) => setGlobalConfig({...globalConfig, logoText: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-semibold"
                  placeholder="Contoh: PMII"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Nama Sub-Judul Komisariat</label>
                <input 
                  type="text" required
                  value={globalConfig.komisariatName}
                  onChange={(e) => setGlobalConfig({...globalConfig, komisariatName: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-semibold"
                  placeholder="Contoh: Komisariat UIN Malang"
                />
              </div>
            </div>

            {/* Input URL Logo */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                 <ImageIcon size={16} className="text-blue-600"/> URL / Tautan Gambar Logo (Header & Loading)
              </label>
              <input 
                type="text" 
                value={globalConfig.logoUrl}
                onChange={(e) => setGlobalConfig({...globalConfig, logoUrl: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                placeholder="Tempelkan link gambar (misal dari Cloudinary, Google Drive, atau Imgur)..."
              />
              <p className="text-[11px] text-slate-400">Jika dikosongkan, website akan otomatis menggunakan teks kotak inisial (Gaya Lama).</p>
            </div>
          </div>
        </div>

        {/* ================= BAGIAN 2: PENGATURAN FOOTER ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Manajemen Konten Footer Kaki Halaman</h2>
          </div>

          <div className="p-6 space-y-6 max-w-4xl">
            
            {/* Tentang PMII */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Teks Tentang PMII Komisariat</label>
              <textarea 
                rows="3" required
                value={globalConfig.tentangPmii}
                onChange={(e) => setGlobalConfig({...globalConfig, tentangPmii: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none text-sm"
                placeholder="Tuliskan deskripsi singkat profil pergerakan..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Jam Operasional */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Clock size={16} className="text-amber-500"/> Jam Operasional
                </label>
                <div className="space-y-2">
                   <p className="text-xs font-semibold text-slate-500">Senin - Jumat</p>
                   <input 
                    type="text" required
                    value={globalConfig.jamSeninJumat}
                    onChange={(e) => setGlobalConfig({...globalConfig, jamSeninJumat: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                   <p className="text-xs font-semibold text-slate-500">Sabtu - Minggu</p>
                   <input 
                    type="text" required
                    value={globalConfig.jamSabtuMinggu}
                    onChange={(e) => setGlobalConfig({...globalConfig, jamSabtuMinggu: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Lokasi Sekretariat */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-500"/> Lokasi Sekretariat
                </label>
                <textarea 
                  rows="4" required
                  value={globalConfig.lokasi}
                  onChange={(e) => setGlobalConfig({...globalConfig, lokasi: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none text-sm"
                  placeholder="Jl. Gajayana No. 50&#10;Kota Malang, Jawa Timur"
                />
              </div>
            </div>

            {/* Hak Cipta */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-700 block">Teks Hak Cipta (Paling Bawah)</label>
              <input 
                type="text" required
                value={globalConfig.footerText}
                onChange={(e) => setGlobalConfig({...globalConfig, footerText: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Notifikasi & Tombol Simpan */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl bg-blue-50 p-4 rounded-xl border border-blue-100">
           <div className="flex items-start gap-2.5 text-xs text-blue-700">
             <Info size={16} className="shrink-0 mt-0.5" />
             <p>Perubahan yang Anda simpan akan langsung memperbarui tampilan Header, Animasi Loading, dan Footer secara real-time untuk pengunjung website.</p>
           </div>
           
           <button 
              type="submit" 
              className="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
            >
              Simpan Pembaruan <Save size={18} />
            </button>
        </div>

      </form>
    </div>
  );
}