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

        data.forEach((row, index) => { 
          newData.push({
            id: `excel-import-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`, 
            nama: String(row["Nama Lengkap"] || row["Nama"] || "").trim(),
            nim: String(row["NIM"] || "").trim(),
            nia: String(row["NIA"] || "").trim(),
            rayon: String(row["Rayon"] || row["Asal Rayon"] || "").trim(),
            angkatan: String(row["Angkatan"] || row["Tahun"] || "").trim(),
            whatsapp: String(row["WhatsApp"] || row["WA"] || "").trim(),
          });
        });

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

  const uniqueRayon = ["Semua", ...new Set(anggotaData.map(item => item.rayon).filter(r => r !== ""))];
  const uniqueAngkatan = ["Semua", ...new Set(anggotaData.map(item => item.angkatan).filter(a => a !== ""))].sort();

  const filteredData = anggotaData.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.nim.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRayon = filterRayon === "Semua" || item.rayon === filterRayon;
    const matchAngkatan = filterAngkatan === "Semua" || item.angkatan === filterAngkatan;
    
    return matchSearch && matchRayon && matchAngkatan;
  });

  // STYLE STANDAR ENTERPRISE UNTUK INPUT INLINE
  const inputClass = "w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 border border-transparent focus:border-blue-300 px-2.5 py-1.5 rounded outline-none text-[13px] text-slate-800 transition-all placeholder:text-slate-400";

  if (loading) return <p className="text-slate-500 text-[13px] font-medium">Memuat database anggota...</p>;

  return (
    <div className="space-y-6 pb-12 w-full">
      
      {/* HEADER PANEL & STATISTIK */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">Database Anggota</h1>
          <p className="text-[13px] text-slate-500 mt-1">Pusat data kader PMII Komisariat. Anda bisa mengetik langsung di tabel.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-md border border-slate-200 shadow-sm flex items-center gap-3 shrink-0">
           <Users size={18} className="text-blue-600" />
           <div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Total Kader Terdaftar</p>
             <p className="text-lg font-bold text-slate-800 leading-none">{anggotaData.length} <span className="text-[12px] font-medium text-slate-500">Orang</span></p>
           </div>
        </div>
      </div>

      {/* CONTROL PANEL (Upload, Filter, Search) */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-4">
        
        {/* Baris Atas: Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative inline-block w-full sm:w-auto">
               <button className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-[13px] flex items-center justify-center gap-2 transition shadow-sm">
                 <UploadCloud size={15}/> Impor via Excel
               </button>
               <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"/>
            </div>
            <button onClick={handleAddManual} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-4 rounded-md text-[13px] flex items-center justify-center gap-2 transition shadow-sm whitespace-nowrap">
              <Plus size={15}/> Tambah Baris Manual
            </button>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200 flex items-center gap-1.5 w-full sm:w-auto">
            <FileSpreadsheet size={14} className="text-emerald-600 shrink-0"/> 
            <span>Format Kolom: <span className="font-mono font-bold text-slate-700">Nama Lengkap | NIM | NIA | Rayon | Angkatan | WhatsApp</span></span>
          </div>
        </div>

        <div className="h-px bg-slate-100 w-full"></div>

        {/* Baris Bawah: Filter & Pencarian */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Cari nama atau NIM..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          <div className="relative w-full md:w-56 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={filterRayon} onChange={(e) => setFilterRayon(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-[13px] focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white font-medium text-slate-700 cursor-pointer"
            >
              {uniqueRayon.map((r, i) => <option key={i} value={r}>{r === "Semua" ? "Semua Rayon" : r}</option>)}
            </select>
          </div>

          <div className="relative w-full md:w-48 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={filterAngkatan} onChange={(e) => setFilterAngkatan(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-[13px] focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white font-medium text-slate-700 cursor-pointer"
            >
              {uniqueAngkatan.map((a, i) => <option key={i} value={a}>{a === "Semua" ? "Semua Angkatan" : a}</option>)}
            </select>
          </div>
        </div>

      </div>

      {/* TABEL DATABASE (INLINE EDITING) */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] hide-scrollbar relative">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px] table-fixed">
            <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                
                {/* Kolom Nama dibuat sangat lebar */}
                <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[25%] min-w-[200px] text-center">Nama Lengkap</th>
                
                <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[12%] min-w-[100px] text-center">NIM</th>
                <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[12%] min-w-[100px] text-center">NIA</th>
                
                {/* Kolom Rayon dibuat lebih lebar */}
                <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[20%] min-w-[160px] text-center">Asal Rayon</th>
                
                {/* Kolom Angkatan dibuat sangat kecil */}
                <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[8%] min-w-[60px] text-center">Angkatan</th>
                
                <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[13%] min-w-[120px] text-center">WhatsApp</th>
                <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700 bg-white">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-1.5 px-3 text-center font-mono font-medium text-slate-400 text-[12px]">{index + 1}</td>
                    
                    {/* Inline Edit Inputs */}
                    <td className="py-1.5 px-3">
                      <input type="text" value={item.nama} onChange={(e) => handleInputChange(item.id, "nama", e.target.value)} className={`${inputClass} font-semibold`} placeholder="Nama Lengkap..." />
                    </td>
                    <td className="py-1.5 px-3">
                      <input type="text" value={item.nim} onChange={(e) => handleInputChange(item.id, "nim", e.target.value)} className={`${inputClass} font-mono text-[12px] text-center`} placeholder="NIM..." />
                    </td>
                    <td className="py-1.5 px-3">
                      <input type="text" value={item.nia} onChange={(e) => handleInputChange(item.id, "nia", e.target.value)} className={`${inputClass} font-mono text-[12px] text-center`} placeholder="NIA..." />
                    </td>
                    <td className="py-1.5 px-3">
                      <input type="text" value={item.rayon} onChange={(e) => handleInputChange(item.id, "rayon", e.target.value)} className={`${inputClass} text-center`} placeholder="Rayon..." />
                    </td>
                    <td className="py-1.5 px-3">
                      <input type="text" value={item.angkatan} onChange={(e) => handleInputChange(item.id, "angkatan", e.target.value)} className={`${inputClass} text-center font-medium`} placeholder="Tahun..." />
                    </td>
                    <td className="py-1.5 px-3">
                      <input type="text" value={item.whatsapp} onChange={(e) => handleInputChange(item.id, "whatsapp", e.target.value)} className={`${inputClass} font-mono text-[12px]`} placeholder="628..." />
                    </td>
                    
                    {/* Aksi Hapus */}
                    <td className="py-1.5 px-3 text-center">
                      <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition border border-transparent hover:border-red-100" title="Hapus Data">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={24} className="mb-3 opacity-30" />
                      <p className="font-medium text-slate-600 text-[13px]">Tidak ada data anggota ditemukan.</p>
                      <p className="text-[12px] mt-1">Sesuaikan filter pencarian atau pastikan data telah diunggah.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar (Simpan) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-md border border-slate-200 sticky bottom-6 z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="flex items-start gap-2.5 text-[12px] text-slate-600 max-w-2xl">
           <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
           <p>Semua perubahan (ketikan manual, hapus, maupun impor excel) baru akan diperbarui ke sistem publik setelah Anda menekan tombol simpan.</p>
         </div>
         <button onClick={handleSave} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shrink-0 text-[13px]">
            <Save size={15} /> Simpan Pembaruan Database
          </button>
      </div>

    </div>
  );
}