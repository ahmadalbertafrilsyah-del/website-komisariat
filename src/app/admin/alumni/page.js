"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
// 🔥 PERBAIKAN: Menambahkan 'Users' & Chevron di daftar import ini
import { Save, Plus, Trash2, GraduationCap, Search, Image as ImageIcon, UploadCloud, FileSpreadsheet, Download, Loader2, Info, Star, Briefcase, Users, ChevronDown, ChevronUp } from "lucide-react";
import * as XLSX from "xlsx";

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

// Komponen Tag Editor
const EditTags = ({ data, onChange, placeholderText, theme = "blue" }) => {
  const dataArray = Array.isArray(data) ? data : (typeof data === 'string' && data.trim() !== '' ? data.split(',').map(p => p.trim()) : []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); 
      if (e.target.value.trim()) {
        const newTag = e.target.value.trim();
        if (!dataArray.includes(newTag)) onChange([...dataArray, newTag]);
        e.target.value = '';
      }
    } else if (e.key === 'Backspace' && e.target.value === '' && dataArray.length > 0) {
      onChange(dataArray.slice(0, -1));
    }
  };

  const removeTag = (idx) => onChange(dataArray.filter((_, i) => i !== idx));

  const getThemeClasses = () => {
    if (theme === 'violet') return { bg: 'bg-violet-50 text-violet-700 border-violet-200', text: 'text-violet-600 placeholder:text-violet-300 focus:border-violet-500', btn: 'text-violet-400 hover:text-red-500' };
    return { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600 placeholder:text-blue-300 focus:border-blue-500', btn: 'text-blue-400 hover:text-red-500' };
  };
  const { bg, text, btn } = getThemeClasses();

  return (
    <div className="w-full flex flex-col gap-1.5 mt-1.5">
      <div className="flex flex-wrap gap-1.5">
        {dataArray.map((p, idx) => (
          <span key={idx} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${bg}`}>
            {p}
            <button type="button" onClick={() => removeTag(idx)} className={`font-bold ml-1 outline-none transition-colors ${btn}`}>&times;</button>
          </span>
        ))}
      </div>
      <input
        type="text" onKeyDown={handleKeyDown} placeholder={dataArray.length === 0 ? "+ Ketik (lalu Enter)" : placeholderText}
        className={`w-full font-medium bg-transparent border-b border-slate-200 hover:border-slate-300 text-xs outline-none transition-colors pb-1 ${text}`}
      />
    </div>
  );
};

export default function AdminAlumni() {
  const [loading, setLoading] = useState(true);
  const [alumniData, setAlumniData] = useState([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false); // State untuk Toggle Form
  
  const [newNama, setNewNama] = useState("");
  const [newTahun, setNewTahun] = useState("");
  const [newRayon, setNewRayon] = useState("");
  
  const [newProfesi, setNewProfesi] = useState([]); 
  const [inputProfesi, setInputProfesi] = useState(""); 
  const [newDeskripsiProfesi, setNewDeskripsiProfesi] = useState({}); 
  
  const [newBidang, setNewBidang] = useState([]); 
  const [inputBidang, setInputBidang] = useState(""); 
  
  const [newFoto, setNewFoto] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const excelInputRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const docRef = doc(db, "website_config", "database_alumni");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAlumni) setAlumniData(docSnap.data().listAlumni);
      } catch (error) { console.error("Gagal load alumni:", error); } 
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const handleUploadCloudinary = async (file, targetId = null) => {
    if (!file) return;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) { alert("Konfigurasi Cloudinary di .env.local belum diatur!"); return; }
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file); formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (targetId) handleInputChange(targetId, "foto", data.secure_url); else setNewFoto(data.secure_url);
    } catch (error) { alert("Gagal mengunggah gambar ke Cloudinary."); } 
    finally { setUploadingImage(false); }
  };

  const handleDownloadTemplate = () => {
    const templateData = [{ "Nama Lengkap": "Ahmad Albert", "Tahun Mapaba": "2024", "Asal Rayon": "PR. PMII “KAWAH” Chondrodimuko", "Profesi Saat Ini": "Dosen, Software Engineer", "Deskripsi Profesi": "Dosen UB | Web Developer", "Bidang yang Dikuasai": "Web Development, AI", "URL Foto Profil": "https://..." }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{wch: 25}, {wch: 15}, {wch: 30}, {wch: 30}, {wch: 40}, {wch: 30}, {wch: 30}];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data_Alumni"); XLSX.writeFile(wb, "Template_Alumni_PMII.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let updatedAlumni = [...alumniData]; let importedCount = 0;
        
        data.forEach(row => {
           const nama = row["Nama Lengkap"]; if(!nama) return;
           importedCount++;
           let index = updatedAlumni.findIndex(a => a.nama.toLowerCase() === nama.toLowerCase());
           
           const profesiArray = row["Profesi Saat Ini"] ? String(row["Profesi Saat Ini"]).split(',').map(s => s.trim()).filter(Boolean) : [];
           const bidangArray = row["Bidang yang Dikuasai"] ? String(row["Bidang yang Dikuasai"]).split(',').map(s => s.trim()).filter(Boolean) : [];
           const deskripsiRaw = row["Deskripsi Profesi"] ? String(row["Deskripsi Profesi"]).split('|').map(s => s.trim()) : [];
           const deskripsiObj = {}; profesiArray.forEach((prof, i) => { deskripsiObj[prof] = deskripsiRaw[i] || ""; });

           if (index === -1) {
               updatedAlumni.push({ id: Date.now() + Math.random(), nama, tahunMapaba: row["Tahun Mapaba"] || "", asalRayon: row["Asal Rayon"] || "", profesi: profesiArray, deskripsiProfesi: deskripsiObj, bidang: bidangArray, foto: row["URL Foto Profil"] || "" });
           } else {
               updatedAlumni[index] = { ...updatedAlumni[index], tahunMapaba: row["Tahun Mapaba"] || updatedAlumni[index].tahunMapaba, asalRayon: row["Asal Rayon"] || updatedAlumni[index].asalRayon, profesi: profesiArray.length ? profesiArray : updatedAlumni[index].profesi, bidang: bidangArray.length ? bidangArray : updatedAlumni[index].bidang, foto: row["URL Foto Profil"] || updatedAlumni[index].foto, deskripsiProfesi: { ...(updatedAlumni[index].deskripsiProfesi || {}), ...deskripsiObj } };
           }
        });
        setAlumniData(updatedAlumni); alert(`Berhasil mengimpor ${importedCount} data alumni dari Excel! Klik 'Simpan Pembaruan Direktori' di bawah untuk mengunci data.`);
      } catch (error) { alert("Gagal membaca file Excel. Pastikan format tabel sudah sesuai template."); }
    };
    reader.readAsBinaryString(file); e.target.value = null; 
  };

  const handleAdd = (e) => {
    e.preventDefault(); if (!newNama.trim()) return;
    let finalProfesi = [...newProfesi]; if (inputProfesi.trim() && !finalProfesi.includes(inputProfesi.trim())) finalProfesi.push(inputProfesi.trim());
    let finalBidang = [...newBidang]; if (inputBidang.trim() && !finalBidang.includes(inputBidang.trim())) finalBidang.push(inputBidang.trim());

    setAlumniData([{ id: Date.now(), nama: newNama, tahunMapaba: newTahun, asalRayon: newRayon, profesi: finalProfesi, deskripsiProfesi: newDeskripsiProfesi, bidang: finalBidang, foto: newFoto }, ...alumniData]);
    setNewNama(""); setNewTahun(""); setNewRayon(""); setNewProfesi([]); setInputProfesi(""); setNewDeskripsiProfesi({}); setNewBidang([]); setInputBidang(""); setNewFoto("");
  };

  const handleDelete = (id) => { if (confirm("Yakin ingin menghapus alumni ini?")) setAlumniData(alumniData.filter(item => item.id !== id)); };
  const handleInputChange = (id, field, value) => { setAlumniData(alumniData.map(item => item.id === id ? { ...item, [field]: value } : item)); };

  const handleSaveAll = async (e) => {
    if(e) e.preventDefault();
    try { await setDoc(doc(db, "website_config", "database_alumni"), { listAlumni: alumniData }); alert("Data Direktori Alumni berhasil diperbarui dan disimpan ke Server!"); } 
    catch (error) { alert("Gagal menyimpan: " + error.message); }
  };

  const filteredData = alumniData.filter(a => {
    const searchLower = searchQuery.toLowerCase();
    const profesiString = Array.isArray(a.profesi) ? a.profesi.join(" ") : (a.profesi || "");
    const bidangString = Array.isArray(a.bidang) ? a.bidang.join(" ") : (a.bidang || "");
    const deskripsiString = typeof a.deskripsiProfesi === 'object' && a.deskripsiProfesi !== null ? Object.values(a.deskripsiProfesi).join(" ") : (typeof a.deskripsiProfesi === 'string' ? a.deskripsiProfesi : "");

    return ((a.nama || "").toLowerCase().includes(searchLower) || profesiString.toLowerCase().includes(searchLower) || bidangString.toLowerCase().includes(searchLower) || deskripsiString.toLowerCase().includes(searchLower) || (a.asalRayon || "").toLowerCase().includes(searchLower));
  });

  const inputStandardClass = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm";
  const labelStandardClass = "text-xs font-semibold text-slate-700 block mb-1.5";

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full text-sm">
      
      {/* HEADER PANEL */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Direktori Alumni
          </h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data profil, profesi, dan keahlian jejaring alumni PMII Komisariat.</p>
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

      {/* FORM TAMBAH ALUMNI (DIBUAT COLLAPSEABLE AGAR TIDAK RIBET) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full px-6 py-4 flex items-center justify-between font-semibold text-slate-800 hover:bg-slate-50 transition"
        >
          <span className="flex items-center gap-2"><Plus size={18} className="text-blue-600" /> Tambah Data Alumni Baru</span>
          {isFormOpen ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
        </button>
        
        {isFormOpen && (
          <div className="p-6 border-t border-slate-200 animate-in slide-in-from-top-2">
            {/* PANDUAN CEPAT ADMIN */}
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-md p-4 text-xs text-blue-800 flex gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p><strong>Panduan Cepat:</strong> Masukkan detail profil dasar melalui form ini. Setelah data terbuat, Anda bisa mengedit dan menambahkan rincian profesi (tag) atau bidang keahlian langsung dari daftar tabel di bawah secara praktis.</p>
            </div>

            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              
              <div className="md:col-span-4 space-y-1">
                <label className={labelStandardClass}>Nama Lengkap</label>
                <input type="text" required value={newNama} onChange={e => setNewNama(e.target.value)} className={inputStandardClass} placeholder="Nama & Gelar"/>
              </div>
              
              <div className="md:col-span-2 space-y-1">
                <label className={labelStandardClass}>Tahun Mapaba</label>
                <input type="text" value={newTahun} onChange={e => setNewTahun(e.target.value)} className={inputStandardClass} placeholder="Contoh: 2015"/>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className={labelStandardClass}>Asal Rayon</label>
                <select value={newRayon} onChange={e => setNewRayon(e.target.value)} className={`${inputStandardClass} bg-white appearance-none`}>
                  <option value="">Pilih Rayon</option>
                  {RAYON_OPTIONS.map(rayon => <option key={rayon} value={rayon}>{rayon}</option>)}
                </select>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className={labelStandardClass}>Foto Profil</label>
                <div className="flex gap-2">
                   <input type="text" value={newFoto} onChange={e => setNewFoto(e.target.value)} className={`${inputStandardClass} flex-1 font-mono text-xs`} placeholder="URL Gambar..."/>
                   <label className="bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer px-3 border border-slate-300 rounded-md flex items-center justify-center transition-colors shadow-sm">
                      {uploadingImage ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16}/>}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadCloudinary(e.target.files[0])} disabled={uploadingImage}/>
                   </label>
                </div>
              </div>

              {/* Tags Section */}
              <div className="md:col-span-6 space-y-1 bg-slate-50 p-4 rounded-md border border-slate-200">
                <label className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 mb-2"><Briefcase size={14}/> Profesi & Karir Saat Ini</label>
                <div className="w-full min-h-[42px] p-2 border border-slate-300 bg-white rounded-md flex flex-wrap gap-1.5 items-center shadow-sm">
                   {newProfesi.map((p, i) => (
                     <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200 flex items-center gap-1.5">
                        {p} <button type="button" onClick={() => setNewProfesi(newProfesi.filter((_, idx) => idx !== i))} className="hover:text-red-500 font-bold">&times;</button>
                     </span>
                   ))}
                   <input type="text" value={inputProfesi} onChange={(e) => setInputProfesi(e.target.value)} className="bg-transparent border-none outline-none text-sm flex-1 min-w-[120px] px-1" placeholder={newProfesi.length === 0 ? "Ketik lalu Enter..." : "Tambah profesi..."}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const val = inputProfesi.trim(); if (val && !newProfesi.includes(val)) { setNewProfesi([...newProfesi, val]); setInputProfesi(''); } } 
                       else if (e.key === 'Backspace' && inputProfesi === '' && newProfesi.length > 0) setNewProfesi(newProfesi.slice(0, -1));
                     }}
                   />
                </div>
              </div>

              <div className="md:col-span-6 space-y-1 bg-slate-50 p-4 rounded-md border border-slate-200">
                 <label className="text-xs font-semibold text-violet-700 flex items-center gap-1.5 mb-2"><Star size={14}/> Bidang Keahlian Spesifik</label>
                 <div className="w-full min-h-[42px] p-2 border border-slate-300 bg-white rounded-md flex flex-wrap gap-1.5 items-center shadow-sm">
                   {newBidang.map((p, i) => (
                     <span key={i} className="px-2 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded border border-violet-200 flex items-center gap-1.5">
                        {p} <button type="button" onClick={() => setNewBidang(newBidang.filter((_, idx) => idx !== i))} className="hover:text-red-500 font-bold">&times;</button>
                     </span>
                   ))}
                   <input type="text" value={inputBidang} onChange={(e) => setInputBidang(e.target.value)} className="bg-transparent border-none outline-none text-sm flex-1 min-w-[120px] px-1" placeholder={newBidang.length === 0 ? "Web Developer, Penulis..." : "Tambah keahlian..."}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const val = inputBidang.trim(); if (val && !newBidang.includes(val)) { setNewBidang([...newBidang, val]); setInputBidang(''); } } 
                       else if (e.key === 'Backspace' && inputBidang === '' && newBidang.length > 0) setNewBidang(newBidang.slice(0, -1));
                     }}
                   />
                 </div>
              </div>

              {newProfesi.length > 0 && (
                <div className="md:col-span-12 space-y-2 mt-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Info size={14} className="text-blue-500"/> Keterangan/Deskripsi Profesi</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {newProfesi.map((p, idx) => (
                       <div key={idx} className="bg-slate-50 border border-slate-200 rounded-md p-3">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2"><Briefcase size={12} className="text-blue-500"/> {p}</span>
                          <input type="text" value={newDeskripsiProfesi[p] || ""} onChange={e => setNewDeskripsiProfesi({...newDeskripsiProfesi, [p]: e.target.value})} className={inputStandardClass} placeholder={`Detail / Instansi untuk ${p}...`}/>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-12 mt-2">
                <button type="submit" className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-6 rounded-md text-sm transition shadow-sm flex items-center justify-center gap-2">
                  <Plus size={16} /> Simpan Data Alumni Baru
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* DAFTAR KARTU ALUMNI (EDIT) */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
           <h3 className="font-semibold text-slate-800 flex items-center gap-2">
             <Users size={18} className="text-slate-500" /> Database Alumni Terdaftar
           </h3>
           <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <input type="text" placeholder="Cari nama, rayon, profesi..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className={inputStandardClass + " pl-9"}/>
           </div>
        </div>
        
        {/* GRID KARTU EDIT */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredData.length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-500 font-medium">Data alumni tidak ditemukan.</div>
            ) : (
              filteredData.map(a => (
                <div key={a.id} className="border border-slate-200 p-4 rounded-lg flex flex-row items-start gap-4 bg-white relative group hover:border-slate-300 transition-colors">
                   
                   {/* FOTO */}
                   <label className="shrink-0 cursor-pointer w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center relative shadow-sm">
                     {a.foto ? <img src={a.foto} alt="profil" className="w-full h-full object-cover"/> : <ImageIcon size={24} className="text-slate-300"/>}
                     <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <UploadCloud size={18} className="text-white"/>
                     </div>
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadCloudinary(e.target.files[0], a.id)}/>
                   </label>

                   <div className="flex-1 min-w-0 space-y-3">
                      
                      <div className="flex justify-between items-start gap-3">
                        <input type="text" value={a.nama} onChange={e => handleInputChange(a.id, "nama", e.target.value)} className="w-full font-bold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-400 text-sm md:text-base outline-none px-2 py-1 rounded transition-colors truncate -ml-2" placeholder="Nama Lengkap"/>
                        <button type="button" onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors border border-transparent hover:border-red-200" title="Hapus Alumni"><Trash2 size={16}/></button>
                      </div>
                      
                      {/* EDIT PROFESI */}
                      <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                         <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Profesi & Karir</span>
                         <EditTags data={a.profesi} onChange={(newArr) => handleInputChange(a.id, "profesi", newArr)} placeholderText="+ Profesi..." theme="blue" />
                         
                         {a.profesi && a.profesi.length > 0 && (
                            <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-200/60">
                              {a.profesi.map((p, pIdx) => (
                                 <div key={pIdx} className="flex items-center gap-2">
                                   <span className="text-[10px] font-medium bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md max-w-[80px] truncate shadow-sm">{p}</span>
                                   <input type="text" value={ (typeof a.deskripsiProfesi === 'object' && a.deskripsiProfesi !== null) ? (a.deskripsiProfesi[p] || "") : ""} onChange={(e) => { const updatedDesk = typeof a.deskripsiProfesi === 'object' && a.deskripsiProfesi !== null ? { ...a.deskripsiProfesi } : {}; updatedDesk[p] = e.target.value; handleInputChange(a.id, "deskripsiProfesi", updatedDesk); }} className="flex-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-400 text-[11px] md:text-xs outline-none px-2 py-1 rounded transition-colors text-slate-700" placeholder={`Detail ${p}...`}/>
                                 </div>
                              ))}
                            </div>
                         )}
                      </div>

                      {/* EDIT BIDANG KEAHLIAN */}
                      <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                         <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Bidang Keahlian</span>
                         <EditTags data={a.bidang} onChange={(newArr) => handleInputChange(a.id, "bidang", newArr)} placeholderText="+ Keahlian..." theme="violet" />
                      </div>
                      
                      {/* Mapaba & Rayon di Kartu Edit */}
                      <div className="flex gap-3 pt-1">
                         <div className="w-1/3">
                            <input type="text" value={a.tahunMapaba} onChange={e => handleInputChange(a.id, "tahunMapaba", e.target.value)} className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-400 text-xs outline-none text-slate-600 px-2 py-1.5 rounded transition-colors" placeholder="Thn Mapaba"/>
                         </div>
                         <div className="w-2/3">
                            <select value={a.asalRayon} onChange={e => handleInputChange(a.id, "asalRayon", e.target.value)} className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-400 text-xs outline-none text-slate-600 px-2 py-1.5 rounded transition-colors appearance-none truncate">
                               <option value="">Pilih Rayon</option>
                               {RAYON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                         </div>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Simpan) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 sticky bottom-6 z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="flex items-start gap-2.5 text-sm text-slate-600 max-w-2xl">
           <Info size={18} className="shrink-0 mt-0.5 text-blue-500" />
           <p>Semua perubahan pada kartu alumni (termasuk tag profesi dan keahlian) baru akan diperbarui ke sistem publik setelah Anda menekan tombol simpan.</p>
         </div>
         <button onClick={handleSaveAll} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shrink-0 text-sm">
            <Save size={16} /> Simpan Perubahan Direktori
          </button>
      </div>

    </div>
  );
}