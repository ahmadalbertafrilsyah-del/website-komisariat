"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Plus, Trash2, GraduationCap, Search, Image as ImageIcon, UploadCloud, FileSpreadsheet, Download, Loader2, Info, Star, Briefcase } from "lucide-react";
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
    <div className="w-full flex flex-col gap-1 mt-1">
      <div className="flex flex-wrap gap-1">
        {dataArray.map((p, idx) => (
          <span key={idx} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${bg}`}>
            {p}
            <button type="button" onClick={() => removeTag(idx)} className={`font-bold ml-1 outline-none transition-colors ${btn}`}>&times;</button>
          </span>
        ))}
      </div>
      <input
        type="text" onKeyDown={handleKeyDown} placeholder={dataArray.length === 0 ? "+ Ketik (lalu Enter)" : placeholderText}
        className={`w-full font-semibold bg-transparent border-b border-slate-200 text-xs outline-none transition pb-0.5 ${text}`}
      />
    </div>
  );
};

export default function AdminAlumni() {
  const [loading, setLoading] = useState(true);
  const [alumniData, setAlumniData] = useState([]);
  
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
        setAlumniData(updatedAlumni); alert(`Berhasil mengimpor ${importedCount} data alumni dari Excel! Klik 'Simpan Perubahan' untuk mengunci data.`);
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

  const handleDelete = (id) => { if (confirm("Hapus alumni ini?")) setAlumniData(alumniData.filter(item => item.id !== id)); };
  const handleInputChange = (id, field, value) => { setAlumniData(alumniData.map(item => item.id === id ? { ...item, [field]: value } : item)); };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    try { await setDoc(doc(db, "website_config", "database_alumni"), { listAlumni: alumniData }); alert("Data Alumni berhasil diperbarui di server!"); } 
    catch (error) { alert("Gagal menyimpan: " + error.message); }
  };

  const filteredData = alumniData.filter(a => {
    const searchLower = searchQuery.toLowerCase();
    const profesiString = Array.isArray(a.profesi) ? a.profesi.join(" ") : (a.profesi || "");
    const bidangString = Array.isArray(a.bidang) ? a.bidang.join(" ") : (a.bidang || "");
    const deskripsiString = typeof a.deskripsiProfesi === 'object' && a.deskripsiProfesi !== null ? Object.values(a.deskripsiProfesi).join(" ") : (typeof a.deskripsiProfesi === 'string' ? a.deskripsiProfesi : "");

    return ((a.nama || "").toLowerCase().includes(searchLower) || profesiString.toLowerCase().includes(searchLower) || bidangString.toLowerCase().includes(searchLower) || deskripsiString.toLowerCase().includes(searchLower) || (a.asalRayon || "").toLowerCase().includes(searchLower));
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-4 md:space-y-6 pb-12 max-w-7xl mx-auto px-2 md:px-4 text-sm">
      
      {/* HEADER PANEL (Dipadatkan di HP) */}
      <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2"><GraduationCap size={24} className="text-blue-600"/> Direktori Alumni</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <button onClick={handleDownloadTemplate} type="button" className="flex-1 sm:flex-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs md:text-sm font-bold px-3 py-2 rounded-lg flex justify-center items-center gap-1.5 shadow-sm">
             <Download size={16}/> Template
           </button>
           <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={excelInputRef} onChange={handleImportExcel} />
           <button onClick={() => excelInputRef.current.click()} type="button" className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs md:text-sm font-bold px-3 py-2 rounded-lg flex justify-center items-center gap-1.5">
             <FileSpreadsheet size={16}/> Import
           </button>
        </div>
      </div>

      {/* FORM TAMBAH ALUMNI (Grid dirapatkan) */}
      <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200/60 shadow-sm">
        <h2 className="text-sm md:text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2"><Plus size={16} className="text-blue-600 bg-blue-100 p-0.5 rounded-full" /> Tambah Data Alumni</h2>
        
        {/* GRID UTAMA - Sangat dioptimalkan agar elemen sejajar di HP */}
        <form onSubmit={handleAdd} className="grid grid-cols-12 gap-2.5 md:gap-4 items-start">
          
          <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Nama Lengkap</label>
            <input type="text" required value={newNama} onChange={e => setNewNama(e.target.value)} className="w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none focus:ring-1 focus:ring-blue-500" placeholder="Nama & Gelar"/>
          </div>
          
          {/* Di HP Mapaba & Rayon bersebelahan */}
          <div className="col-span-4 md:col-span-2 space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Mapaba</label>
            <input type="text" value={newTahun} onChange={e => setNewTahun(e.target.value)} className="w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none focus:ring-1 focus:ring-blue-500" placeholder="2015"/>
          </div>

          <div className="col-span-8 md:col-span-3 space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Asal Rayon</label>
            <select value={newRayon} onChange={e => setNewRayon(e.target.value)} className="w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-xs md:text-sm">
              <option value="">Pilih Rayon</option>
              {RAYON_OPTIONS.map(rayon => <option key={rayon} value={rayon}>{rayon}</option>)}
            </select>
          </div>

          <div className="col-span-12 md:col-span-3 space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase">URL Foto / Upload</label>
            <div className="flex gap-1.5">
               <input type="text" value={newFoto} onChange={e => setNewFoto(e.target.value)} className="w-full flex-1 p-2 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-xs" placeholder="URL..."/>
               <label className="bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer px-2.5 border border-slate-200 rounded-lg flex items-center justify-center">
                  {uploadingImage ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14}/>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadCloudinary(e.target.files[0])} disabled={uploadingImage}/>
               </label>
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 space-y-1">
            <label className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1"><GraduationCap size={10}/> Profesi (Enter)</label>
            <div className="w-full min-h-[36px] p-1.5 border border-slate-200 bg-slate-50 focus-within:bg-white rounded-lg flex flex-wrap gap-1 items-center">
               {newProfesi.map((p, i) => (
                 <span key={i} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded flex items-center gap-1 border border-blue-200">
                    {p} <button type="button" onClick={() => setNewProfesi(newProfesi.filter((_, idx) => idx !== i))} className="hover:text-red-500">&times;</button>
                 </span>
               ))}
               <input type="text" value={inputProfesi} onChange={(e) => setInputProfesi(e.target.value)} className="bg-transparent border-none outline-none text-xs flex-1 min-w-[80px] px-1" placeholder={newProfesi.length === 0 ? "Ketik lalu Enter..." : "Tambah profesi..."}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const val = inputProfesi.trim(); if (val && !newProfesi.includes(val)) { setNewProfesi([...newProfesi, val]); setInputProfesi(''); } } 
                   else if (e.key === 'Backspace' && inputProfesi === '' && newProfesi.length > 0) setNewProfesi(newProfesi.slice(0, -1));
                 }}
               />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 space-y-1">
             <label className="text-[9px] font-bold text-violet-600 uppercase flex items-center gap-1"><Star size={10}/> Keahlian (Enter)</label>
             <div className="w-full min-h-[36px] p-1.5 border border-slate-200 bg-slate-50 focus-within:bg-white rounded-lg flex flex-wrap gap-1 items-center">
               {newBidang.map((p, i) => (
                 <span key={i} className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded flex items-center gap-1 border border-violet-200">
                    {p} <button type="button" onClick={() => setNewBidang(newBidang.filter((_, idx) => idx !== i))} className="hover:text-red-500">&times;</button>
                 </span>
               ))}
               <input type="text" value={inputBidang} onChange={(e) => setInputBidang(e.target.value)} className="bg-transparent border-none outline-none text-xs flex-1 min-w-[80px] px-1" placeholder={newBidang.length === 0 ? "Web Developer..." : "Tambah keahlian..."}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const val = inputBidang.trim(); if (val && !newBidang.includes(val)) { setNewBidang([...newBidang, val]); setInputBidang(''); } } 
                   else if (e.key === 'Backspace' && inputBidang === '' && newBidang.length > 0) setNewBidang(newBidang.slice(0, -1));
                 }}
               />
             </div>
          </div>

          {newProfesi.length > 0 && (
            <div className="col-span-12 space-y-1.5">
              <label className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1"><Info size={10}/> Deskripsi Profesi</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 {newProfesi.map((p, idx) => (
                   <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] font-extrabold text-slate-600 flex items-center gap-1"><Briefcase size={10} className="text-blue-500"/> {p}</span>
                      <input type="text" value={newDeskripsiProfesi[p] || ""} onChange={e => setNewDeskripsiProfesi({...newDeskripsiProfesi, [p]: e.target.value})} className="w-full bg-transparent border-b border-slate-300 text-xs outline-none focus:border-blue-500 py-0.5 mt-1" placeholder={`Instansi ${p}...`}/>
                   </div>
                 ))}
              </div>
            </div>
          )}

          <div className="col-span-12 mt-2">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm">Simpan Alumni Baru</button>
          </div>
        </form>
      </div>

      {/* DAFTAR KARTU ALUMNI (EDIT) */}
      <form onSubmit={handleSaveAll} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-200 p-3 md:p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
           <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <input type="text" placeholder="Cari data..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"/>
           </div>
           {alumniData.length > 0 && (
             <button type="submit" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2">
               <Save size={16}/> Simpan Perubahan
             </button>
           )}
        </div>
        
        {/* GRID KARTU EDIT (Dipaksa Layout Flex Row agar irit tempat vertikal) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {filteredData.map(a => (
            <div key={a.id} className="border border-slate-200 p-3 rounded-xl flex flex-row items-start gap-3 bg-white relative group">
               
               {/* FOTO (Dikecilkan di HP) */}
               <label className="shrink-0 cursor-pointer w-14 h-14 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative">
                 {a.foto ? <img src={a.foto} alt="profil" className="w-full h-full object-cover"/> : <ImageIcon size={20} className="text-slate-300"/>}
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <UploadCloud size={16} className="text-white"/>
                 </div>
                 <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadCloudinary(e.target.files[0], a.id)}/>
               </label>

               <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <input type="text" value={a.nama} onChange={e => handleInputChange(a.id, "nama", e.target.value)} className="w-full font-bold text-slate-800 bg-transparent border-b border-slate-200 text-sm md:text-base outline-none focus:border-blue-500 truncate" placeholder="Nama Lengkap"/>
                    <button type="button" onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-red-500 bg-slate-50 p-1.5 rounded-md"><Trash2 size={14}/></button>
                  </div>
                  
                  {/* EDIT PROFESI */}
                  <div className="bg-slate-50/50 p-1.5 md:p-2 rounded-lg border border-slate-100">
                     <span className="text-[8px] font-bold text-blue-500 uppercase"><GraduationCap size={8} className="inline mr-1"/>Profesi</span>
                     <EditTags profesiData={a.profesi} data={a.profesi} onChange={(newArr) => handleInputChange(a.id, "profesi", newArr)} placeholderText="+ Profesi..." theme="blue" />
                     {a.profesi && a.profesi.length > 0 && (
                        <div className="mt-1 space-y-1 pt-1 border-t border-slate-200/50">
                          {a.profesi.map((p, pIdx) => (
                             <div key={pIdx} className="flex items-center gap-1.5">
                               <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1 py-0.5 rounded max-w-[60px] truncate">{p}</span>
                               <input type="text" value={ (typeof a.deskripsiProfesi === 'object' && a.deskripsiProfesi !== null) ? (a.deskripsiProfesi[p] || "") : ""} onChange={(e) => { const updatedDesk = typeof a.deskripsiProfesi === 'object' && a.deskripsiProfesi !== null ? { ...a.deskripsiProfesi } : {}; updatedDesk[p] = e.target.value; handleInputChange(a.id, "deskripsiProfesi", updatedDesk); }} className="flex-1 bg-transparent border-b border-slate-200 text-[10px] md:text-xs outline-none focus:border-blue-500 pb-0.5 text-slate-600" placeholder={`Deskripsi ${p}...`}/>
                             </div>
                          ))}
                        </div>
                     )}
                  </div>

                  {/* EDIT BIDANG KEAHLIAN */}
                  <div className="bg-slate-50/50 p-1.5 md:p-2 rounded-lg border border-slate-100">
                     <span className="text-[8px] font-bold text-violet-500 uppercase"><Star size={8} className="inline mr-1"/>Keahlian</span>
                     <EditTags data={a.bidang} onChange={(newArr) => handleInputChange(a.id, "bidang", newArr)} placeholderText="+ Keahlian..." theme="violet" />
                  </div>
                  
                  {/* Mapaba & Rayon di Kartu Edit */}
                  <div className="flex gap-2 pt-1">
                     <div className="w-1/3">
                        <input type="text" value={a.tahunMapaba} onChange={e => handleInputChange(a.id, "tahunMapaba", e.target.value)} className="w-full bg-transparent border-b border-slate-200 text-[10px] outline-none text-slate-600 focus:border-blue-500" placeholder="Mapaba"/>
                     </div>
                     <div className="w-2/3">
                        <select value={a.asalRayon} onChange={e => handleInputChange(a.id, "asalRayon", e.target.value)} className="w-full bg-transparent border-b border-slate-200 text-[10px] outline-none text-slate-600 focus:border-blue-500 truncate">
                           <option value="">Rayon</option>
                           {RAYON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}