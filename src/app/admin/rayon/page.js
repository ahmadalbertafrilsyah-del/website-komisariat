"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { Save, MapPin, Plus, Trash2, Image as ImageIcon, Shield, Info, ChevronDown, ChevronUp, UploadCloud, Loader2, Home, AtSign, Users, FileSpreadsheet, Download, Edit } from "lucide-react";

export default function AdminRayonEditor() {
  const [loading, setLoading] = useState(true);
  const [rayonData, setRayonData] = useState([]);
  
  const [newRayonName, setNewRayonName] = useState("");
  const [newRayonFakultas, setNewRayonFakultas] = useState("");
  
  // State Accordion & Upload
  const [expandedRayon, setExpandedRayon] = useState({});
  const [openAccordion, setOpenAccordion] = useState(null); // Accordion pengurus inti
  const [uploadingIdx, setUploadingIdx] = useState(null);
  
  const excelInputRef = useRef(null);

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
    // Otomatis buka accordion untuk rayon yang baru ditambahkan
    setExpandedRayon(prev => ({ ...prev, [updated.length - 1]: true }));
  };

  const handleDeleteRayon = (idx) => {
    if (!confirm("Hapus data rayon ini secara permanen?")) return;
    const updated = rayonData.filter((_, i) => i !== idx);
    setRayonData(updated);
  };

  const toggleExpandRayon = (idx) => {
    setExpandedRayon(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ================= UPLOAD GAMBAR CLOUDINARY =================
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

  // ================= IMPORT & EXPORT EXCEL =================
  const handleDownloadTemplate = () => {
    const templateData = [{
      "Nama Rayon": "Rayon Kawah Chondrodimuko",
      "Fakultas": "Fakultas Ilmu Tarbiyah dan Keguruan",
      "Deskripsi": "Semboyan/deskripsi singkat...",
      "URL Logo": "https://...",
      "Alamat Basecamp": "Jl. Joyo Tamansari...",
      "URL G-Maps": "https://maps...",
      "URL IG": "https://instagram...",
      "Nama Ketua": "Achmad", "WA Ketua": "628...",
      "Nama Sekretaris": "Budi", "WA Sekretaris": "628...",
      "Nama Bendahara": "Cici", "WA Bendahara": "628...",
      "Nama CO Kaderisasi": "Deni", "WA Kaderisasi": "628...",
      "Nama CO Gerakan": "Eko", "WA Gerakan": "628..."
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Rayon");
    XLSX.writeFile(wb, "Template_Impor_Rayon.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const newData = data.map(row => ({
          nama: String(row["Nama Rayon"] || "").trim(),
          fakultas: String(row["Fakultas"] || "").trim(),
          deskripsi: String(row["Deskripsi"] || "").trim(),
          logoUrl: String(row["URL Logo"] || "").trim(),
          alamat: String(row["Alamat Basecamp"] || "").trim(),
          mapUrl: String(row["URL G-Maps"] || "").trim(),
          igUrl: String(row["URL IG"] || "").trim(),
          ketua: String(row["Nama Ketua"] || "").trim(), waKetua: String(row["WA Ketua"] || "").trim(),
          sekretaris: String(row["Nama Sekretaris"] || "").trim(), waSekret: String(row["WA Sekretaris"] || "").trim(),
          bendahara: String(row["Nama Bendahara"] || "").trim(), waBendum: String(row["WA Bendahara"] || "").trim(),
          coKaderisasi: String(row["Nama CO Kaderisasi"] || "").trim(), waKaderisasi: String(row["WA Kaderisasi"] || "").trim(),
          coGerakan: String(row["Nama CO Gerakan"] || "").trim(), waGerakan: String(row["WA Gerakan"] || "").trim()
        })).filter(r => r.nama !== "");

        setRayonData([...rayonData, ...newData]);
        alert(`Berhasil mengimpor ${newData.length} data rayon!`);
      } catch (error) {
        alert("Gagal membaca file Excel. Pastikan format kolom sesuai dengan Template.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
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

  // STYLE STANDAR ENTERPRISE
  const inputStyle = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-[13px] bg-white text-slate-800 placeholder:text-slate-400";
  const labelStyle = "text-[13px] font-semibold text-slate-700 block mb-1.5";

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header Halaman */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">Profil Rayon</h1>
          <p className="text-[13px] text-slate-500 mt-1">Kelola narasi, logo, basis fakultas, serta data pengurus inti masing-masing rayon.</p>
        </div>
      </div>

      {/* Grid: Tambah Rayon Manual & Import Excel */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        
        {/* Form 1: Tambah Rayon Baru */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
             <Shield size={16} className="text-slate-600"/>
             <h2 className="text-sm font-bold text-slate-800">Tambah Rayon Baru</h2>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <form onSubmit={handleAddRayon} className="flex flex-col sm:flex-row items-end gap-3 mt-auto">
              <div className="flex-grow w-full">
                <label className={labelStyle}>Nama Rayon</label>
                <input type="text" required value={newRayonName} onChange={(e) => setNewRayonName(e.target.value)} placeholder="Misal: Rayon Kawah" className={inputStyle} />
              </div>
              <div className="flex-grow w-full">
                <label className={labelStyle}>Fakultas / Basis</label>
                <input type="text" required value={newRayonFakultas} onChange={(e) => setNewRayonFakultas(e.target.value)} placeholder="Misal: FITK" className={inputStyle} />
              </div>
              <button type="submit" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-5 rounded-md text-[13px] flex items-center justify-center gap-2 transition shadow-sm shrink-0 whitespace-nowrap">
                <Plus size={16}/> Buat Rayon
              </button>
            </form>
          </div>
        </div>

        {/* Form 2: IMPORT EXCEL */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <FileSpreadsheet size={16} className="text-emerald-600"/>
               <h2 className="text-sm font-bold text-slate-800">Impor Data Masal (Excel)</h2>
             </div>
             <button onClick={handleDownloadTemplate} className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1"><Download size={12}/> Unduh Template</button>
          </div>
          <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Format Header Kolom Wajib:<br/>
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] mr-1">Nama Rayon</span> | 
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] mx-1">Fakultas</span> | 
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] mx-1">URL Logo</span> | 
              <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] ml-1">...dll</span>
            </p>
            <div className="relative w-full overflow-hidden inline-block">
               <button className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium py-2 px-4 rounded-md text-[13px] flex items-center justify-center gap-2 transition">
                 <UploadCloud size={16}/> Unggah File (.xlsx / .xls)
               </button>
               <input type="file" accept=".xlsx, .xls" ref={excelInputRef} onChange={handleImportExcel} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

      </div>

      {/* ================= AREA DAFTAR KARTU RAYON (ACCORDION) ================= */}
      <form onSubmit={handleSaveGlobal} className="space-y-6">
        
        {rayonData.length === 0 ? (
           <div className="py-12 text-center bg-white border border-slate-200 border-dashed rounded-md text-[13px] text-slate-500 font-medium">Belum ada data rayon yang ditambahkan.</div>
        ) : (
          <div className="space-y-6">
            {rayonData.map((rayon, idx) => {
              const isExpanded = expandedRayon[idx] || false;

              return (
                <div key={idx} className={`bg-white rounded-md border shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
                  
                  {/* Header Kartu Rayon (Bisa di-klik untuk buka/tutup) */}
                  <div 
                    className={`px-5 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50 border-b border-blue-100' : 'bg-slate-50/80'}`}
                    onClick={() => toggleExpandRayon(idx)}
                  >
                    <div className="flex items-center gap-3 flex-grow w-full xl:w-2/3">
                      <button type="button" className="text-slate-400 hover:text-blue-600 transition p-1 rounded-md hover:bg-slate-200">
                        {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                      </button>
                      <Shield size={18} className="text-slate-500 shrink-0"/>
                      <input 
                        type="text" value={rayon.nama} 
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleInputChange(idx, "nama", e.target.value)} 
                        className="font-bold text-slate-800 text-[15px] bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none transition w-full py-1" 
                        placeholder="Nama Rayon..."
                      />
                    </div>

                    <div className="flex items-center justify-between xl:justify-end gap-3 w-full xl:w-auto shrink-0 ml-10 xl:ml-0" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="text" value={rayon.fakultas} 
                        onChange={(e) => handleInputChange(idx, "fakultas", e.target.value)} 
                        className="text-[13px] font-semibold text-blue-600 bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none transition text-left xl:text-right w-full xl:w-56 py-1" 
                        placeholder="Nama Fakultas..."
                      />
                      <button type="button" onClick={() => toggleExpandRayon(idx)} className={`bg-white border text-[12px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition shadow-sm ${isExpanded ? 'text-slate-500 border-slate-200 hover:bg-slate-50' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                        <Edit size={14} className={isExpanded ? "text-slate-400" : "text-blue-500"}/> {isExpanded ? "Tutup Edit" : "Edit Profil"}
                      </button>
                      <button type="button" onClick={() => handleDeleteRayon(idx)} className="bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 p-1.5 rounded transition shadow-sm" title="Hapus Rayon">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>

                  {/* Isi Konten Profil Rayon (Hanya tampil jika isExpanded === true) */}
                  {isExpanded && (
                    <div className="p-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
                      
                      {/* Deskripsi & Upload Logo */}
                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <label className={labelStyle}>Deskripsi / Slogan Rayon</label>
                          <textarea rows="2" value={rayon.deskripsi} onChange={(e) => handleInputChange(idx, "deskripsi", e.target.value)} className={`${inputStyle} resize-none`} placeholder="Jelaskan fokus, sejarah singkat, atau semboyan rayon ini..."/>
                        </div>
                        <div>
                          <label className={labelStyle}>Logo Rayon (PNG Transparan)</label>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                             <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[12px] font-bold transition-colors border shrink-0 ${uploadingIdx === idx ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                               {uploadingIdx === idx ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={14} /> Pilih Logo</>}
                               <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleImageUpload(e, idx)} disabled={uploadingIdx !== null} />
                             </label>
                             <input type="text" value={rayon.logoUrl || ""} onChange={(e) => handleInputChange(idx, "logoUrl", e.target.value)} className={`${inputStyle} font-mono text-[11px] text-emerald-600 bg-slate-50`} placeholder="URL gambar otomatis terisi..." readOnly/>
                          </div>
                        </div>
                      </div>

                      {/* INFO BASECAMP DAN SOSIAL MEDIA */}
                      <div className="grid md:grid-cols-3 gap-4 pt-5 border-t border-slate-100">
                        <div>
                          <label className="text-[12px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5"><Home size={14} className="text-blue-500"/> Alamat Basecamp</label>
                          <textarea rows="1" value={rayon.alamat || ""} onChange={(e) => handleInputChange(idx, "alamat", e.target.value)} className={`${inputStyle} resize-none`} placeholder="Jl. Joyo Tamansari..."/>
                        </div>
                        <div>
                          <label className="text-[12px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5"><MapPin size={14} className="text-emerald-500"/> Tautan Google Maps</label>
                          <input type="url" value={rayon.mapUrl || ""} onChange={(e) => handleInputChange(idx, "mapUrl", e.target.value)} className={`${inputStyle} font-mono text-[11px]`} placeholder="https://maps.app.goo.gl/..."/>
                        </div>
                        <div>
                          <label className="text-[12px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5"><AtSign size={14} className="text-pink-500"/> Tautan Instagram (IG)</label>
                          <input type="url" value={rayon.igUrl || ""} onChange={(e) => handleInputChange(idx, "igUrl", e.target.value)} className={`${inputStyle} font-mono text-[11px]`} placeholder="https://instagram.com/..."/>
                        </div>
                      </div>

                      {/* Accordion Pengurus Inti (Child Accordion) */}
                      <div className="border border-slate-200 rounded-md overflow-hidden mt-2">
                        <button type="button" onClick={() => setOpenAccordion(openAccordion === idx ? null : idx)} className={`w-full p-3 flex items-center justify-between text-[13px] font-bold transition-colors ${openAccordion === idx ? 'bg-blue-50/50 text-blue-700 border-b border-blue-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}>
                          <span className="flex items-center gap-2"><Users size={16} className={openAccordion === idx ? "text-blue-500" : "text-slate-500"}/> Formulir Input Pengurus Inti (BPH) Rayon</span>
                          {openAccordion === idx ? <ChevronUp size={16} className="text-blue-500"/> : <ChevronDown size={16} className="text-slate-400"/>}
                        </button>
                        
                        {openAccordion === idx && (
                          <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white animate-in slide-in-from-top-2 duration-300">
                             {/* Blok Input Ketua */}
                             <div className="bg-slate-50/50 p-3 rounded border border-slate-200 space-y-2">
                                <label className="text-[11px] font-bold text-blue-700 block mb-0.5 uppercase tracking-wider">Ketua Rayon</label>
                                <input type="text" placeholder="Nama Lengkap..." value={rayon.ketua || ""} onChange={(e) => handleInputChange(idx, "ketua", e.target.value)} className={inputStyle}/>
                                <input type="text" placeholder="No. WA (628...)" value={rayon.waKetua || ""} onChange={(e) => handleInputChange(idx, "waKetua", e.target.value)} className={`${inputStyle} font-mono text-[12px]`}/>
                             </div>
                             {/* Blok Input Sekretaris */}
                             <div className="bg-slate-50/50 p-3 rounded border border-slate-200 space-y-2">
                                <label className="text-[11px] font-bold text-slate-700 block mb-0.5 uppercase tracking-wider">Sekretaris Rayon</label>
                                <input type="text" placeholder="Nama Lengkap..." value={rayon.sekretaris || ""} onChange={(e) => handleInputChange(idx, "sekretaris", e.target.value)} className={inputStyle}/>
                                <input type="text" placeholder="No. WA (628...)" value={rayon.waSekret || ""} onChange={(e) => handleInputChange(idx, "waSekret", e.target.value)} className={`${inputStyle} font-mono text-[12px]`}/>
                             </div>
                             {/* Blok Input Bendahara */}
                             <div className="bg-slate-50/50 p-3 rounded border border-slate-200 space-y-2">
                                <label className="text-[11px] font-bold text-slate-700 block mb-0.5 uppercase tracking-wider">Bendahara Rayon</label>
                                <input type="text" placeholder="Nama Lengkap..." value={rayon.bendahara || ""} onChange={(e) => handleInputChange(idx, "bendahara", e.target.value)} className={inputStyle}/>
                                <input type="text" placeholder="No. WA (628...)" value={rayon.waBendum || ""} onChange={(e) => handleInputChange(idx, "waBendum", e.target.value)} className={`${inputStyle} font-mono text-[12px]`}/>
                             </div>
                             {/* Blok Input Kaderisasi */}
                             <div className="bg-slate-50/50 p-3 rounded border border-emerald-100 space-y-2">
                                <label className="text-[11px] font-bold text-emerald-700 block mb-0.5 uppercase tracking-wider">CO Kaderisasi</label>
                                <input type="text" placeholder="Nama Lengkap..." value={rayon.coKaderisasi || ""} onChange={(e) => handleInputChange(idx, "coKaderisasi", e.target.value)} className={inputStyle}/>
                                <input type="text" placeholder="No. WA (628...)" value={rayon.waKaderisasi || ""} onChange={(e) => handleInputChange(idx, "waKaderisasi", e.target.value)} className={`${inputStyle} font-mono text-[12px]`}/>
                             </div>
                             {/* Blok Input Gerakan */}
                             <div className="bg-slate-50/50 p-3 rounded border border-amber-100 space-y-2">
                                <label className="text-[11px] font-bold text-amber-700 block mb-0.5 uppercase tracking-wider">CO Gerakan</label>
                                <input type="text" placeholder="Nama Lengkap..." value={rayon.coGerakan || ""} onChange={(e) => handleInputChange(idx, "coGerakan", e.target.value)} className={inputStyle}/>
                                <input type="text" placeholder="No. WA (628...)" value={rayon.waGerakan || ""} onChange={(e) => handleInputChange(idx, "waGerakan", e.target.value)} className={`${inputStyle} font-mono text-[12px]`}/>
                             </div>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Floating/Bottom Action Bar */}
        {rayonData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-md border border-slate-200 sticky bottom-6 z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
             <div className="flex items-start gap-2.5 text-[13px] text-slate-600 max-w-2xl">
               <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
               <p>Semua perubahan (profil, struktur inti, maupun unggahan logo) baru akan ditayangkan ke publik setelah Anda menekan tombol simpan.</p>
             </div>
             <button type="submit" disabled={uploadingIdx !== null} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-6 rounded-md transition flex items-center justify-center gap-2 shadow-sm text-[13px] whitespace-nowrap shrink-0">
                <Save size={16} /> Simpan Pembaruan Rayon
             </button>
          </div>
        )}
      </form>
    </div>
  );
}