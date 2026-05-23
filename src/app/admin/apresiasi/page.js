"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Plus, Trash2, Trophy, Search, Image as ImageIcon, Award, BookOpen, UploadCloud, FileSpreadsheet, ChevronDown, ChevronUp, Link as LinkIcon, Loader2, Download } from "lucide-react";
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
  
  // State Input Kader Baru
  const [newNama, setNewNama] = useState("");
  const [newRayon, setNewRayon] = useState("");
  const [newFoto, setNewFoto] = useState("");
  
  // State Interaksi
  const [activeEditKader, setActiveEditKader] = useState(null);
  const [expandedPrestasiId, setExpandedPrestasiId] = useState(null); 
  const [uploadingImage, setUploadingImage] = useState(false);
  const excelInputRef = useRef(null);

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
      alert("Konfigurasi Cloudinary di .env.local belum diatur (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME & NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)");
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
      alert("Gagal mengunggah gambar ke Cloudinary. Periksa koneksi atau konfigurasi preset.");
    } finally {
      setUploadingImage(false);
    }
  };

  // --- FUNGSI DOWNLOAD TEMPLATE EXCEL (2 SHEET) ---
  const handleDownloadTemplate = () => {
    // Data untuk Sheet 1: Akademik
    const dataAkademik = [
      {
        "Nama Kader": "Ahmad Albert Afrilsyah",
        "Asal Rayon": "PR. PMII “KAWAH” Chondrodimuko",
        "Foto Profil (Upload/Link)": "",
        "Judul Jurnal / Karya / Materi Kaderisasi": "Penerapan AI dalam Konsep Andragogi",
        "Pencapaian / Nilai IPK": "Sinta 2",
        "Tingkat / Jenjang Kaderisasi": "Nasional",
        "Tahun Terbit / Angkatan": "2026",
        "Link DOI / Website / Raport Kaderisasi (G-Drive)": "https://doi.org/10..."
      }
    ];

    // Data untuk Sheet 2: Non-Akademik
    const dataNonAkademik = [
      {
        "Nama Kader": "Sahabat PMII",
        "Asal Rayon": "PR. PMII “Perjuangan” Ibnu Aqil",
        "Foto Profil (Upload/Link)": "",
        "Nama Kompetisi / Lomba": "Lomba Gagasan Sinergis Adaptif",
        "Pencapaian": "Juara 1",
        "Tingkat": "Regional Jawa Timur",
        "Tahun": "2025",
        "Bukti Link Sertifikat (G-Drive) / Upload Dokumentasi": "https://drive.google.com/..."
      }
    ];

    const wsAkademik = XLSX.utils.json_to_sheet(dataAkademik);
    const wsNonAkademik = XLSX.utils.json_to_sheet(dataNonAkademik);
    
    // Melebarkan kolom agar rapi saat excel dibuka
    wsAkademik['!cols'] = [{wch: 25}, {wch: 35}, {wch: 25}, {wch: 45}, {wch: 25}, {wch: 30}, {wch: 25}, {wch: 60}];
    wsNonAkademik['!cols'] = [{wch: 25}, {wch: 35}, {wch: 25}, {wch: 40}, {wch: 20}, {wch: 25}, {wch: 15}, {wch: 60}];

    const wb = XLSX.utils.book_new();
    
    // Memasukkan 2 Sheet ke dalam 1 File Excel
    XLSX.utils.book_append_sheet(wb, wsAkademik, "Akademik");
    XLSX.utils.book_append_sheet(wb, wsNonAkademik, "Non-Akademik");
    
    XLSX.writeFile(wb, "Template_Apresiasi_Kader.xlsx");
  };

  // --- FUNGSI IMPORT EXCEL (MEMBACA BANYAK SHEET) ---
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        
        let updatedKader = [...kaderData];
        let importedRowsCount = 0;
        
        // Looping untuk membaca SEMUA sheet (Akademik & Non-Akademik)
        wb.SheetNames.forEach(sheetName => {
           const ws = wb.Sheets[sheetName];
           const data = XLSX.utils.sheet_to_json(ws);
           
           // Identifikasi Kategori otomatis dari nama sheet
           const isNonAkadSheet = sheetName.toLowerCase().includes("non");
           const defaultTipe = isNonAkadSheet ? "non-akademik" : "akademik";

           data.forEach(row => {
              const nama = row["Nama Kader"];
              if(!nama) return;
              importedRowsCount++;
              
              // Cek apakah kader sudah ada di database atau list
              let kaderIndex = updatedKader.findIndex(k => k.namaLengkap.toLowerCase() === nama.toLowerCase());
              
              if (kaderIndex === -1) {
                  // Jika kader belum ada, buat profil baru
                  const newKader = {
                      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                      namaLengkap: nama,
                      asalRayon: row["Asal Rayon"] || "",
                      fotoKader: row["Foto Profil (Upload/Link)"] || "",
                      prestasi: []
                  };
                  updatedKader.push(newKader);
                  kaderIndex = updatedKader.length - 1;
              }
              
              // Tarik data dengan menyesuaikan nama header di masing-masing Sheet
              const judul = row["Judul Jurnal / Karya / Materi Kaderisasi"] || row["Nama Kompetisi / Lomba"] || "";
              const pencapaian = row["Pencapaian / Nilai IPK"] || row["Pencapaian"] || "";
              const tingkat = row["Tingkat / Jenjang Kaderisasi"] || row["Tingkat"] || "";
              const tahun = row["Tahun Terbit / Angkatan"] || row["Tahun"] || "";
              const linkOrFoto = row["Link DOI / Website / Raport Kaderisasi (G-Drive)"] || row["Bukti Link Sertifikat (G-Drive) / Upload Dokumentasi"] || "";
              
              if (judul) {
                  updatedKader[kaderIndex].prestasi.push({
                      id: Date.now() + Math.random(),
                      tipe: defaultTipe,
                      judul: judul,
                      pencapaian: pencapaian,
                      tingkat: tingkat,
                      tahun: tahun,
                      linkOrFoto: linkOrFoto
                  });
              }
           });
        });
        
        setKaderData(updatedKader);
        alert(`Berhasil mengimpor ${importedRowsCount} baris riwayat prestasi dari Excel! Jangan lupa klik 'Simpan Permanen'.`);
      } catch (error) {
        alert("Gagal membaca file Excel. Pastikan format tabel sudah sesuai dengan Template Excel.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // Reset input file agar bisa import file yang sama 2x
  };

  const handleAddKader = (e) => {
    e.preventDefault();
    if (!newNama.trim() || !newRayon) return alert("Nama dan Asal Rayon wajib diisi!");
    const updated = [{ id: Date.now().toString(), namaLengkap: newNama, asalRayon: newRayon, fotoKader: newFoto, prestasi: [] }, ...kaderData];
    setKaderData(updated);
    setNewNama(""); setNewRayon(""); setNewFoto("");
  };

  const handleDeleteKader = (id) => {
    if (!confirm("Hapus kader berprestasi ini beserta seluruh riwayat prestasinya?")) return;
    setKaderData(kaderData.filter(item => item.id !== id));
    if(activeEditKader?.id === id) setActiveEditKader(null);
  };

  const handleAddPrestasi = (kaderId, tipe) => {
    const newPrestasiId = Date.now();
    const updated = kaderData.map(k => {
      if (k.id === kaderId) {
        return {
          ...k, 
          prestasi: [{ id: newPrestasiId, tipe, judul: "", pencapaian: "", tingkat: "", tahun: "", linkOrFoto: "" }, ...k.prestasi]
        };
      }
      return k;
    });
    setKaderData(updated);
    setActiveEditKader(updated.find(k => k.id === kaderId));
    setExpandedPrestasiId(newPrestasiId);
  };

  const handleUpdatePrestasi = (kaderId, presId, field, value) => {
    const updated = kaderData.map(k => {
      if (k.id === kaderId) {
        return { ...k, prestasi: k.prestasi.map(p => p.id === presId ? { ...p, [field]: value } : p) };
      }
      return k;
    });
    setKaderData(updated);
    setActiveEditKader(updated.find(k => k.id === kaderId));
  };

  const handleDeletePrestasi = (kaderId, presId) => {
    if (!confirm("Hapus prestasi ini?")) return;
    const updated = kaderData.map(k => {
      if (k.id === kaderId) return { ...k, prestasi: k.prestasi.filter(p => p.id !== presId) };
      return k;
    });
    setKaderData(updated);
    setActiveEditKader(updated.find(k => k.id === kaderId));
  };

  const handleSaveAll = async () => {
    try {
      await setDoc(doc(db, "website_config", "database_apresiasi"), { listApresiasi: kaderData });
      alert("Database Apresiasi Kader berhasil diperbarui di Publik!");
      setActiveEditKader(null);
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4">
      {/* HEADER PANEL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Trophy size={28} className="text-amber-500"/> Kelola Apresiasi Kader</h1>
           <p className="text-sm text-slate-500 mt-1 font-medium">Input kader berprestasi secara manual atau unggah via Excel.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full xl:w-auto">
           <button onClick={handleDownloadTemplate} className="flex-1 xl:flex-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition flex justify-center items-center gap-2 shadow-sm">
             <Download size={18}/> Template
           </button>
           <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={excelInputRef} onChange={handleImportExcel} />
           <button onClick={() => excelInputRef.current.click()} className="flex-1 xl:flex-none bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-bold px-4 py-2.5 rounded-xl transition flex justify-center items-center gap-2">
             <FileSpreadsheet size={18}/> Import
           </button>
           {kaderData.length > 0 && (
             <button onClick={handleSaveAll} className="w-full xl:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20">
               <Save size={18}/> Simpan
             </button>
           )}
        </div>
      </div>

      {/* FORM TAMBAH KADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-600 bg-blue-100 p-1 rounded-full" /> Daftarkan Profil Kader Baru</h2>
        <form onSubmit={handleAddKader} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Kader</label>
            <input type="text" required value={newNama} onChange={e => setNewNama(e.target.value)} className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Nama Lengkap"/>
          </div>
          
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Asal Rayon</label>
            <select required value={newRayon} onChange={e => setNewRayon(e.target.value)} className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
              <option value="" disabled>Pilih Rayon...</option>
              {RAYON_OPTIONS.map(rayon => <option key={rayon} value={rayon}>{rayon}</option>)}
            </select>
          </div>
          
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Foto Profil (URL / Upload Cloudinary)</label>
            <div className="flex gap-2">
               <div className="relative flex-1">
                 <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                 <input type="text" value={newFoto} onChange={e => setNewFoto(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition font-mono" placeholder="https://... atau imgbb url"/>
               </div>
               <label className="bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer px-4 border border-slate-200 rounded-xl flex items-center justify-center gap-2 transition relative overflow-hidden">
                  {uploadingImage ? <Loader2 size={18} className="animate-spin"/> : <UploadCloud size={18}/>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadCloudinary(e.target.files[0])} disabled={uploadingImage}/>
               </label>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm transition">Tambah</button>
          </div>
        </form>
      </div>

      {/* GRID KADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {kaderData.map(kader => (
          <div key={kader.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group">
            <div className="h-16 bg-gradient-to-r from-slate-800 to-slate-900 relative">
               <button onClick={() => handleDeleteKader(kader.id)} className="absolute top-3 right-3 bg-white/10 hover:bg-red-500 text-white p-1.5 rounded-lg transition backdrop-blur-sm"><Trash2 size={16}/></button>
            </div>
            <div className="px-5 relative flex justify-start -mt-10 mb-2">
               <div className="w-20 h-20 bg-white rounded-full p-1 shadow-md border border-slate-100">
                  {kader.fotoKader ? <img src={kader.fotoKader} className="w-full h-full rounded-full object-cover"/> : <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center"><ImageIcon size={28} className="text-slate-300"/></div>}
               </div>
            </div>
            
            <div className="px-5 pb-5 flex flex-col flex-grow">
               <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-1">{kader.namaLengkap}</h3>
               <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-amber-50 inline-block px-2 py-1 rounded-md mb-4 w-max">{kader.asalRayon}</p>
               
               <div className="mt-auto flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Total Prestasi</span>
                   <span className="text-sm font-black text-slate-700 flex items-center gap-1"><Trophy size={14} className="text-amber-500"/> {kader.prestasi.length} Data</span>
                 </div>
                 <button onClick={() => setActiveEditKader(kader)} className="bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm">
                   Kelola Detail
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>


      {/* MODAL KELOLA PRESTASI */}
      {activeEditKader && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-5">
           <div className="bg-[#f8fafc] w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="bg-white p-5 md:p-6 border-b border-slate-200 flex justify-between items-center shrink-0 z-10">
                 <div className="flex items-center gap-4">
                   {activeEditKader.fotoKader ? <img src={activeEditKader.fotoKader} className="w-12 h-12 rounded-full object-cover shadow-sm"/> : <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200"></div>}
                   <div>
                     <h2 className="font-extrabold text-lg md:text-xl text-slate-800">{activeEditKader.namaLengkap}</h2>
                     <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><Trophy size={12} className="text-amber-500"/> {activeEditKader.prestasi.length} Prestasi Tercatat</p>
                   </div>
                 </div>
                 <button onClick={() => setActiveEditKader(null)} className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 text-sm font-bold rounded-xl transition">Tutup</button>
              </div>

              {/* Modal Body */}
              <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
                 <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <button onClick={() => handleAddPrestasi(activeEditKader.id, 'non-akademik')} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"><Award size={18}/> Tambah Lomba / Non-Akademik</button>
                    <button onClick={() => handleAddPrestasi(activeEditKader.id, 'akademik')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"><BookOpen size={18}/> Tambah Jurnal / Kaderisasi</button>
                 </div>

                 {/* List Prestasi (Accordion) */}
                 <div className="space-y-3">
                   {activeEditKader.prestasi.map((p) => {
                      const isExpanded = expandedPrestasiId === p.id;
                      const isAkad = p.tipe === 'akademik';

                      return (
                        <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
                           {/* Accordion Header */}
                           <div 
                             onClick={() => setExpandedPrestasiId(isExpanded ? null : p.id)}
                             className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                           >
                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-1 pr-4">
                                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded w-max ${isAkad ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {isAkad ? 'Akademik / Kaderisasi' : 'Lomba / Non-Akademik'}
                                </span>
                                <h4 className={`font-bold text-sm md:text-base line-clamp-1 ${p.judul ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                  {p.judul || "(Judul belum diisi... klik untuk mengedit)"}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePrestasi(activeEditKader.id, p.id); }} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition"><Trash2 size={16}/></button>
                                <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg shrink-0">
                                  {isExpanded ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
                                </div>
                              </div>
                           </div>

                           {/* Accordion Body */}
                           {isExpanded && (
                             <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-12 gap-y-4 md:gap-x-4 bg-white">
                               
                               <div className="col-span-1 md:col-span-12">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{isAkad ? 'Judul Jurnal / Karya / Materi Kaderisasi' : 'Nama Kompetisi / Lomba'}</label>
                                 <input type="text" value={p.judul} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "judul", e.target.value)} className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 transition" placeholder="Tulis di sini..."/>
                               </div>
                               
                               <div className="col-span-1 md:col-span-6">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{isAkad ? 'Pencapaian / Nilai IPK (Misal: Sinta 2, IPK 3.8)' : 'Pencapaian (Misal: Juara 1, Finalis)'}</label>
                                 <input type="text" value={p.pencapaian} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "pencapaian", e.target.value)} className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 transition" placeholder="Tulis di sini..."/>
                               </div>

                               <div className="col-span-1 md:col-span-3">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{isAkad ? 'Tingkat / Jenjang Kaderisasi' : 'Tingkat'}</label>
                                 <input 
                                   type="text" 
                                   value={p.tingkat} 
                                   onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "tingkat", e.target.value)} 
                                   className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 transition" 
                                   placeholder={isAkad ? "Misal: Mapaba, PKD, Sinta 2" : "Misal: Nasional, Kampus"}
                                 />
                               </div>

                               <div className="col-span-1 md:col-span-3">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{isAkad ? 'Tahun Terbit / Angkatan' : 'Tahun'}</label>
                                 <input type="number" value={p.tahun} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "tahun", e.target.value)} className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 transition" placeholder="Misal: 2024"/>
                               </div>

                               <div className="col-span-1 md:col-span-12 mt-1">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                   {isAkad ? 'Link DOI / Website / Raport Kaderisasi (G-Drive)' : 'Bukti Link Sertifikat (G-Drive) / Upload Dokumentasi'}
                                 </label>
                                 <div className="flex flex-col sm:flex-row gap-2">
                                   <input type="text" value={p.linkOrFoto} onChange={e => handleUpdatePrestasi(activeEditKader.id, p.id, "linkOrFoto", e.target.value)} className="w-full flex-1 p-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 transition font-mono" placeholder="https://..."/>
                                   {!isAkad && (
                                     <label className="bg-slate-100 hover:bg-slate-200 cursor-pointer px-4 py-2.5 border border-slate-200 rounded-xl flex items-center justify-center gap-2 transition">
                                       {uploadingImage ? <Loader2 size={18} className="animate-spin text-slate-500"/> : <UploadCloud size={18} className="text-slate-600"/>}
                                       <span className="text-sm font-bold text-slate-600 sm:hidden">Upload Gambar</span>
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
                 </div>

                 {activeEditKader.prestasi.length === 0 && (
                   <div className="text-center bg-white border border-slate-200 border-dashed rounded-3xl py-16">
                     <Trophy size={48} className="mx-auto mb-3 text-slate-300"/>
                     <p className="text-slate-500 font-medium">Belum ada riwayat prestasi yang ditambahkan.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}