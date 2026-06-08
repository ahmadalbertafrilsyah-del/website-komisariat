"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  Save, Plus, Trash2, Trophy, Search, Image as ImageIcon, Award, BookOpen, 
  UploadCloud, FileSpreadsheet, ChevronDown, ChevronUp, Loader2, Download, X, Info, Users 
} from "lucide-react";
import * as XLSX from "xlsx";

// --- KONFIGURASI CLOUDINARY DARI .ENV ---
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const RAYON_OPTIONS = [
  "PR. PMII “KAWAH” Chondrodimuko",
  "PR. PMII “Perjuangan” Ibnu Aqil",
  "PR. PMII “Radikal” Al-Faruq",
  "PR. PMII “Penakluk” Al-Adawiyah",
  "PR. PMII “Penyelamat” Dja’far Saifuddin",
  "PR. PMII Ekonomi “Moch. Hatta”",
  "PR. PMII Pencerahan Galileo"
];

export default function AdminApresiasi() {
  const [loading, setLoading] = useState(true);
  const [kaderData, setKaderData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State Input Kader Baru
  const [newNama, setNewNama] = useState("");
  const [newRayon, setNewRayon] = useState("");
  const [newFoto, setNewFoto] = useState("");
  
  // State Interaksi
  const [activeEditKader, setActiveEditKader] = useState(null);
  const [expandedPrestasiId, setExpandedPrestasiId] = useState(null); 
  const [uploadingImage, setUploadingImage] = useState(false);
  const excelInputRef = useRef(null);

  // Styling Standar dari Alumni
  const inputStandardClass = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm bg-white";
  const labelStandardClass = "text-xs font-semibold text-slate-700 block mb-1.5";

  useEffect(() => {
    async function loadData() {
      try {
        const docRef = doc(db, "website_config", "database_apresiasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listApresiasi) {
          setKaderData(docSnap.data().listApresiasi);
        }
      } catch (error) {
        console.error("Gagal load apresiasi:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUploadCloudinary = async (file, targetPrestasiId = null) => {
    if (!file) return;
    
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      alert("Konfigurasi Cloudinary di .env.local belum diatur!");
      return;
    }

    setUploadingImage(true);
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
      const imageUrl = data.secure_url;

      if (targetPrestasiId && activeEditKader) {
        handleUpdatePrestasi(activeEditKader.id, targetPrestasiId, "linkOrFoto", imageUrl);
      } else {
        setNewFoto(imageUrl);
      }
    } catch (error) {
      alert("Gagal mengunggah gambar ke Cloudinary.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDownloadTemplate = () => {
    const dataAkademik = [{
      "Nama Kader": "Ahmad Albert Afrilsyah", "Asal Rayon": "PR. PMII “KAWAH” Chondrodimuko", "Foto Profil (Upload/Link)": "",
      "Judul Jurnal / Karya / Materi Kaderisasi": "Penerapan AI dalam Konsep Andragogi", "Pencapaian / Nilai IPK": "Sinta 2",
      "Tingkat / Jenjang Kaderisasi": "Nasional", "Tahun Terbit / Angkatan": "2026", "Link DOI / Website / Raport Kaderisasi (G-Drive)": "https://doi.org/10..."
    }];
    const dataNonAkademik = [{
      "Nama Kader": "Sahabat PMII", "Asal Rayon": "PR. PMII “Perjuangan” Ibnu Aqil", "Foto Profil (Upload/Link)": "",
      "Nama Kompetisi / Lomba": "Lomba Gagasan Sinergis Adaptif", "Pencapaian": "Juara 1",
      "Tingkat": "Regional Jawa Timur", "Tahun": "2025", "Bukti Link Sertifikat (G-Drive) / Upload Dokumentasi": "https://drive.google.com/..."
    }];

    const wsAkademik = XLSX.utils.json_to_sheet(dataAkademik);
    const wsNonAkademik = XLSX.utils.json_to_sheet(dataNonAkademik);
    wsAkademik['!cols'] = [{wch: 25}, {wch: 35}, {wch: 25}, {wch: 45}, {wch: 25}, {wch: 30}, {wch: 25}, {wch: 60}];
    wsNonAkademik['!cols'] = [{wch: 25}, {wch: 35}, {wch: 25}, {wch: 40}, {wch: 20}, {wch: 25}, {wch: 15}, {wch: 60}];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsAkademik, "Akademik");
    XLSX.utils.book_append_sheet(wb, wsNonAkademik, "Non-Akademik");
    XLSX.writeFile(wb, "Template_Apresiasi_Kader.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        let updatedKader = [...kaderData]; let importedRowsCount = 0;
        
        wb.SheetNames.forEach(sheetName => {
           const ws = wb.Sheets[sheetName];
           const data = XLSX.utils.sheet_to_json(ws);
           const isNonAkadSheet = sheetName.toLowerCase().includes("non");
           const defaultTipe = isNonAkadSheet ? "non-akademik" : "akademik";

           data.forEach(row => {
              const nama = row["Nama Kader"]; if(!nama) return;
              importedRowsCount++;
              
              let kaderIndex = updatedKader.findIndex(k => k.namaLengkap.toLowerCase() === nama.toLowerCase());
              if (kaderIndex === -1) {
                  updatedKader.push({ id: Date.now().toString() + Math.random().toString(36).substring(2, 7), namaLengkap: nama, asalRayon: row["Asal Rayon"] || "", fotoKader: row["Foto Profil (Upload/Link)"] || "", prestasi: [] });
                  kaderIndex = updatedKader.length - 1;
              }
              
              const judul = row["Judul Jurnal / Karya / Materi Kaderisasi"] || row["Nama Kompetisi / Lomba"] || "";
              if (judul) {
                  updatedKader[kaderIndex].prestasi.push({
                      id: Date.now() + Math.random(), tipe: defaultTipe, judul: judul,
                      pencapaian: row["Pencapaian / Nilai IPK"] || row["Pencapaian"] || "",
                      tingkat: row["Tingkat / Jenjang Kaderisasi"] || row["Tingkat"] || "",
                      tahun: row["Tahun Terbit / Angkatan"] || row["Tahun"] || "",
                      linkOrFoto: row["Link DOI / Website / Raport Kaderisasi (G-Drive)"] || row["Bukti Link Sertifikat (G-Drive) / Upload Dokumentasi"] || ""
                  });
              }
           });
        });
        setKaderData(updatedKader);
        alert(`Berhasil mengimpor ${importedRowsCount} baris riwayat prestasi dari Excel! Klik 'Simpan Perubahan Direktori'.`);
      } catch (error) { alert("Gagal membaca file Excel. Pastikan format tabel sudah sesuai dengan Template Excel."); }
    };
    reader.readAsBinaryString(file); e.target.value = null; 
  };

  const handleAddKader = (e) => {
    e.preventDefault();
    if (!newNama.trim() || !newRayon) return alert("Nama dan Asal Rayon wajib diisi!");
    setKaderData([{ id: Date.now().toString(), namaLengkap: newNama, asalRayon: newRayon, fotoKader: newFoto, prestasi: [] }, ...kaderData]);
    setNewNama(""); setNewRayon(""); setNewFoto("");
  };

  const handleDeleteKader = (id) => {
    if (!confirm("Hapus kader berprestasi ini beserta seluruh riwayat prestasinya?")) return;
    setKaderData(kaderData.filter(item => item.id !== id));
    if(activeEditKader?.id === id) setActiveEditKader(null);
  };

  const handleAddPrestasi = (kaderId, tipe) => {
    const newPrestasiId = Date.now();
    const updated = kaderData.map(k => k.id === kaderId ? { ...k, prestasi: [{ id: newPrestasiId, tipe, judul: "", pencapaian: "", tingkat: "", tahun: "", linkOrFoto: "" }, ...k.prestasi] } : k );
    setKaderData(updated); setActiveEditKader(updated.find(k => k.id === kaderId)); setExpandedPrestasiId(newPrestasiId);
  };

  const handleUpdatePrestasi = (kaderId, presId, field, value) => {
    const updated = kaderData.map(k => k.id === kaderId ? { ...k, prestasi: k.prestasi.map(p => p.id === presId ? { ...p, [field]: value } : p) } : k );
    setKaderData(updated); setActiveEditKader(updated.find(k => k.id === kaderId));
  };

  const handleDeletePrestasi = (kaderId, presId) => {
    if (!confirm("Hapus prestasi ini?")) return;
    const updated = kaderData.map(k => k.id === kaderId ? { ...k, prestasi: k.prestasi.filter(p => p.id !== presId) } : k );
    setKaderData(updated); setActiveEditKader(updated.find(k => k.id === kaderId));
  };

  const handleSaveAll = async () => {
    try {
      await setDoc(doc(db, "website_config", "database_apresiasi"), { listApresiasi: kaderData });
      alert("Database Apresiasi Kader berhasil diperbarui di server!");
    } catch (error) { alert("Gagal menyimpan: " + error.message); }
  };

  const filteredData = kaderData.filter(k => {
    const searchLower = searchQuery.toLowerCase();
    const prestasiTitles = k.prestasi.map(p => p.judul).join(" ");
    return (k.namaLengkap.toLowerCase().includes(searchLower) || k.asalRayon.toLowerCase().includes(searchLower) || prestasiTitles.toLowerCase().includes(searchLower));
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full text-sm">
      
      {/* HEADER PANEL - Akurat dengan ukuran Alumni */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Direktori Apresiasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data prestasi, karya, dan penghargaan kader PMII Komisariat.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button onClick={handleDownloadTemplate} type="button" className="flex-1 md:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
             <Download size={16}/> Unduh Template
           </button>
           <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={excelInputRef} onChange={handleImportExcel} />
           <button onClick={() => excelInputRef.current.click()} type="button" className="flex-1 md:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
             <FileSpreadsheet size={16}/> Impor Data (Excel)
           </button>
        </div>
      </div>

      {/* FORM TAMBAH KADER BARU */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Plus size={18} className="text-blue-600" /> Tambah Data Kader Berprestasi
        </h2>
        
        <form onSubmit={handleAddKader} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <div className="md:col-span-4 space-y-1">
            <label className={labelStandardClass}>Nama Lengkap</label>
            <input type="text" required value={newNama} onChange={e => setNewNama(e.target.value)} className={inputStandardClass} placeholder="Nama Kader"/>
          </div>
          
          <div className="md:col-span-4 space-y-1">
            <label className={labelStandardClass}>Asal Rayon</label>
            <select required value={newRayon} onChange={e => setNewRayon(e.target.value)} className={`${inputStandardClass} appearance-none`}>
              <option value="" disabled>Pilih Rayon</option>
              {RAYON_OPTIONS.map(rayon => <option key={rayon} value={rayon}>{rayon}</option>)}
            </select>
          </div>
          
          <div className="md:col-span-4 space-y-1">
            <label className={labelStandardClass}>Foto Profil (Opsional)</label>
            <div className="flex gap-2">
              <input type="text" value={newFoto} onChange={e => setNewFoto(e.target.value)} className={`${inputStandardClass} flex-1 font-mono text-xs`} placeholder="URL Gambar..."/>
              <label className="bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer px-3 border border-slate-300 rounded-md flex items-center justify-center transition-colors shadow-sm">
                  {uploadingImage ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16}/>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadCloudinary(e.target.files[0])} disabled={uploadingImage}/>
              </label>
            </div>
          </div>
          
          <div className="md:col-span-12 mt-2">
            <button type="submit" className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-6 rounded-md text-sm transition shadow-sm flex items-center justify-center gap-2">
              <Plus size={16} /> Daftarkan Kader
            </button>
          </div>
        </form>
      </div>

      {/* DAFTAR KARTU PRESTASI */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
           <h3 className="font-semibold text-slate-800 flex items-center gap-2">
             <Trophy size={18} className="text-amber-500" /> Database Kader Berprestasi
           </h3>
           <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <input type="text" placeholder="Cari nama, rayon, prestasi..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className={inputStandardClass + " pl-9"}/>
           </div>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredData.length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-500 font-medium">Data kader tidak ditemukan.</div>
            ) : (
              filteredData.map(kader => (
                <div key={kader.id} className="border border-slate-200 rounded-lg flex flex-col bg-white hover:border-slate-300 transition-colors shadow-sm overflow-hidden group">
                  <div className="p-4 flex items-center gap-4 border-b border-slate-100">
                    <div className="w-14 h-14 shrink-0 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                      {kader.fotoKader ? (
                        <img src={kader.fotoKader} alt={kader.namaLengkap} className="w-full h-full object-cover"/>
                      ) : (
                        <ImageIcon size={20} className="text-slate-300"/>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm truncate" title={kader.namaLengkap}>{kader.namaLengkap}</h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5" title={kader.asalRayon}>{kader.asalRayon}</p>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 bg-slate-50/50 flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Trophy size={14} className="text-amber-500"/>
                      <span className="text-xs font-semibold">{kader.prestasi.length} Catatan</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleDeleteKader(kader.id)} className="text-slate-400 hover:text-red-600 transition" title="Hapus Kader">
                        <Trash2 size={16}/>
                      </button>
                      <button onClick={() => setActiveEditKader(kader)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition py-1 px-2 border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-md">
                        Detail & Edit &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BAR (Identik dengan Alumni) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 sticky bottom-6 z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="flex items-start gap-2.5 text-sm text-slate-600 max-w-2xl">
           <Info size={18} className="shrink-0 mt-0.5 text-blue-500" />
           <p>Semua perubahan data kader dan riwayat prestasi baru akan diperbarui ke sistem publik setelah Anda menekan tombol simpan.</p>
         </div>
         <button onClick={handleSaveAll} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shrink-0 text-sm">
            <Save size={16} /> Simpan Perubahan Direktori
          </button>
      </div>

      {/* MODAL DETAIL PRESTASI KADER */}
      {activeEditKader && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 text-sm">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                  {activeEditKader.fotoKader ? <img src={activeEditKader.fotoKader} className="w-full h-full object-cover"/> : <ImageIcon size={20} className="text-slate-300"/>}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">{activeEditKader.namaLengkap}</h2>
                  <p className="text-xs font-medium text-slate-500">{activeEditKader.asalRayon}</p>
                </div>
              </div>
              <button onClick={() => setActiveEditKader(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button onClick={() => handleAddPrestasi(activeEditKader.id, 'akademik')} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium px-4 py-2 rounded-md flex items-center justify-center gap-2 shadow-sm transition">
                  <BookOpen size={16} className="text-blue-600"/> Tambah Jurnal / Akademik
                </button>
                <button onClick={() => handleAddPrestasi(activeEditKader.id, 'non-akademik')} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium px-4 py-2 rounded-md flex items-center justify-center gap-2 shadow-sm transition">
                  <Award size={16} className="text-amber-500"/> Tambah Lomba / Non-Akademik
                </button>
              </div>

              <div className="space-y-4">
                {activeEditKader.prestasi.map((p) => {
                  const isExpanded = expandedPrestasiId === p.id;
                  const isAkad = p.tipe === 'akademik';

                  return (
                    <div key={p.id} className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
                      <div 
                        onClick={() => setExpandedPrestasiId(isExpanded ? null : p.id)}
                        className={`px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : ''}`}
                      >
                        <div className="flex items-center gap-4 flex-1 pr-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${isAkad ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {isAkad ? 'Akademik' : 'Non-Akademik'}
                          </span>
                          <h4 className={`font-semibold text-sm line-clamp-1 ${p.judul ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                            {p.judul || "Klik untuk mengisi detail..."}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); handleDeletePrestasi(activeEditKader.id, p.id); }} className="text-slate-400 hover:text-red-600 transition" title="Hapus"><Trash2 size={16}/></button>
                          {isExpanded ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
                          <div className="md:col-span-2 space-y-1">
                            <label className={labelStandardClass}>{isAkad ? 'Judul Karya / Jurnal / Materi' : 'Nama Kompetisi / Lomba'}</label>
                            <input type="text" value={p.judul} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "judul", e.target.value)} className={inputStandardClass} placeholder="Masukkan judul..."/>
                          </div>
                          
                          <div className="space-y-1">
                            <label className={labelStandardClass}>{isAkad ? 'Pencapaian (Misal: Sinta 2, IPK)' : 'Pencapaian (Misal: Juara 1)'}</label>
                            <input type="text" value={p.pencapaian} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "pencapaian", e.target.value)} className={inputStandardClass} placeholder="Masukkan pencapaian..."/>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className={labelStandardClass}>{isAkad ? 'Tingkat / Jenjang' : 'Tingkat'}</label>
                              <input type="text" value={p.tingkat} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "tingkat", e.target.value)} className={inputStandardClass} placeholder={isAkad ? "Sinta 2..." : "Nasional..."}/>
                            </div>
                            <div className="space-y-1">
                              <label className={labelStandardClass}>Tahun</label>
                              <input type="number" value={p.tahun} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "tahun", e.target.value)} className={inputStandardClass} placeholder="2024"/>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-1">
                            <label className={labelStandardClass}>
                              {isAkad ? 'Tautan Dokumen / Website / G-Drive' : 'Bukti Tautan (Sertifikat) / Upload File'}
                            </label>
                            <div className="flex gap-2">
                              <input type="text" value={p.linkOrFoto} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "linkOrFoto", e.target.value)} className={`${inputStandardClass} flex-1 font-mono text-xs`} placeholder="https://..."/>
                              {!isAkad && (
                                <label className="bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer px-4 border border-slate-300 rounded-md flex items-center justify-center transition shadow-sm">
                                  {uploadingImage ? <Loader2 size={16} className="animate-spin text-slate-500"/> : <UploadCloud size={16} className="text-slate-600"/>}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadCloudinary(e.target.files[0], p.id)} disabled={uploadingImage}/>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {activeEditKader.prestasi.length === 0 && (
                  <div className="text-center bg-slate-50 border border-slate-200 border-dashed rounded-lg py-12">
                    <Trophy size={36} className="mx-auto mb-3 text-slate-300"/>
                    <p className="text-sm text-slate-500 font-medium">Kader ini belum memiliki rekam jejak prestasi.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}