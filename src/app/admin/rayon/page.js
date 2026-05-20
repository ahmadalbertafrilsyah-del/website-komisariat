"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, MapPin, Plus, Trash2, Image as ImageIcon, ExternalLink, Shield, BookOpen, Info, Compass, ChevronDown, ChevronUp, UploadCloud, Loader2 } from "lucide-react";

export default function AdminRayonEditor() {
  const [loading, setLoading] = useState(true);
  const [rayonData, setRayonData] = useState([]);
  
  const [newRayonName, setNewRayonName] = useState("");
  const [newRayonFakultas, setNewRayonFakultas] = useState("");
  
  // State untuk membuka/menutup panel Pengurus Inti di tabel Admin
  const [openAccordion, setOpenAccordion] = useState(null);

  // State untuk melacak proses upload Cloudinary
  const [uploadingIdx, setUploadingIdx] = useState(null);

  useEffect(() => {
    async function loadRayon() {
      try {
        // PERBAIKAN: Menggunakan "database_rayon" sesuai database asli Anda
        const docRef = doc(db, "website_config", "database_rayon");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listRayon) {
          setRayonData(docSnap.data().listRayon);
        } else {
          setRayonData([]);
        }
      } catch (error) {
        console.error("Gagal mengambil data rayon:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRayon();
  }, []);

  const handleInputChange = (idx, field, value) => {
    const updated = [...rayonData];
    updated[idx][field] = value;
    setRayonData(updated);
  };

  const handleAddRayon = (e) => {
    e.preventDefault();
    if (!newRayonName.trim()) return;
    const updated = [...rayonData, { 
      nama: newRayonName.trim(), 
      fakultas: newRayonFakultas.trim(), 
      deskripsi: "", 
      logoUrl: "", // Field Logo Baru
      ketua: "", waKetua: "", 
      sekretaris: "", waSekret: "", 
      bendahara: "", waBendum: "", 
      coKaderisasi: "", waKaderisasi: "", 
      coGerakan: "", waGerakan: "" 
    }];
    setRayonData(updated);
    setNewRayonName("");
    setNewRayonFakultas("");
  };

  const handleDeleteRayon = (idx) => {
    if (!confirm("Hapus data rayon ini secara permanen?")) return;
    const updated = rayonData.filter((_, i) => i !== idx);
    setRayonData(updated);
  };

  // ================= FUNGSI UPLOAD GAMBAR KE CLOUDINARY =================
  const handleImageUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar (PNG/JPG)!");
      e.target.value = null;
      return;
    }

    setUploadingIdx(idx);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload gagal");
      
      const data = await res.json();
      handleInputChange(idx, "logoUrl", data.url); // Langsung isi ke kolom rayon
      alert("Logo Rayon berhasil diunggah!");
    } catch (error) {
      console.error(error);
      alert("Gagal mengunggah gambar. Pastikan API Cloudinary sudah benar.");
    } finally {
      setUploadingIdx(null);
      e.target.value = null; // Reset input file
    }
  };

  const handleSaveGlobal = async (e) => {
    e.preventDefault();
    try {
      // PERBAIKAN: Menyimpan kembali ke "database_rayon"
      const docRef = doc(db, "website_config", "database_rayon");
      await setDoc(docRef, { listRayon: rayonData });
      alert("Seluruh data Rayon & Pengurus Inti berhasil disimpan ke Database!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat database rayon...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto">
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Compass size={24} className="text-blue-600" /> Profil Rayon Se-Komisariat
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola data narasi, logo, dan jajaran pengurus inti masing-masing rayon.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5"><Plus size={16} className="text-blue-600" /> Tambah Rayon Baru</h2>
        <form onSubmit={handleAddRayon} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-grow w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Rayon</label>
            <input type="text" required value={newRayonName} onChange={(e) => setNewRayonName(e.target.value)} placeholder="Misal: Rayon Pencerahan Galileo" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex-grow w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fakultas / Basis</label>
            <input type="text" required value={newRayonFakultas} onChange={(e) => setNewRayonFakultas(e.target.value)} placeholder="Misal: Fakultas Sains dan Teknologi" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2.5 px-6 rounded-xl text-sm flex items-center justify-center gap-1.5 transition whitespace-nowrap">
            <Plus size={16}/> Buat Rayon
          </button>
        </form>
      </div>

      <form onSubmit={handleSaveGlobal} className="space-y-4">
        <div className="space-y-4">
          {rayonData.map((rayon, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              
              {/* Header Kartu Rayon */}
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                <div className="flex items-center gap-3 w-full sm:w-1/2">
                   <Shield size={20} className="text-blue-600 shrink-0"/>
                   <input type="text" value={rayon.nama} onChange={(e) => handleInputChange(idx, "nama", e.target.value)} className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full" placeholder="Nama Rayon..."/>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                   <input type="text" value={rayon.fakultas} onChange={(e) => handleInputChange(idx, "fakultas", e.target.value)} className="text-sm font-semibold text-blue-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-right w-full sm:w-40" placeholder="Fakultas..."/>
                   <button type="button" onClick={() => handleDeleteRayon(idx)} className="text-slate-400 hover:text-red-500 p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Deskripsi & Upload Logo Terintegrasi */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Singkat Rayon</label>
                    <textarea rows="2" value={rayon.deskripsi} onChange={(e) => handleInputChange(idx, "deskripsi", e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-600 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Jelaskan fokus atau sejarah singkat rayon ini..."/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1"><UploadCloud size={14}/> Logo Rayon (PNG)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                       <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingIdx === idx ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-sm'}`}>
                         {uploadingIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                         <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx)} disabled={uploadingIdx !== null} />
                       </label>
                       <input type="text" value={rayon.logoUrl || ""} onChange={(e) => handleInputChange(idx, "logoUrl", e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono text-emerald-600 outline-none" placeholder="URL otomatis..."/>
                    </div>
                  </div>
                </div>

                {/* Accordion Pengurus Inti */}
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setOpenAccordion(openAccordion === idx ? null : idx)} className="w-full bg-slate-50 hover:bg-slate-100 p-3 flex items-center justify-between text-xs font-bold text-slate-700 transition">
                    <span className="flex items-center gap-2"><UsersIcon size={14}/> Form Pengurus Inti Rayon</span>
                    {openAccordion === idx ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </button>
                  
                  {openAccordion === idx && (
                    <div className="p-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white border-t border-slate-100">
                       <div className="space-y-1"><label className="text-[10px] font-bold text-blue-600 uppercase">Ketua Rayon</label><input type="text" placeholder="Nama..." value={rayon.ketua || ""} onChange={(e) => handleInputChange(idx, "ketua", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waKetua || ""} onChange={(e) => handleInputChange(idx, "waKetua", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                       <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Sekretaris</label><input type="text" placeholder="Nama..." value={rayon.sekretaris || ""} onChange={(e) => handleInputChange(idx, "sekretaris", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waSekret || ""} onChange={(e) => handleInputChange(idx, "waSekret", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                       <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Bendahara</label><input type="text" placeholder="Nama..." value={rayon.bendahara || ""} onChange={(e) => handleInputChange(idx, "bendahara", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waBendum || ""} onChange={(e) => handleInputChange(idx, "waBendum", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                       <div className="space-y-1"><label className="text-[10px] font-bold text-emerald-600 uppercase">CO Kaderisasi</label><input type="text" placeholder="Nama..." value={rayon.coKaderisasi || ""} onChange={(e) => handleInputChange(idx, "coKaderisasi", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waKaderisasi || ""} onChange={(e) => handleInputChange(idx, "waKaderisasi", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                       <div className="space-y-1"><label className="text-[10px] font-bold text-amber-600 uppercase">CO Gerakan</label><input type="text" placeholder="Nama..." value={rayon.coGerakan || ""} onChange={(e) => handleInputChange(idx, "coGerakan", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs"/><input type="text" placeholder="No. WA (628...)" value={rayon.waGerakan || ""} onChange={(e) => handleInputChange(idx, "waGerakan", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"/></div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

        {rayonData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 sticky bottom-4 z-40 shadow-xl shadow-blue-500/5">
             <div className="flex items-start gap-2 text-xs text-blue-700">
               <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
               <p>Klik tombol awan (<UploadCloud size={12} className="inline"/>) untuk unggah logo otomatis. Klik Simpan agar perubahan data pengurus inti dan logo tayang ke publik.</p>
             </div>
             <button type="submit" disabled={uploadingIdx !== null} className="w-full sm:w-auto bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md text-sm whitespace-nowrap shrink-0">
                <Save size={18} /> Simpan Seluruh Data Rayon
             </button>
          </div>
        )}
      </form>
    </div>
  );
}

// Icon kecil tambahan untuk button
const UsersIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);