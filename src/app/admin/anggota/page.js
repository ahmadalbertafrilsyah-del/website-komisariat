"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { Save, Users, Plus, Trash2, FileSpreadsheet, UploadCloud, Search, Filter, Info, UserPlus, ChevronDown, ChevronUp, Loader2, CheckSquare } from "lucide-react";

const RAYON_OPTIONS = [
  "PR. PMII “KAWAH” Chondrodimuko",
  "PR. PMII “Perjuangan” Ibnu Aqil",
  "PR. PMII “Radikal” Al-Faruq",
  "PR. PMII “Penakluk” Al-Adawiyah",
  "PR. PMII “Penyelamat” Dja’far Saifuddin",
  "PR. PMII Ekonomi “Moch. Hatta”",
  "PR. PMII Pencerahan Galileo"
];

export default function AdminAnggotaEditor() {
  const [loading, setLoading] = useState(true);
  const [anggotaData, setAnggotaData] = useState([]);
  
  // State UI Panel
  const [activePanel, setActivePanel] = useState(null); // 'manual' | 'excel' | null
  
  // State Form Manual
  const [newAnggota, setNewAnggota] = useState({ nama: "", nim: "", nia: "", rayon: "", angkatan: "", whatsapp: "" });

  // State Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRayon, setFilterRayon] = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");

  // State Hapus Massal (Bulk Delete)
  const [selectedIds, setSelectedIds] = useState([]);

  const fileInputRef = useRef(null);

  // 1. LOAD DATA & AUTO-FIX DUPLICATE IDs
  useEffect(() => {
    async function loadAnggota() {
      try {
        const docRef = doc(db, "website_config", "database_anggota");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAnggota) {
          const seenIds = new Set();
          const loadedData = docSnap.data().listAnggota.map((item, index) => {
            let uniqueId = item.id;
            if (!uniqueId || seenIds.has(uniqueId)) {
              uniqueId = `kdr-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
            }
            seenIds.add(uniqueId);
            return { ...item, id: uniqueId };
          });
          setAnggotaData(loadedData);
        }
      } catch (error) {
        console.error("Gagal mengambil data anggota:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnggota();
  }, []);

  // 2. FUNGSI UPLOAD EXCEL
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
          if(row["Nama Lengkap"] || row["Nama"]) {
            newData.push({
              id: `xls-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`, 
              nama: String(row["Nama Lengkap"] || row["Nama"] || "").trim(),
              nim: String(row["NIM"] || "").trim(),
              nia: String(row["NIA"] || "").trim(),
              rayon: String(row["Rayon"] || row["Asal Rayon"] || "").trim(),
              angkatan: String(row["Angkatan"] || row["Tahun"] || "").trim(),
              whatsapp: String(row["WhatsApp"] || row["WA"] || "").trim(),
            });
          }
        });

        setAnggotaData(prev => [...newData, ...prev]);
        setActivePanel(null); 
        alert(`Berhasil mengimpor ${newData.length} data anggota baru! Jangan lupa klik "Simpan Pembaruan Data".`);
      } catch (error) {
        alert("Gagal memproses file Excel. Pastikan format kolom benar.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  // 3. TAMBAH BARIS MANUAL DARI FORM
  const submitManualAdd = (e) => {
    e.preventDefault();
    if (!newAnggota.nama.trim()) return alert("Nama Lengkap wajib diisi!");
    
    const newEntry = {
      id: `mnl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...newAnggota
    };

    setAnggotaData([newEntry, ...anggotaData]);
    setNewAnggota({ nama: "", nim: "", nia: "", rayon: "", angkatan: "", whatsapp: "" });
    setActivePanel(null); 
  };

  // 4. HAPUS & EDIT (INLINE)
  const handleDelete = (id) => {
    if(!confirm("Yakin ingin menghapus anggota ini dari database?")) return;
    setAnggotaData(anggotaData.filter(item => item.id !== id));
    // Jika ID yang dihapus sedang terpilih, buang dari selectedIds
    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
  };

  const handleInputChange = (id, field, value) => {
    setAnggotaData(anggotaData.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // 5. FITUR HAPUS MASSAL (BULK DELETE)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredData.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if(!confirm(`PERINGATAN! Anda yakin ingin menghapus ${selectedIds.length} anggota yang dipilih secara permanen?`)) return;
    setAnggotaData(anggotaData.filter(item => !selectedIds.includes(item.id)));
    setSelectedIds([]); // Reset pilihan setelah dihapus
  };

  // 6. SIMPAN KE FIREBASE
  const handleSave = async () => {
    try {
      const docRef = doc(db, "website_config", "database_anggota");
      await setDoc(docRef, { listAnggota: anggotaData });
      alert("Database Anggota berhasil diperbarui dan disimpan secara permanen!");
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  // FILTERING LOGIC
  const uniqueRayon = ["Semua", ...new Set(anggotaData.map(item => item.rayon).filter(r => r !== ""))];
  const uniqueAngkatan = ["Semua", ...new Set(anggotaData.map(item => item.angkatan).filter(a => a !== ""))].sort();

  const filteredData = anggotaData.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.nim.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRayon = filterRayon === "Semua" || item.rayon === filterRayon;
    const matchAngkatan = filterAngkatan === "Semua" || item.angkatan === filterAngkatan;
    return matchSearch && matchRayon && matchAngkatan;
  });

  // KELAS CSS INLINE EDIT
  const inputClass = "w-full bg-transparent border border-transparent hover:bg-slate-100 hover:border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 px-3 py-1.5 rounded-md outline-none text-sm text-slate-700 transition-all placeholder:text-slate-300";

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full">
      
      {/* HEADER & STATISTIK */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Database Anggota</h1>
          <p className="text-sm text-slate-500 mt-1">Pusat kelola data seluruh kader PMII. Desain tabel dioptimalkan untuk kemudahan editing.</p>
        </div>
        <div className="bg-blue-50 px-5 py-3 rounded-xl border border-blue-100 shadow-sm flex items-center gap-4 shrink-0">
           <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={20} /></div>
           <div>
             <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none mb-1">Total Kader Terdaftar</p>
             <p className="text-xl font-black text-blue-900 leading-none">{anggotaData.length} <span className="text-xs font-semibold text-blue-600">Orang</span></p>
           </div>
        </div>
      </div>

      {/* PANEL KENDALI ATAS (TAMBAH & IMPOR) */}
      <div className="grid md:grid-cols-2 gap-4">
        <button 
          onClick={() => setActivePanel(activePanel === 'manual' ? null : 'manual')}
          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${activePanel === 'manual' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700 shadow-sm'}`}
        >
          <span className="flex items-center gap-3 font-bold"><UserPlus size={20}/> Tambah Kader Manual</span>
          {activePanel === 'manual' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
        </button>

        <button 
          onClick={() => setActivePanel(activePanel === 'excel' ? null : 'excel')}
          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${activePanel === 'excel' ? 'bg-emerald-600 text-white border-emerald-700 shadow-md' : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-700 shadow-sm'}`}
        >
          <span className="flex items-center gap-3 font-bold"><FileSpreadsheet size={20}/> Impor Data dari Excel</span>
          {activePanel === 'excel' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
        </button>
      </div>

      {/* ISI PANEL MANUAL */}
      {activePanel === 'manual' && (
        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
          <div className="mb-5 bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p>Gunakan formulir ini untuk menambahkan satu kader baru ke baris paling atas. Setelah tersimpan, Anda masih bisa mengeditnya di tabel bawah.</p>
          </div>
          <form onSubmit={submitManualAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input type="text" required value={newAnggota.nama} onChange={e => setNewAnggota({...newAnggota, nama: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masukkan nama kader..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIM (Opsional)</label>
              <input type="text" value={newAnggota.nim} onChange={e => setNewAnggota({...newAnggota, nim: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="230..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIA (Opsional)</label>
              <input type="text" value={newAnggota.nia} onChange={e => setNewAnggota({...newAnggota, nia: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="04.05..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp</label>
              <input type="text" value={newAnggota.whatsapp} onChange={e => setNewAnggota({...newAnggota, whatsapp: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="628..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Asal Rayon</label>
              <select value={newAnggota.rayon} onChange={e => setNewAnggota({...newAnggota, rayon: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="">Pilih Rayon...</option>
                {RAYON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Angkatan Mapaba</label>
              <input type="text" value={newAnggota.angkatan} onChange={e => setNewAnggota({...newAnggota, angkatan: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Misal: 2024" />
            </div>
            <div className="md:col-span-3 pt-2">
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition flex items-center gap-2">
                <Plus size={16}/> Masukkan ke Tabel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ISI PANEL EXCEL */}
      {activePanel === 'excel' && (
        <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm animate-in slide-in-from-top-2">
          <div className="mb-5 bg-emerald-50 text-emerald-800 text-xs p-4 rounded-lg">
            <h4 className="font-bold mb-2 flex items-center gap-1.5"><Info size={16}/> Format Kolom Tabel Excel Wajib:</h4>
            <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white border border-emerald-200 px-2 py-1 rounded shadow-sm">Nama Lengkap</span>
              <span className="bg-white border border-emerald-200 px-2 py-1 rounded shadow-sm">NIM</span>
              <span className="bg-white border border-emerald-200 px-2 py-1 rounded shadow-sm">NIA</span>
              <span className="bg-white border border-emerald-200 px-2 py-1 rounded shadow-sm">Rayon</span>
              <span className="bg-white border border-emerald-200 px-2 py-1 rounded shadow-sm">Angkatan</span>
              <span className="bg-white border border-emerald-200 px-2 py-1 rounded shadow-sm">WhatsApp</span>
            </div>
          </div>
          
          <div className="relative w-full md:w-1/2">
             <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md">
               <UploadCloud size={18}/> Unggah File Excel (.xlsx / .xls)
             </button>
             <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
          </div>
        </div>
      )}

      {/* PANEL BULK DELETE (Muncul jika ada item yang dicentang) */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-200 text-red-700 p-2 rounded-lg"><CheckSquare size={20}/></div>
            <div>
              <p className="text-red-800 font-bold text-sm">Mode Hapus Massal Aktif</p>
              <p className="text-red-600 text-xs mt-0.5">Terdapat <strong>{selectedIds.length} data</strong> yang telah Anda centang untuk dihapus.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button onClick={() => setSelectedIds([])} className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-200 transition">Batal</button>
             <button onClick={handleBulkDelete} className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm shadow-red-600/30">
                <Trash2 size={16}/> Hapus Sekarang
             </button>
          </div>
        </div>
      )}

      {/* AREA TABEL UTAMA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar: Search & Filter */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Cari nama atau NIM kader..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
            />
          </div>

          <div className="relative w-full md:w-56 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={filterRayon} onChange={(e) => setFilterRayon(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white font-bold text-slate-700 cursor-pointer"
            >
              {uniqueRayon.map((r, i) => <option key={i} value={r}>{r === "Semua" ? "Semua Rayon" : r}</option>)}
            </select>
          </div>

          <div className="relative w-full md:w-48 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={filterAngkatan} onChange={(e) => setFilterAngkatan(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white font-bold text-slate-700 cursor-pointer"
            >
              {uniqueAngkatan.map((a, i) => <option key={i} value={a}>{a === "Semua" ? "Semua Angkatan" : a}</option>)}
            </select>
          </div>
        </div>

        {/* Tabel Data - Desain Bersih & Modern */}
        <div className="overflow-x-auto max-h-[60vh] hide-scrollbar relative">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px] table-fixed">
            <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                   <input 
                     type="checkbox" 
                     onChange={handleSelectAll} 
                     checked={filteredData.length > 0 && selectedIds.length === filteredData.length} 
                     className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     title="Pilih Semua"
                   />
                </th>
                <th className="py-3 px-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                <th className="py-3 px-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-[22%] min-w-[200px]">Nama Lengkap</th>
                <th className="py-3 px-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-[12%] min-w-[100px]">NIM</th>
                <th className="py-3 px-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-[12%] min-w-[100px]">NIA</th>
                <th className="py-3 px-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-[22%] min-w-[180px]">Asal Rayon</th>
                <th className="py-3 px-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-[10%] min-w-[80px]">Angkatan</th>
                <th className="py-3 px-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-[14%] min-w-[120px]">WhatsApp</th>
                <th className="py-3 px-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-14 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className={`${isSelected ? 'bg-red-50/50' : 'hover:bg-blue-50/30'} transition-colors group`}>
                      
                      <td className="py-2 px-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => handleSelect(item.id)} 
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                        />
                      </td>

                      <td className="py-2 px-2 text-center font-mono font-medium text-slate-400 text-xs">
                         {index + 1}
                      </td>
                      
                      {/* Inline Edit Transparan */}
                      <td className="py-2 px-2">
                        <input type="text" value={item.nama} onChange={(e) => handleInputChange(item.id, "nama", e.target.value)} className={`${inputClass} font-bold`} placeholder="Ketik nama..." />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={item.nim} onChange={(e) => handleInputChange(item.id, "nim", e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="NIM..." />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={item.nia} onChange={(e) => handleInputChange(item.id, "nia", e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="NIA..." />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={item.rayon} onChange={(e) => handleInputChange(item.id, "rayon", e.target.value)} className={inputClass} placeholder="Rayon..." />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={item.angkatan} onChange={(e) => handleInputChange(item.id, "angkatan", e.target.value)} className={inputClass} placeholder="Tahun..." />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={item.whatsapp} onChange={(e) => handleInputChange(item.id, "whatsapp", e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="628..." />
                      </td>
                      
                      <td className="py-2 px-4 text-center">
                        <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all border border-transparent hover:border-red-200" title="Hapus Data">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-4 opacity-20" />
                      <p className="font-bold text-slate-600 text-sm">Tidak ada data anggota ditemukan.</p>
                      <p className="text-xs mt-1 text-slate-400">Sesuaikan filter pencarian atau tambahkan data baru terlebih dahulu.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar (Simpan) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl sticky bottom-6 z-40 shadow-2xl shadow-slate-900/20">
         <div className="flex items-center gap-3 text-sm text-slate-300 max-w-2xl px-2">
           <Info size={20} className="shrink-0 text-blue-400" />
           <p>Semua perubahan data dan modifikasi teks pada tabel <strong>wajib disimpan</strong> agar diperbarui di sistem publik.</p>
         </div>
         <button onClick={handleSave} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 whitespace-nowrap shrink-0 text-sm">
            <Save size={18} /> Simpan Pembaruan Data
          </button>
      </div>

    </div>
  );
}