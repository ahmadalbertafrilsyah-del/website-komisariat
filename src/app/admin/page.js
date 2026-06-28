"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Sliders, Info, Image as ImageIcon, MapPin, Clock, FileText, QrCode, UploadCloud, Loader2 } from "lucide-react";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function AdminDashboardUtama() {
  const [loading, setLoading] = useState(true);
  const [uploadingBg, setUploadingBg] = useState(false);
  
  const [globalConfig, setGlobalConfig] = useState({
    logoText: "PMII",
    komisariatName: "Komisariat UIN Malang",
    logoUrl: "",
    tentangPmii: "PMII Komisariat adalah organisasi mahasiswa Islam yang berkomitmen untuk membangun intelektual muslim yang berkarakter dan berakhlak mulia berdasarkan nilai-nilai Ahlussunnah Wal Jama'ah.",
    jamSeninJumat: "08:00 - 16:00 WIB",
    jamSabtuMinggu: "09:00 - 14:00 WIB",
    lokasi: "Jl. Gajayana No. 50\nKota Malang, Jawa Timur",
    footerText: "© 2026 PMII Komisariat. Powered by Divisi Kominfo.",
    qrisString: "",
    qrisBackgroundUrl: "" 
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

  const handleUploadBg = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      alert("Konfigurasi Cloudinary di .env.local belum diatur!");
      return;
    }

    setUploadingBg(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setGlobalConfig({ ...globalConfig, qrisBackgroundUrl: data.secure_url });
    } catch (error) {
      alert("Gagal mengunggah gambar ke Cloudinary.");
    } finally {
      setUploadingBg(false);
      e.target.value = null;
    }
  };

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

  // Variabel style untuk input agar konsisten dan rapi
  const inputStyle = "w-full px-3 py-2 border border-slate-300 rounded-md text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white";
  const labelStyle = "text-[13px] font-semibold text-slate-700 block mb-1.5";

  return (
    <div className="space-y-6 pb-12 w-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pusat Pengendalian Website</h1>
          <p className="text-[13px] text-slate-500 mt-1">Kelola komponen inti, identitas organisasi, logo, dan teks utama.</p>
        </div>
        <button onClick={handleSaveGlobal} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-md transition-colors flex items-center justify-center gap-2 text-[13px] shadow-sm shrink-0">
          <Save size={16} /> Simpan Perubahan
        </button>
      </div>

      <form onSubmit={handleSaveGlobal} className="space-y-6">
        
        {/* IDENTITAS UTAMA & LOGO */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
            <Sliders size={16} className="text-slate-600" />
            <h2 className="text-sm font-bold text-slate-800">Identitas & Logo</h2>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Singkatan / Teks Logo Kotak</label>
                <input type="text" required value={globalConfig.logoText} onChange={(e) => setGlobalConfig({...globalConfig, logoText: e.target.value})} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Nama Sub-Judul Komisariat</label>
                <input type="text" required value={globalConfig.komisariatName} onChange={(e) => setGlobalConfig({...globalConfig, komisariatName: e.target.value})} className={inputStyle} />
              </div>
            </div>

            <div>
              <label className={`${labelStyle} flex items-center gap-1.5`}>
                 <ImageIcon size={14} className="text-slate-500"/> URL Gambar Logo
              </label>
              <input type="text" value={globalConfig.logoUrl} onChange={(e) => setGlobalConfig({...globalConfig, logoUrl: e.target.value})} className={inputStyle} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* PENGATURAN QRIS & DONASI */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
            <QrCode size={16} className="text-slate-600" />
            <h2 className="text-sm font-bold text-slate-800">Pengaturan QRIS & Donasi</h2>
          </div>
          
          <div className="p-5 space-y-5">
            <div>
              <label className={labelStyle}>String Payload QRIS</label>
              <textarea 
                rows="2" value={globalConfig.qrisString || ""} onChange={(e) => setGlobalConfig({...globalConfig, qrisString: e.target.value})}
                className={`${inputStyle} font-mono text-[12px] bg-slate-50 resize-none`}
                placeholder="00020101021126610014ID.CO.QRIS.WWW..."
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Digunakan untuk auto-generate nominal pembayaran QR secara dinamis.</p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className={labelStyle}>Template Background QRIS</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                 <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors border shrink-0 ${uploadingBg ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                   {uploadingBg ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={14} /> Pilih Template JPG/PNG</>}
                   <input type="file" accept="image/*" className="hidden" onChange={handleUploadBg} disabled={uploadingBg} />
                 </label>
                 <input 
                   type="url" value={globalConfig.qrisBackgroundUrl || ""} onChange={(e) => setGlobalConfig({...globalConfig, qrisBackgroundUrl: e.target.value})}
                   className={`${inputStyle} font-mono text-[12px] bg-slate-50 text-slate-600`}
                   placeholder="Otomatis terisi saat gambar diupload..." readOnly={uploadingBg}
                 />
              </div>
            </div>
          </div>
        </div>

        {/* PENGATURAN FOOTER */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
            <FileText size={16} className="text-slate-600" />
            <h2 className="text-sm font-bold text-slate-800">Manajemen Konten Footer</h2>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <label className={labelStyle}>Tentang PMII Komisariat</label>
              <textarea rows="3" required value={globalConfig.tentangPmii} onChange={(e) => setGlobalConfig({...globalConfig, tentangPmii: e.target.value})} className={`${inputStyle} resize-none`} />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <label className={`${labelStyle} flex items-center gap-1.5 border-b border-slate-100 pb-2`}>
                  <Clock size={14} className="text-slate-500"/> Jam Operasional
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Senin - Jumat</p>
                    <input type="text" required value={globalConfig.jamSeninJumat} onChange={(e) => setGlobalConfig({...globalConfig, jamSeninJumat: e.target.value})} className={inputStyle}/>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sabtu - Minggu</p>
                    <input type="text" required value={globalConfig.jamSabtuMinggu} onChange={(e) => setGlobalConfig({...globalConfig, jamSabtuMinggu: e.target.value})} className={inputStyle}/>
                  </div>
                </div>
              </div>

              <div>
                <label className={`${labelStyle} flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2`}>
                  <MapPin size={14} className="text-slate-500"/> Lokasi Sekretariat
                </label>
                <textarea rows="2" required value={globalConfig.lokasi} onChange={(e) => setGlobalConfig({...globalConfig, lokasi: e.target.value})} className={`${inputStyle} resize-none mt-1`}/>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className={labelStyle}>Teks Hak Cipta</label>
              <input type="text" required value={globalConfig.footerText} onChange={(e) => setGlobalConfig({...globalConfig, footerText: e.target.value})} className={inputStyle}/>
            </div>
          </div>
        </div>

        {/* Info Tambahan */}
        <div className="flex items-center gap-2.5 text-[12px] text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-200">
          <Info size={16} className="shrink-0 text-blue-500" />
          <p>Setiap perubahan akan otomatis disinkronkan secara *real-time* ke sistem database dan tampil ke pengunjung.</p>
        </div>

      </form>
    </div>
  );
}