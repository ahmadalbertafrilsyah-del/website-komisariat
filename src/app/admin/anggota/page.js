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

        data.forEach((row) => {
          newData.push({
            id: Date.now() + Math.random(), // ID unik untuk React Key
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
        alert(`Berhasil mengimpor ${newData.length} data anggota baru! Jangan lupa klik "Simpan Database" di bawah.`);
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

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat Database Kader...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      
      {/* Header & Statistik */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={24} className="text-blue-600" /> Database Anggota (Kader)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Pusat data seluruh kader PMII Komisariat. Anda bisa mengedit langsung di dalam tabel.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-3">
           <div className="text-center">
             <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Total Kader</p>
             <p className="text-xl font-black text-blue-700 leading-none">{anggotaData.length}</p>
           </div>
        </div>
      </div>

      {/* Control Panel (Upload, Filter, Search) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        
        {/* Baris Atas: Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Tombol Import Excel */}
            <div className="relative inline-block w-full sm:w-auto">
               <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm">
                 <UploadCloud size={18}/> Import Excel
               </button>
               <input 
                 type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload}
                 className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
               />
            </div>
            
            {/* Tombol Tambah Manual */}
            <button onClick={handleAddManual} className="w-full sm:w-auto bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm">
              <Plus size={18}/> Baris Baru
            </button>
          </div>

          <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5 w-full sm:w-auto">
            <FileSpreadsheet size={14} className="text-emerald-500"/> Kolom Excel: <span className="font-bold text-slate-600">Nama | NIM | NIA | Rayon | Angkatan | WhatsApp</span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Baris Bawah: Filter & Pencarian */}
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Kolom Pencarian */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Cari nama atau NIM..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Filter Rayon */}
          <div className="relative w-full md:w-48 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={filterRayon} onChange={(e) => setFilterRayon(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-slate-50 font-medium text-slate-700"
            >
              {uniqueRayon.map((r, i) => <option key={i} value={r}>{r === "Semua" ? "Semua Rayon" : r}</option>)}
            </select>
          </div>

          {/* Filter Angkatan */}
          <div className="relative w-full md:w-40 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={filterAngkatan} onChange={(e) => setFilterAngkatan(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-slate-50 font-medium text-slate-700"
            >
              {uniqueAngkatan.map((a, i) => <option key={i} value={a}>{a === "Semua" ? "Semua Angkatan" : a}</option>)}
            </select>
          </div>
        </div>

      </div>

      {/* Tabel Database Interaktif (Inline Editing) */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] hide-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
            <thead className="bg-[#1e293b] text-white sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-12 text-center">No</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Nama Lengkap</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-32">NIM</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-32">NIA PMII</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-40">Asal Rayon</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-24 text-center">Angkatan</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-36">No. WhatsApp</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-16 text-center">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 bg-white">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="py-2 px-4 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                    
                    {/* Inline Edit Inputs */}
                    <td className="py-2 px-4">
                      <input type="text" value={item.nama} onChange={(e) => handleInputChange(item.id, "nama", e.target.value)} className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-400 px-2 py-1.5 rounded outline-none font-semibold text-slate-900 transition" placeholder="Nama..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.nim} onChange={(e) => handleInputChange(item.id, "nim", e.target.value)} className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-400 px-2 py-1.5 rounded outline-none font-mono text-xs transition" placeholder="NIM..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.nia} onChange={(e) => handleInputChange(item.id, "nia", e.target.value)} className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-400 px-2 py-1.5 rounded outline-none font-mono text-xs transition" placeholder="NIA..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.rayon} onChange={(e) => handleInputChange(item.id, "rayon", e.target.value)} className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-400 px-2 py-1.5 rounded outline-none text-sm transition" placeholder="Rayon..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.angkatan} onChange={(e) => handleInputChange(item.id, "angkatan", e.target.value)} className="w-full text-center bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-400 px-2 py-1.5 rounded outline-none font-bold text-slate-600 transition" placeholder="Tahun..." />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={item.whatsapp} onChange={(e) => handleInputChange(item.id, "whatsapp", e.target.value)} className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-400 px-2 py-1.5 rounded outline-none font-mono text-xs transition" placeholder="628..." />
                    </td>
                    
                    {/* Hapus Baris */}
                    <td className="py-2 px-4 text-center">
                      <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Hapus Data">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-2 opacity-50" />
                      <p className="font-medium text-slate-500">Tidak ada data anggota ditemukan.</p>
                      <p className="text-xs mt-1">Coba ubah filter pencarian atau unggah file Excel.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar (Simpan) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-900 p-4 rounded-xl sticky bottom-4 z-40 shadow-2xl shadow-blue-900/20 border border-blue-800">
         <div className="flex items-center gap-2 text-xs text-blue-200">
           <Info size={16} className="shrink-0 text-blue-400" />
           <p>Semua perubahan (ketikan manual, hapus, maupun import excel) belum akan tayang ke publik sebelum Anda menekan tombol simpan.</p>
         </div>
         <button onClick={handleSave} className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md text-sm whitespace-nowrap shrink-0">
            <Save size={18} /> Simpan Database
          </button>
      </div>

    </div>
  );
}