"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, MapPin, Plus, Trash2, Image as ImageIcon, ExternalLink, Shield, BookOpen, Info, Compass, ChevronDown, ChevronUp, UploadCloud, Loader2, Home, AtSign, Users } from "lucide-react";

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
      logoUrl: "", 
      alamat: "",     
      mapUrl: "",     
      igUrl: "",      
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
      handleInputChange(idx, "logoUrl", data.url); 
    } catch (error) {
      console.error(error);
      alert("Gagal mengunggah gambar. Pastikan API Cloudinary sudah benar.");
    } finally {
      setUploadingIdx(null);
      e.target.value = null; 
    }
  };

  const handleSaveGlobal = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "website_config", "database_rayon");
      await setDoc(docRef, { listRayon: rayonData });
      alert("Seluruh data Rayon & Pengurus Inti berhasil disimpan ke Database!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  const inputStandardClass = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm";
  const labelStandardClass = "text-xs font-semibold text-slate-700 block mb-1.5";

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header Halaman */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Profil Rayon
        </h1>
        <p className="text-sm text-slate-500 mt-1">Kelola narasi, logo, basis fakultas, serta data pengurus inti masing-masing rayon.</p>
      </div>

      {/* Form Tambah Rayon Baru */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Plus size={18} className="text-blue-600" /> Tambah Rayon Baru
        </h2>
        <form onSubmit={handleAddRayon} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-grow w-full space-y-1">
            <label className={labelStandardClass}>Nama Rayon</label>
            <input type="text" required value={newRayonName} onChange={(e) => setNewRayonName(e.target.value)} placeholder="Misal: Rayon Kawah Chondrodimuko" className={inputStandardClass} />
          </div>
          <div className="flex-grow w-full space-y-1">
            <label className={labelStandardClass}>Fakultas / Basis Wilayah</label>
            <input type="text" required value={newRayonFakultas} onChange={(e) => setNewRayonFakultas(e.target.value)} placeholder="Misal: Fakultas Ilmu Tarbiyah dan Keguruan" className={inputStandardClass} />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-6 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm whitespace-nowrap">
            <Plus size={16}/> Buat Rayon
          </button>
        </form>
      </div>

      {/* Daftar Kartu Rayon */}
      <form onSubmit={handleSaveGlobal} className="space-y-6">
        
        {rayonData.length === 0 ? (
           <div className="py-12 text-center bg-white border border-slate-200 border-dashed rounded-lg text-slate-500 font-medium">Belum ada data rayon yang ditambahkan.</div>
        ) : (
          <div className="space-y-6">
            {rayonData.map((rayon, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-colors">
                
                {/* Header Kartu Rayon */}
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                  <div className="flex items-center gap-3 w-full sm:w-2/3">
                     <Shield size={20} className="text-slate-400 shrink-0"/>
                     <input type="text" value={rayon.nama} onChange={(e) => handleInputChange(idx, "nama", e.target.value)} className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full text-base" placeholder="Nama Rayon..."/>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0">
                     <input type="text" value={rayon.fakultas} onChange={(e) => handleInputChange(idx, "fakultas", e.target.value)} className="text-sm font-semibold text-blue-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-right w-full sm:w-48" placeholder="Fakultas..."/>
                     <button type="button" onClick={() => handleDeleteRayon(idx)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors border border-transparent hover:border-red-200" title="Hapus Rayon"><Trash2 size={16}/></button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Deskripsi & Upload Logo */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelStandardClass}>Deskripsi / Slogan Rayon</label>
                      <textarea rows="2" value={rayon.deskripsi} onChange={(e) => handleInputChange(idx, "deskripsi", e.target.value)} className={`${inputStandardClass} resize-none text-slate-600`} placeholder="Jelaskan fokus, sejarah singkat, atau semboyan rayon ini..."/>
                    </div>
                    <div>
                      <label className={labelStandardClass}>Logo Rayon (PNG Transparan)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                         <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border shrink-0 ${uploadingIdx === idx ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                           {uploadingIdx === idx ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                           <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleImageUpload(e, idx)} disabled={uploadingIdx !== null} />
                         </label>
                         <input type="text" value={rayon.logoUrl || ""} onChange={(e) => handleInputChange(idx, "logoUrl", e.target.value)} className={`${inputStandardClass} font-mono text-xs text-emerald-600 bg-slate-50`} placeholder="URL gambar otomatis..." readOnly/>
                      </div>
                    </div>
                  </div>

                  {/* INFO BASECAMP DAN SOSIAL MEDIA */}
                  <div className="grid md:grid-cols-3 gap-4 pt-5 border-t border-slate-100">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5"><Home size={14} className="text-blue-500"/> Alamat Basecamp</label>
                      <textarea rows="1" value={rayon.alamat || ""} onChange={(e) => handleInputChange(idx, "alamat", e.target.value)} className={`${inputStandardClass} resize-none text-slate-600`} placeholder="Jl. Joyo Tamansari..."/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5"><MapPin size={14} className="text-emerald-500"/> Tautan Google Maps</label>
                      <input type="url" value={rayon.mapUrl || ""} onChange={(e) => handleInputChange(idx, "mapUrl", e.target.value)} className={`${inputStandardClass} font-mono text-xs`} placeholder="https://maps.app.goo.gl/..."/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5"><AtSign size={14} className="text-pink-500"/> Tautan Instagram (IG)</label>
                      <input type="url" value={rayon.igUrl || ""} onChange={(e) => handleInputChange(idx, "igUrl", e.target.value)} className={`${inputStandardClass} font-mono text-xs`} placeholder="https://instagram.com/..."/>
                    </div>
                  </div>

                  {/* Accordion Pengurus Inti */}
                  <div className="border border-slate-200 rounded-md overflow-hidden mt-2">
                    <button type="button" onClick={() => setOpenAccordion(openAccordion === idx ? null : idx)} className="w-full bg-slate-50 hover:bg-slate-100 p-3.5 flex items-center justify-between text-sm font-semibold text-slate-700 transition-colors">
                      <span className="flex items-center gap-2"><Users size={16} className="text-slate-500"/> Formulir Pengurus Inti (BPH) Rayon</span>
                      {openAccordion === idx ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                    </button>
                    
                    {openAccordion === idx && (
                      <div className="p-5 grid sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white border-t border-slate-200">
                         {/* Blok Input Ketua */}
                         <div className="bg-slate-50 p-3 rounded-md border border-slate-100 space-y-2">
                            <label className="text-xs font-bold text-blue-700 block mb-1">Ketua Rayon</label>
                            <input type="text" placeholder="Nama Lengkap..." value={rayon.ketua || ""} onChange={(e) => handleInputChange(idx, "ketua", e.target.value)} className={inputStandardClass}/>
                            <input type="text" placeholder="No. WA (628...)" value={rayon.waKetua || ""} onChange={(e) => handleInputChange(idx, "waKetua", e.target.value)} className={`${inputStandardClass} font-mono text-xs`}/>
                         </div>
                         {/* Blok Input Sekretaris */}
                         <div className="bg-slate-50 p-3 rounded-md border border-slate-100 space-y-2">
                            <label className="text-xs font-bold text-slate-700 block mb-1">Sekretaris Rayon</label>
                            <input type="text" placeholder="Nama Lengkap..." value={rayon.sekretaris || ""} onChange={(e) => handleInputChange(idx, "sekretaris", e.target.value)} className={inputStandardClass}/>
                            <input type="text" placeholder="No. WA (628...)" value={rayon.waSekret || ""} onChange={(e) => handleInputChange(idx, "waSekret", e.target.value)} className={`${inputStandardClass} font-mono text-xs`}/>
                         </div>
                         {/* Blok Input Bendahara */}
                         <div className="bg-slate-50 p-3 rounded-md border border-slate-100 space-y-2">
                            <label className="text-xs font-bold text-slate-700 block mb-1">Bendahara Rayon</label>
                            <input type="text" placeholder="Nama Lengkap..." value={rayon.bendahara || ""} onChange={(e) => handleInputChange(idx, "bendahara", e.target.value)} className={inputStandardClass}/>
                            <input type="text" placeholder="No. WA (628...)" value={rayon.waBendum || ""} onChange={(e) => handleInputChange(idx, "waBendum", e.target.value)} className={`${inputStandardClass} font-mono text-xs`}/>
                         </div>
                         {/* Blok Input Kaderisasi */}
                         <div className="bg-slate-50 p-3 rounded-md border border-slate-100 space-y-2">
                            <label className="text-xs font-bold text-emerald-700 block mb-1">CO Kaderisasi</label>
                            <input type="text" placeholder="Nama Lengkap..." value={rayon.coKaderisasi || ""} onChange={(e) => handleInputChange(idx, "coKaderisasi", e.target.value)} className={inputStandardClass}/>
                            <input type="text" placeholder="No. WA (628...)" value={rayon.waKaderisasi || ""} onChange={(e) => handleInputChange(idx, "waKaderisasi", e.target.value)} className={`${inputStandardClass} font-mono text-xs`}/>
                         </div>
                         {/* Blok Input Gerakan */}
                         <div className="bg-slate-50 p-3 rounded-md border border-slate-100 space-y-2">
                            <label className="text-xs font-bold text-amber-700 block mb-1">CO Gerakan</label>
                            <input type="text" placeholder="Nama Lengkap..." value={rayon.coGerakan || ""} onChange={(e) => handleInputChange(idx, "coGerakan", e.target.value)} className={inputStandardClass}/>
                            <input type="text" placeholder="No. WA (628...)" value={rayon.waGerakan || ""} onChange={(e) => handleInputChange(idx, "waGerakan", e.target.value)} className={`${inputStandardClass} font-mono text-xs`}/>
                         </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating/Bottom Action Bar */}
        {rayonData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 sticky bottom-6 z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
             <div className="flex items-start gap-2.5 text-sm text-slate-600 max-w-2xl">
               <Info size={18} className="shrink-0 mt-0.5 text-blue-500" />
               <p>Semua perubahan (profil, struktur inti, maupun unggahan logo) baru akan ditayangkan ke publik setelah Anda menyimpan perubahan.</p>
             </div>
             <button type="submit" disabled={uploadingIdx !== null} className="w-full sm:w-auto bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition flex items-center justify-center gap-2 shadow-sm text-sm whitespace-nowrap shrink-0">
                <Save size={16} /> Simpan Pembaruan Rayon
             </button>
          </div>
        )}
      </form>
    </div>
  );
}