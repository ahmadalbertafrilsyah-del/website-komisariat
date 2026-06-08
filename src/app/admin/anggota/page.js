"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { Save, Users, Plus, Trash2, FileSpreadsheet, UploadCloud, Search, Filter, Info } from "lucide-react";

export default function AdminAnggotaEditor() {
  const [loading, setLoading] = useState(true);
  const [anggotaData, setAnggotaData] = useState([]);
  
  // State untuk Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRayon, setFilterRayon] = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");

  const fileInputRef = useRef(null);

  // Load Data dari Firebase
  useEffect(() => {
    async function loadAnggota() {
      try {
        const docRef = doc(db, "website_config", "database_anggota");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAnggota) {
          setAnggotaData(docSnap.data().listAnggota);
        }
      } catch (error) {
        console.error("Gagal mengambil data anggota:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnggota();
  }, []);

  // Fungsi Upload Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0]; 
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let newData = [];

        // PERBAIKAN: Tambahkan parameter 'index' di dalam forEach
        data.forEach((row, index) => { 
          newData.push({
            // PERBAIKAN: Gabungkan Date.now(), index, dan string acak agar ID mutlak unik
            id: `excel-import-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`, 
            nama: String(row["Nama Lengkap"] || row["Nama"] || "").trim(),
            nim: String(row["NIM"] || "").trim(),
            nia: String(row["NIA"] || "").trim(),
            rayon: String(row["Rayon"] || row["Asal Rayon"] || "").trim(),
            angkatan: String(row["Angkatan"] || row["Tahun"] || "").trim(),
            whatsapp: String(row["WhatsApp"] || row["WA"] || "").trim(),
          });
        });

        // Gabungkan data lama dengan data baru dari Excel
        const combinedData = [...anggotaData, ...newData.filter(item => item.nama !== "")];
        setAnggotaData(combinedData);
        alert(`Berhasil mengimpor ${newData.length} data anggota baru! Jangan lupa klik "Simpan Pembaruan Database" di bawah.`);
      } catch (error) {
        alert("Gagal memproses file Excel. Pastikan format kolom benar.");
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  // Tambah Baris Manual
  const handleAddManual = () => {
    setAnggotaData([
      { id: Date.now(), nama: "", nim: "", nia: "", rayon: "", angkatan: "", whatsapp: "" },
      ...anggotaData
    ]);
  };

  // Hapus Baris
  const handleDelete = (id) => {
    if(!confirm("Yakin ingin menghapus anggota ini?")) return;
    setAnggotaData(anggotaData.filter(item => item.id !== id));
  };

  // Edit Inline (Langsung di Tabel)
  const handleInputChange = (id, field, value) => {
    setAnggotaData(anggotaData.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Simpan ke Firebase
  const handleSave = async () => {
    try {
      const docRef = doc(db, "website_config", "database_anggota");
      await setDoc(docRef, { listAnggota: anggotaData });
      alert("Database Anggota berhasil diperbarui dan disimpan ke Server!");
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  // Mengambil daftar Rayon & Angkatan unik untuk opsi Filter
  const uniqueRayon = ["Semua", ...new Set(anggotaData.map(item => item.rayon).filter(r => r !== ""))];
  const uniqueAngkatan = ["Semua", ...new Set(anggotaData.map(item => item.angkatan).filter(a => a !== ""))].sort();

  // Logika Filter & Search
  const filteredData = anggotaData.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.nim.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRayon = filterRayon === "Semua" || item.rayon === filterRayon;
    const matchAngkatan = filterAngkatan === "Semua" || item.angkatan === filterAngkatan;
    
    return matchSearch && matchRayon && matchAngkatan;
  });

  const inputClass = "w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 border border-transparent focus:border-blue-300 px-2.5 py-1.5 rounded-md outline-none text-sm transition-all";

  if (loading) return <p className="text-slate-500 text-sm font-medium">Memuat database anggota...</p>;

  return (
    <div className="space-y-6 pb-12 w-full">
      
      {/* Header & Statistik */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Database Anggota
          </h1>
          <p className="text-sm text-slate-500 mt-1">Pusat data kader PMII Komisariat. Lakukan perubahan langsung pada baris tabel.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 shrink-0">
           <Users size={20} className="text-blue-600" />
           <div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Kader Terdaftar</p>
             <p className="text-lg font-bold text-slate-800 leading-none">{anggotaData.length} <span className="text-sm font-medium text-slate-500">Orang</span></p>
           </div>
        </div>
      </div>

      {/* Control Panel (Upload, Filter, Search) */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        
        {/* Baris Atas: Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Tombol Import Excel */}
            <div className="relative inline-block w-full sm:w-auto">
               <button className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
                 <UploadCloud size={16}/> Impor dari Excel
               </button>
               <input 
                 type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload}
                 className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
               />
            </div>
            
            {/* Tombol Tambah Manual */}
            <button onClick={handleAddManual} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
              <Plus size={16}/> Tambah Baris Manual
            </button>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-md border border-slate-200 flex items-center gap-1.5 w-full sm:w-auto">
            <FileSpreadsheet size={14} className="text-emerald-600 shrink-0"/> 
            <span>Format Kolom: <span className="font-mono font-semibold text-slate-700">Nama | NIM | NIA | Rayon | Angkatan | WhatsApp</span></span>
          </div>
        </div>

        <div className="h-px bg-slate-100 w-full"></div>

        {/* Baris Bawah: Filter & Pencarian */}
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Kolom Pencarian */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Cari nama atau NIM..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          {/* Filter Rayon */}
          <div className="relative w-full md:w-56 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={filterRayon} onChange={(e) => setFilterRayon(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white font-medium text-slate-700 cursor-pointer"
            >
              {uniqueRayon.map((r, i) => <option key={i} value={r}>{r === "Semua" ? "Semua Rayon" : r}</option>)}
            </select>
          </div>

          {/* Filter Angkatan */}
          <div className="relative w-full md:w-48 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={filterAngkatan} onChange={(e) => setFilterAngkatan(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white font-medium text-slate-700 cursor-pointer"
            >
              {uniqueAngkatan.map((a, i) => <option key={i} value={a}>{a === "Semua" ? "Semua Angkatan" : a}</option>)}
            </select>
          </div>
        </div>

      </div>

      {/* Tabel Database Interaktif (Inline Editing) Standar SaaS */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh] hide-scrollbar relative">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-36">NIM</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-36">NIA PMII</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-40">Asal Rayon</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Angkatan</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-36">No. WhatsApp</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16 text-center">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 bg-white">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-2 px-4 text-center font-mono font-medium text-slate-400 text-xs">{index + 1}</td>
                    
                    {/* Inline Edit Inputs */}
                    <td className="py-2 px-4">
                      <input type="text" value={item.nama} onChange={(e) => handleInputChange(item.id, "nama", e.target.value)} className={`${inputClass} font-semibold text-slate-800`} placeholder="Nama..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.nim} onChange={(e) => handleInputChange(item.id, "nim", e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="NIM..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.nia} onChange={(e) => handleInputChange(item.id, "nia", e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="NIA..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.rayon} onChange={(e) => handleInputChange(item.id, "rayon", e.target.value)} className={inputClass} placeholder="Rayon..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.angkatan} onChange={(e) => handleInputChange(item.id, "angkatan", e.target.value)} className={`${inputClass} text-center font-medium`} placeholder="Tahun..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.whatsapp} onChange={(e) => handleInputChange(item.id, "whatsapp", e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="628..." />
                    </td>
                    
                    {/* Hapus Baris */}
                    <td className="py-2 px-4 text-center">
                      <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition border border-transparent hover:border-red-100" title="Hapus Data">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-3 opacity-30" />
                      <p className="font-medium text-slate-600 text-sm">Tidak ada data anggota ditemukan.</p>
                      <p className="text-xs mt-1">Sesuaikan filter pencarian atau pastikan data telah diunggah.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar (Simpan) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 sticky bottom-6 z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="flex items-start gap-2.5 text-sm text-slate-600 max-w-2xl">
           <Info size={18} className="shrink-0 mt-0.5 text-blue-500" />
           <p>Semua perubahan (ketikan manual, hapus, maupun impor excel) baru akan diperbarui ke sistem publik setelah Anda menekan tombol simpan.</p>
         </div>
         <button onClick={handleSave} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shrink-0 text-sm">
            <Save size={16} /> Simpan Pembaruan Database
          </button>
      </div>

    </div>
  );
}