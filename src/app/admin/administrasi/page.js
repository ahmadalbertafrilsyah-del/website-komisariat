"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { Save, Plus, Trash2, Info, Hash, Mail, FileSpreadsheet, UploadCloud, Briefcase, Scale, FileCheck, Image as ImageIcon, FileText, Loader2 } from "lucide-react";

export default function AdminAdministrasiEditor() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("persuratan");

  // State untuk 4 Kategori Database
  const [suratData, setSuratData] = useState([]);
  const [prokerData, setProkerData] = useState([]);
  const [hukumData, setHukumData] = useState([]);
  const [lpjData, setLpjData] = useState([]);

  // State untuk Upload Cloudinary
  const [uploadingField, setUploadingField] = useState(null);
  const [urls, setUrls] = useState({
    suratFile: "",
    prokerFile: "",
    hukumThumb: "",
    hukumFile: "",
    lpjThumb: "",
    lpjFile: ""
  });

  const fileInputSuratRef = useRef(null);
  const fileInputProkerRef = useRef(null);

  // Load Data dari Firebase
  useEffect(() => {
    async function loadSemuaData() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSuratData(data.listDokumen || []);
          setProkerData(data.listProker || []);
          setHukumData(data.listProdukHukum || []);
          setLpjData(data.listLpj || []);
        }
      } catch (error) {
        console.error("Gagal mengambil data administrasi:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSemuaData();
  }, []);

  // ================= 1. FUNGSI UPLOAD FILE KE CLOUDINARY =================
  const handleFileUpload = async (e, fieldKey) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fieldKey.includes("Thumb") && !file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar (JPG/PNG) untuk Cover/Thumbnail!");
      e.target.value = null;
      return;
    }

    setUploadingField(fieldKey);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();
      setUrls(prev => ({ ...prev, [fieldKey]: data.url }));
      alert("Berkas berhasil diunggah ke Cloudinary!");
    } catch (error) {
      console.error(error);
      alert("Gagal mengunggah file. Pastikan API & Kredensial Cloudinary sudah benar.");
    } finally {
      setUploadingField(null);
      e.target.value = null;
    }
  };

  // ================= 2. FUNGSI HAPUS (AUTO-SAVE) =================
  const handleDelete = async (type, id) => {
    if (!confirm("Hapus berkas ini dari sistem arsip secara permanen?")) return;
    
    const docRef = doc(db, "website_config", "database_administrasi");
    try {
      if (type === "surat") {
        const updated = suratData.filter(item => item.id !== id);
        setSuratData(updated);
        await setDoc(docRef, { listDokumen: updated }, { merge: true });
      } else if (type === "proker") {
        const updated = prokerData.filter(item => item.id !== id);
        setProkerData(updated);
        await setDoc(docRef, { listProker: updated }, { merge: true });
      } else if (type === "hukum") {
        const updated = hukumData.filter(item => item.id !== id);
        setHukumData(updated);
        await setDoc(docRef, { listProdukHukum: updated }, { merge: true });
      } else if (type === "lpj") {
        const updated = lpjData.filter(item => item.id !== id);
        setLpjData(updated);
        await setDoc(docRef, { listLpj: updated }, { merge: true });
      }
    } catch (error) {
      alert("Gagal menghapus data: " + error.message);
    }
  };

  // ================= 3. FUNGSI UPDATE INLINE TEXT =================
  const handleUpdate = (type, id, field, value) => {
    if (type === "surat") setSuratData(suratData.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (type === "proker") setProkerData(prokerData.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (type === "hukum") setHukumData(hukumData.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (type === "lpj") setLpjData(lpjData.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // ================= 4. FUNGSI SIMPAN GLOBAL (Untuk Perubahan Inline Tabel) =================
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    try {
      await setDoc(doc(db, "website_config", "database_administrasi"), {
        listDokumen: suratData,
        listProker: prokerData,
        listProdukHukum: hukumData,
        listLpj: lpjData
      });
      alert("Seluruh Perubahan di Tabel Berhasil Disimpan secara Permanen!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  // ================= 5. FUNGSI TAMBAH (AUTO-SAVE) =================
  const handleAddSurat = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!fd.get("nomorSurat") || !fd.get("perihalSurat")) return;
    
    // Perbaikan: Tambah ke urutan paling bawah [...prev, newItem]
    const newItem = { id: Date.now(), nomorSurat: fd.get("nomorSurat"), perihalSurat: fd.get("perihalSurat"), deskripsiSurat: fd.get("deskripsiSurat"), linkFile: urls.suratFile };
    const updated = [...suratData, newItem]; 
    setSuratData(updated);
    e.target.reset();
    setUrls(prev => ({ ...prev, suratFile: "" }));

    // Simpan Otomatis ke Database
    try {
      await setDoc(doc(db, "website_config", "database_administrasi"), { listDokumen: updated }, { merge: true });
    } catch (err) { console.error("Auto-save failed", err); }
  };

  const handleAddProker = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newItem = {
      id: Date.now(),
      pelaksanaProker: fd.get("pelaksana"), namaProker: fd.get("namaProker"), tujuan: fd.get("tujuan"),
      indikator: fd.get("indikator"), sasaran: fd.get("sasaran"), waktuPelaksanaan: fd.get("waktu"),
      penanggungJawab: fd.get("pj"), estimasiDana: fd.get("dana"), linkFile: urls.prokerFile
    };
    const updated = [...prokerData, newItem];
    setProkerData(updated);
    e.target.reset();
    setUrls(prev => ({ ...prev, prokerFile: "" }));

    try {
      await setDoc(doc(db, "website_config", "database_administrasi"), { listProker: updated }, { merge: true });
    } catch (err) { console.error("Auto-save failed", err); }
  };

  const handleAddHukum = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newItem = { id: Date.now(), nomorSK: fd.get("nomorSK"), tentangHukum: fd.get("tentang"), deskripsiHukum: fd.get("deskripsi"), linkFile: urls.hukumFile, thumbnailUrl: urls.hukumThumb };
    const updated = [...hukumData, newItem];
    setHukumData(updated);
    e.target.reset();
    setUrls(prev => ({ ...prev, hukumFile: "", hukumThumb: "" }));

    try {
      await setDoc(doc(db, "website_config", "database_administrasi"), { listProdukHukum: updated }, { merge: true });
    } catch (err) { console.error("Auto-save failed", err); }
  };

  const handleAddLpj = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newItem = { id: Date.now(), namaLaporan: fd.get("namaLaporan"), periode: fd.get("periode"), deskripsiLaporan: fd.get("deskripsi"), linkFile: urls.lpjFile, thumbnailUrl: urls.lpjThumb };
    const updated = [...lpjData, newItem];
    setLpjData(updated);
    e.target.reset();
    setUrls(prev => ({ ...prev, lpjFile: "", lpjThumb: "" }));

    try {
      await setDoc(doc(db, "website_config", "database_administrasi"), { listLpj: updated }, { merge: true });
    } catch (err) { console.error("Auto-save failed", err); }
  };

  // ================= 6. FUNGSI IMPORT EXCEL (AUTO-SAVE) =================
  const handleExcelSurat = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = XLSX.utils.sheet_to_json(XLSX.read(evt.target.result, { type: "binary" }).Sheets[XLSX.read(evt.target.result, { type: "binary" }).SheetNames[0]]);
        const validData = data.map(row => ({
          id: Date.now() + Math.random(),
          nomorSurat: String(row["Nomor Surat"] || row["Nomor"] || ""),
          perihalSurat: String(row["Perihal Surat"] || row["Perihal"] || ""),
          deskripsiSurat: String(row["Deskripsi Surat"] || row["Deskripsi"] || ""),
          linkFile: String(row["Link File"] || row["Link"] || "")
        })).filter(i => i.nomorSurat || i.perihalSurat);
        
        setSuratData(prev => {
          const updated = [...prev, ...validData];
          setDoc(doc(db, "website_config", "database_administrasi"), { listDokumen: updated }, { merge: true });
          return updated;
        });
        alert(`Berhasil mengimpor ${validData.length} data Surat!`);
      } catch (error) { alert("Format kolom excel salah."); }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleExcelProker = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = XLSX.utils.sheet_to_json(XLSX.read(evt.target.result, { type: "binary" }).Sheets[XLSX.read(evt.target.result, { type: "binary" }).SheetNames[0]]);
        const validData = data.map(row => ({
          id: Date.now() + Math.random(),
          pelaksanaProker: String(row["Pelaksana"] || row["Divisi"] || ""),
          namaProker: String(row["Nama Kegiatan"] || row["Nama Proker"] || ""),
          tujuan: String(row["Tujuan"] || ""),
          indikator: String(row["Indikator"] || ""),
          sasaran: String(row["Sasaran"] || ""),
          waktuPelaksanaan: String(row["Waktu Pelaksanaan"] || row["Waktu"] || ""),
          penanggungJawab: String(row["Penanggung Jawab"] || row["PJ"] || ""),
          estimasiDana: String(row["Estimasi Dana"] || row["Dana"] || ""),
          linkFile: String(row["Link File"] || "")
        })).filter(i => i.namaProker);
        
        setProkerData(prev => {
           const updated = [...prev, ...validData];
           setDoc(doc(db, "website_config", "database_administrasi"), { listProker: updated }, { merge: true });
           return updated;
        });
        alert(`Berhasil mengimpor ${validData.length} data Proker!`);
      } catch (error) { alert("Format kolom excel salah."); }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat database administrasi...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      
      {/* Header Administrasi */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail size={24} className="text-blue-600" /> Pusat Kelola Administrasi
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola arsip surat, program kerja divisi, produk hukum, dan laporan.</p>
        </div>
      </div>

      {/* Navigasi Sub-Tab Admin */}
      <div className="bg-slate-900 p-2 rounded-2xl flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
        <button onClick={() => setActiveTab("persuratan")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "persuratan" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}><Mail size={16} /> Arsip Surat</button>
        <button onClick={() => setActiveTab("proker")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "proker" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}><Briefcase size={16} /> Program Kerja</button>
        <button onClick={() => setActiveTab("hukum")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "hukum" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}><Scale size={16} /> Produk Hukum</button>
        <button onClick={() => setActiveTab("lpj")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "lpj" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}><FileCheck size={16} /> Laporan</button>
      </div>

      <div className="space-y-6">

        {/* ======================= TAB 1: PERSURATAN ======================= */}
        {activeTab === "persuratan" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm md:col-span-2">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Plus size={16} className="text-blue-600" /> Input Surat Manual</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <form onSubmit={handleAddSurat} className="contents">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nomor Surat</label><input type="text" name="nomorSurat" required className="w-full p-2 border rounded-xl text-sm font-mono" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Perihal Surat</label><input type="text" name="perihalSurat" required className="w-full p-2 border rounded-xl text-sm" /></div>
                    <div className="sm:col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi</label><input type="text" name="deskripsiSurat" className="w-full p-2 border rounded-xl text-sm" /></div>
                    
                    {/* UPLOAD SURAT PDF CLOUDINARY */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><UploadCloud size={12}/> File Dokumen Surat (PDF/Word)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'suratFile' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-sm'}`}>
                          {uploadingField === 'suratFile' ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Pilih Berkas</>}
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'suratFile')} disabled={uploadingField !== null} />
                        </label>
                        <input type="text" readOnly value={urls.suratFile} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 text-slate-500 font-mono" placeholder="URL otomatis terisi setelah upload..." />
                      </div>
                    </div>

                    <button type="submit" className="sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm mt-2 transition shadow-md">Tambah ke Tabel Arsip Surat</button>
                  </form>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col justify-center text-center relative overflow-hidden">
                <FileSpreadsheet className="text-blue-500 mx-auto mb-2" size={32}/>
                <h3 className="font-bold text-blue-800 text-sm mb-1">Import Data Excel</h3>
                <p className="text-[10px] text-blue-600 mb-4">Kolom: Nomor Surat, Perihal, Deskripsi, Link</p>
                <button type="button" onClick={() => fileInputSuratRef.current.click()} className="bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md">Pilih File Excel</button>
                <input type="file" accept=".xlsx, .xls" ref={fileInputSuratRef} onChange={handleExcelSurat} className="hidden" />
              </div>
            </div>

            {/* Tabel Surat */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap min-w-[900px]">
                <thead className="bg-[#1e293b] text-white text-xs uppercase tracking-wider">
                  <tr><th className="py-3 px-4 w-12 text-center">No</th><th className="py-3 px-4 w-1/4">Nomor Surat</th><th className="py-3 px-4 w-1/4">Perihal</th><th className="py-3 px-4">Deskripsi</th><th className="py-3 px-4 w-48">Link Cloudinary/Drive</th><th className="py-3 px-4 w-16 text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {suratData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-4 text-center text-slate-400 font-bold">{index+1}</td>
                      <td className="py-2 px-4"><input type="text" value={item.nomorSurat} onChange={e => handleUpdate('surat', item.id, 'nomorSurat', e.target.value)} className="w-full bg-transparent outline-none font-mono text-xs font-bold text-blue-600" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.perihalSurat} onChange={e => handleUpdate('surat', item.id, 'perihalSurat', e.target.value)} className="w-full bg-transparent outline-none font-bold" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.deskripsiSurat || ""} onChange={e => handleUpdate('surat', item.id, 'deskripsiSurat', e.target.value)} className="w-full bg-transparent outline-none text-xs text-slate-500" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.linkFile || ""} onChange={e => handleUpdate('surat', item.id, 'linkFile', e.target.value)} className="w-full bg-transparent outline-none text-[10px] text-emerald-600 font-mono" /></td>
                      <td className="py-2 px-4 text-center"><button type="button" onClick={() => handleDelete('surat', item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: PROGRAM KERJA ======================= */}
        {activeTab === "proker" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm lg:col-span-2">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Plus size={16} className="text-emerald-600" /> Input Proker Manual</h2>
                <form onSubmit={handleAddProker} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Pelaksana/Biro</label><input type="text" name="pelaksana" required className="w-full p-2 border rounded-lg text-xs" placeholder="Biro Kaderisasi"/></div>
                  <div className="sm:col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Nama Kegiatan</label><input type="text" name="namaProker" required className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tujuan</label><input type="text" name="tujuan" className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Indikator</label><input type="text" name="indikator" className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Sasaran</label><input type="text" name="sasaran" className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Waktu</label><input type="text" name="waktu" className="w-full p-2 border rounded-lg text-xs" placeholder="Misal: Juni 2026"/></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Penanggung Jawab</label><input type="text" name="pj" className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Estimasi Dana</label><input type="text" name="dana" className="w-full p-2 border rounded-lg text-xs font-mono" placeholder="Rp 0"/></div>
                  
                  {/* UPLOAD PROKER CLOUDINARY */}
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><UploadCloud size={12}/> File Pendukung (Proposal / LPJ)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition border shrink-0 ${uploadingField === 'prokerFile' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-sm'}`}>
                        {uploadingField === 'prokerFile' ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Pilih File</>}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'prokerFile')} disabled={uploadingField !== null} />
                      </label>
                      <input type="text" readOnly value={urls.prokerFile} className="w-full p-2 border rounded-lg text-xs bg-slate-50 text-slate-500 font-mono" placeholder="URL otomatis terisi..." />
                    </div>
                  </div>

                  <button type="submit" className="col-span-2 sm:col-span-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm mt-2 transition shadow-md">Tambah ke Tabel Proker</button>
                </form>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col justify-center text-center">
                <FileSpreadsheet className="text-emerald-500 mx-auto mb-2" size={32}/>
                <h3 className="font-bold text-emerald-800 text-sm mb-1">Import Data Excel</h3>
                <p className="text-[10px] text-emerald-600 mb-4">Kolom: Pelaksana, Nama Kegiatan, Tujuan, Indikator, Sasaran, Waktu, Penanggung Jawab, Estimasi Dana, Link</p>
                <button type="button" onClick={() => fileInputProkerRef.current.click()} className="bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md">Pilih File Excel</button>
                <input type="file" accept=".xlsx, .xls" ref={fileInputProkerRef} onChange={handleExcelProker} className="hidden" />
              </div>
            </div>

            {/* Tabel Proker Terintegrasi */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap min-w-[1300px]">
                <thead className="bg-emerald-900 text-white text-xs uppercase tracking-wider">
                  <tr><th className="py-3 px-3 w-12 text-center">No</th><th className="py-3 px-3 w-40">Biro/Pelaksana</th><th className="py-3 px-3 w-48">Kegiatan</th><th className="py-3 px-3">Tujuan</th><th className="py-3 px-3">Indikator</th><th className="py-3 px-3 w-32">Sasaran</th><th className="py-3 px-3 w-32">Waktu</th><th className="py-3 px-3 w-32">PJ</th><th className="py-3 px-3 w-32">Dana</th><th className="py-3 px-3 w-32">Link Cloudinary</th><th className="py-3 px-3 w-12 text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {prokerData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-emerald-50/40">
                      <td className="py-1 px-3 text-center text-slate-400 font-bold">{index+1}</td>
                      <td className="py-1 px-3"><input type="text" value={item.pelaksanaProker} onChange={e => handleUpdate('proker', item.id, 'pelaksanaProker', e.target.value)} className="w-full bg-transparent outline-none font-bold text-emerald-700 text-xs uppercase" /></td>
                      <td className="py-1 px-3"><input type="text" value={item.namaProker} onChange={e => handleUpdate('proker', item.id, 'namaProker', e.target.value)} className="w-full bg-transparent outline-none font-bold text-xs" /></td>
                      <td className="py-1 px-3"><input type="text" value={item.tujuan || ""} onChange={e => handleUpdate('proker', item.id, 'tujuan', e.target.value)} className="w-full bg-transparent outline-none text-[11px]" /></td>
                      <td className="py-1 px-3"><input type="text" value={item.indikator || ""} onChange={e => handleUpdate('proker', item.id, 'indikator', e.target.value)} className="w-full bg-transparent outline-none text-[11px]" /></td>
                      <td className="py-1 px-3"><input type="text" value={item.sasaran || ""} onChange={e => handleUpdate('proker', item.id, 'sasaran', e.target.value)} className="w-full bg-transparent outline-none text-[11px]" /></td>
                      <td className="py-1 px-3"><input type="text" value={item.waktuPelaksanaan || ""} onChange={e => handleUpdate('proker', item.id, 'waktuPelaksanaan', e.target.value)} className="w-full bg-transparent outline-none text-[11px]" /></td>
                      <td className="py-1 px-3"><input type="text" value={item.penanggungJawab || ""} onChange={e => handleUpdate('proker', item.id, 'penanggungJawab', e.target.value)} className="w-full bg-transparent outline-none text-[11px] text-emerald-600" /></td>
                      <td className="py-1 px-3"><input type="text" value={item.estimasiDana || ""} onChange={e => handleUpdate('proker', item.id, 'estimasiDana', e.target.value)} className="w-full bg-transparent outline-none font-mono text-[11px]" /></td>
                      <td className="py-1 px-3"><input type="text" value={item.linkFile || ""} onChange={e => handleUpdate('proker', item.id, 'linkFile', e.target.value)} className="w-full bg-transparent outline-none text-[10px] text-blue-500 font-mono" /></td>
                      <td className="py-1 px-3 text-center"><button type="button" onClick={() => handleDelete('proker', item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: PRODUK HUKUM ======================= */}
        {activeTab === "hukum" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Plus size={16} className="text-purple-600" /> Input Produk Hukum / SK Baru</h2>
              <form onSubmit={handleAddHukum} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nomor SK / Ketetapan</label><input type="text" name="nomorSK" required className="w-full p-2.5 border rounded-xl text-sm font-mono" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tentang / Regulasi</label><input type="text" name="tentang" required className="w-full p-2.5 border rounded-xl text-sm" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Keterangan Singkat</label><input type="text" name="deskripsi" className="w-full p-2.5 border rounded-xl text-sm" /></div>
                
                {/* UPLOAD THUMBNAIL CLOUDINARY */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><ImageIcon size={12}/> Gambar Cover Dokumen (Opsional)</label>
                  <div className="flex flex-col xl:flex-row items-center gap-2">
                    <label className={`w-full xl:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'hukumThumb' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 shadow-sm'}`}>
                      {uploadingField === 'hukumThumb' ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'hukumThumb')} disabled={uploadingField !== null} />
                    </label>
                    <input type="text" readOnly value={urls.hukumThumb} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 text-slate-500 font-mono" placeholder="URL otomatis..." />
                  </div>
                </div>

                {/* UPLOAD PDF CLOUDINARY */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><FileText size={12}/> File Dokumen SK / Ketetapan (PDF)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'hukumFile' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 shadow-sm'}`}>
                      {uploadingField === 'hukumFile' ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Pilih File PDF</>}
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'hukumFile')} disabled={uploadingField !== null} />
                    </label>
                    <input type="text" readOnly value={urls.hukumFile} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 text-slate-500 font-mono" placeholder="URL File otomatis terisi..." />
                  </div>
                </div>

                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-sm w-full md:col-span-3 transition shadow-md">Simpan Produk Hukum Baru</button>
              </form>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
                <thead className="bg-[#2e1065] text-white text-xs uppercase tracking-wider">
                  <tr><th className="py-3 px-4 w-12 text-center">No</th><th className="py-3 px-4 w-1/4">Nomor SK</th><th className="py-3 px-4 w-1/4">Tentang</th><th className="py-3 px-4">Deskripsi</th><th className="py-3 px-4 w-32">Cover URL</th><th className="py-3 px-4 w-40">Link PDF Cloudinary</th><th className="py-3 px-4 w-16 text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {hukumData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-purple-50/30">
                      <td className="py-2 px-4 text-center text-slate-400 font-bold">{index+1}</td>
                      <td className="py-2 px-4"><input type="text" value={item.nomorSK} onChange={e => handleUpdate('hukum', item.id, 'nomorSK', e.target.value)} className="w-full bg-transparent outline-none font-mono text-xs font-bold text-purple-700" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.tentangHukum} onChange={e => handleUpdate('hukum', item.id, 'tentangHukum', e.target.value)} className="w-full bg-transparent outline-none font-bold text-xs" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.deskripsiHukum || ""} onChange={e => handleUpdate('hukum', item.id, 'deskripsiHukum', e.target.value)} className="w-full bg-transparent outline-none text-xs text-slate-500" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.thumbnailUrl || ""} onChange={e => handleUpdate('hukum', item.id, 'thumbnailUrl', e.target.value)} className="w-full bg-transparent outline-none text-[10px] text-blue-500 font-mono" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.linkFile || ""} onChange={e => handleUpdate('hukum', item.id, 'linkFile', e.target.value)} className="w-full bg-transparent outline-none text-[10px] text-blue-500 font-mono" /></td>
                      <td className="py-2 px-4 text-center"><button type="button" onClick={() => handleDelete('hukum', item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= TAB 4: LAPORAN KEPENGURUSAN ======================= */}
        {activeTab === "lpj" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Plus size={16} className="text-amber-600" /> Input Laporan / LPJ Baru</h2>
              <form onSubmit={handleAddLpj} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nama Laporan</label><input type="text" name="namaLaporan" required className="w-full p-2.5 border rounded-xl text-sm font-bold" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Periode Kepengurusan</label><input type="text" name="periode" required className="w-full p-2.5 border rounded-xl text-sm" placeholder="2026-2027"/></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Keterangan Singkat</label><input type="text" name="deskripsi" className="w-full p-2.5 border rounded-xl text-sm" /></div>
                
                {/* UPLOAD THUMBNAIL CLOUDINARY */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><ImageIcon size={12}/> Gambar Cover Dokumen (Opsional)</label>
                  <div className="flex flex-col xl:flex-row items-center gap-2">
                    <label className={`w-full xl:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'lpjThumb' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-sm'}`}>
                      {uploadingField === 'lpjThumb' ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'lpjThumb')} disabled={uploadingField !== null} />
                    </label>
                    <input type="text" readOnly value={urls.lpjThumb} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 text-slate-500 font-mono" placeholder="URL otomatis..." />
                  </div>
                </div>

                {/* UPLOAD PDF CLOUDINARY */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><FileText size={12}/> File Dokumen Laporan (PDF)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'lpjFile' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-sm'}`}>
                      {uploadingField === 'lpjFile' ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Pilih File PDF</>}
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'lpjFile')} disabled={uploadingField !== null} />
                    </label>
                    <input type="text" readOnly value={urls.lpjFile} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 text-slate-500 font-mono" placeholder="URL File otomatis terisi..." />
                  </div>
                </div>

                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm w-full md:col-span-3 transition shadow-md">Simpan Laporan Baru</button>
              </form>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
                <thead className="bg-[#78350f] text-white text-xs uppercase tracking-wider">
                  <tr><th className="py-3 px-4 w-12 text-center">No</th><th className="py-3 px-4 w-1/4">Nama Laporan</th><th className="py-3 px-4 w-1/6">Periode</th><th className="py-3 px-4">Deskripsi</th><th className="py-3 px-4 w-32">Cover URL</th><th className="py-3 px-4 w-40">Link PDF Cloudinary</th><th className="py-3 px-4 w-16 text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {lpjData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-amber-50/30">
                      <td className="py-2 px-4 text-center text-slate-400 font-bold">{index+1}</td>
                      <td className="py-2 px-4"><input type="text" value={item.namaLaporan} onChange={e => handleUpdate('lpj', item.id, 'namaLaporan', e.target.value)} className="w-full bg-transparent outline-none font-bold text-xs" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.periode} onChange={e => handleUpdate('lpj', item.id, 'periode', e.target.value)} className="w-full bg-transparent outline-none font-mono font-bold text-amber-700 text-xs" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.deskripsiLaporan || ""} onChange={e => handleUpdate('lpj', item.id, 'deskripsiLaporan', e.target.value)} className="w-full bg-transparent outline-none text-xs text-slate-500" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.thumbnailUrl || ""} onChange={e => handleUpdate('lpj', item.id, 'thumbnailUrl', e.target.value)} className="w-full bg-transparent outline-none text-[10px] text-blue-500 font-mono" /></td>
                      <td className="py-2 px-4"><input type="text" value={item.linkFile || ""} onChange={e => handleUpdate('lpj', item.id, 'linkFile', e.target.value)} className="w-full bg-transparent outline-none text-[10px] text-blue-500 font-mono" /></td>
                      <td className="py-2 px-4 text-center"><button type="button" onClick={() => handleDelete('lpj', item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TOMBOL SIMPAN GLOBAL ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 sticky bottom-4 z-40 shadow-xl shadow-blue-500/5">
           <div className="flex items-center gap-2 text-xs text-blue-700">
             <Info size={16} className="shrink-0 text-blue-600" />
             <p>Pastikan Anda mengklik tombol "Simpan Sistem Arsip" di sebelah kanan setiap kali selesai menambah/mengedit data dari kategori manapun.</p>
           </div>
           
           <button type="button" onClick={handleSaveAll} disabled={uploadingField !== null} className="w-full sm:w-auto bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md text-sm shrink-0">
              Simpan Sistem Arsip <Save size={16} />
            </button>
        </div>

      </div>
    </div>
  );
}