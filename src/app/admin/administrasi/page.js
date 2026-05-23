"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { Save, Plus, Trash2, Info, Hash, Mail, FileSpreadsheet, UploadCloud, Briefcase, Scale, FileCheck, Image as ImageIcon, FileText, Loader2, Inbox, Send, Download, Building, Settings, X } from "lucide-react";

export default function AdminAdministrasiEditor() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("persuratan");
  const [activeSuratTab, setActiveSuratTab] = useState("masuk");

  // ================= STATE RUANG KERJA (LEMBAGA) =================
  const [activeLembaga, setActiveLembaga] = useState("Komisariat"); 
  const [listLSO, setListLSO] = useState([]); 
  const [showLSOModal, setShowLSOModal] = useState(false);
  const [newLSO, setNewLSO] = useState("");

  // ================= STATE DATABASE =================
  const [suratMasukData, setSuratMasukData] = useState([]);
  const [suratKeluarData, setSuratKeluarData] = useState([]);
  const [prokerData, setProkerData] = useState([]);
  const [hukumData, setHukumData] = useState([]);
  const [lpjData, setLpjData] = useState([]);

  // State Upload Cloudinary
  const [uploadingField, setUploadingField] = useState(null);
  const [urls, setUrls] = useState({
    suratFile: "", prokerFile: "", hukumThumb: "", hukumFile: "", lpjThumb: "", lpjFile: ""
  });

  const fileInputSuratMasukRef = useRef(null);
  const fileInputSuratKeluarRef = useRef(null);
  const fileInputProkerRef = useRef(null);

  useEffect(() => {
    async function loadSemuaData() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSuratMasukData(data.listSuratMasuk || []);
          setSuratKeluarData(data.listSuratKeluar || data.listDokumen || []);
          setProkerData(data.listProker || []);
          setHukumData(data.listProdukHukum || []);
          setLpjData(data.listLpj || []);
          setListLSO(data.listLSO || []); 
        }
      } catch (error) {
        console.error("Gagal mengambil data administrasi:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSemuaData();
  }, []);

  const filteredSuratMasuk = suratMasukData.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  const filteredSuratKeluar = suratKeluarData.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  const filteredProker = prokerData.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  const filteredHukum = hukumData.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  const filteredLpj = lpjData.filter(item => (item.lembaga || "Komisariat") === activeLembaga);

  const handleAddLSO = async () => {
    if(!newLSO.trim() || listLSO.includes(newLSO.trim())) return;
    const updated = [...listLSO, newLSO.trim()];
    setListLSO(updated); setNewLSO("");
    await setDoc(doc(db, "website_config", "database_administrasi"), { listLSO: updated }, { merge: true });
  };

  const handleDeleteLSO = async (lsoName) => {
    if(!confirm(`Hapus ruang kerja ${lsoName}? Arsip tidak hilang, hanya label lembaganya yang tersembunyi.`)) return;
    const updated = listLSO.filter(l => l !== lsoName);
    setListLSO(updated);
    if(activeLembaga === lsoName) setActiveLembaga("Komisariat");
    await setDoc(doc(db, "website_config", "database_administrasi"), { listLSO: updated }, { merge: true });
  };

  const handleFileUpload = async (e, fieldKey) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fieldKey.includes("Thumb") && !file.type.startsWith("image/")) {
      alert("Harap pilih file berupa gambar (JPG/PNG) untuk Cover/Thumbnail!");
      e.target.value = null; return;
    }

    setUploadingField(fieldKey);
    const formData = new FormData(); formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();
      setUrls(prev => ({ ...prev, [fieldKey]: data.url }));
      alert("Berkas berhasil diunggah ke server!");
    } catch (error) {
      alert("Gagal mengunggah file. Pastikan API & Kredensial sudah benar.");
    } finally {
      setUploadingField(null); e.target.value = null;
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm("Hapus berkas ini secara permanen?")) return;
    const docRef = doc(db, "website_config", "database_administrasi");
    try {
      if (type === "suratMasuk") {
        const updated = suratMasukData.filter(item => item.id !== id);
        setSuratMasukData(updated); await setDoc(docRef, { listSuratMasuk: updated }, { merge: true });
      } else if (type === "suratKeluar") {
        const updated = suratKeluarData.filter(item => item.id !== id);
        setSuratKeluarData(updated); await setDoc(docRef, { listSuratKeluar: updated }, { merge: true });
      } else if (type === "proker") {
        const updated = prokerData.filter(item => item.id !== id);
        setProkerData(updated); await setDoc(docRef, { listProker: updated }, { merge: true });
      } else if (type === "hukum") {
        const updated = hukumData.filter(item => item.id !== id);
        setHukumData(updated); await setDoc(docRef, { listProdukHukum: updated }, { merge: true });
      } else if (type === "lpj") {
        const updated = lpjData.filter(item => item.id !== id);
        setLpjData(updated); await setDoc(docRef, { listLpj: updated }, { merge: true });
      }
    } catch (error) { alert("Gagal menghapus data: " + error.message); }
  };

  const handleUpdate = (type, id, field, value) => {
    if (type === "suratMasuk") setSuratMasukData(suratMasukData.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (type === "suratKeluar") setSuratKeluarData(suratKeluarData.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (type === "proker") setProkerData(prokerData.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (type === "hukum") setHukumData(hukumData.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (type === "lpj") setLpjData(lpjData.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    try {
      await setDoc(doc(db, "website_config", "database_administrasi"), {
        listSuratMasuk: suratMasukData, listSuratKeluar: suratKeluarData,
        listProker: prokerData, listProdukHukum: hukumData, listLpj: lpjData, listLSO: listLSO
      }, { merge: true });
      alert("Seluruh Perubahan di Tabel Berhasil Disimpan secara Permanen!");
    } catch (error) { alert("Gagal menyimpan: " + error.message); }
  };

  const handleAddSuratMasuk = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const newItem = { id: Date.now(), lembaga: activeLembaga, nomorSurat: fd.get("nomorSurat"), asalSurat: fd.get("asalSurat"), tglBuat: fd.get("tglBuat"), tglDatang: fd.get("tglDatang"), hal: fd.get("hal"), ket: fd.get("ket"), linkFile: urls.suratFile };
    const updated = [...suratMasukData, newItem]; 
    setSuratMasukData(updated); e.target.reset(); setUrls(prev => ({ ...prev, suratFile: "" }));
    try { await setDoc(doc(db, "website_config", "database_administrasi"), { listSuratMasuk: updated }, { merge: true }); } catch (err) { console.error(err); }
  };

  const handleAddSuratKeluar = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const newItem = { id: Date.now(), lembaga: activeLembaga, nomorSurat: fd.get("nomorSurat"), tujuanSurat: fd.get("tujuanSurat"), tglBuat: fd.get("tglBuat"), tglKirim: fd.get("tglKirim"), hal: fd.get("hal"), ket: fd.get("ket"), linkFile: urls.suratFile };
    const updated = [...suratKeluarData, newItem]; 
    setSuratKeluarData(updated); e.target.reset(); setUrls(prev => ({ ...prev, suratFile: "" }));
    try { await setDoc(doc(db, "website_config", "database_administrasi"), { listSuratKeluar: updated }, { merge: true }); } catch (err) { console.error(err); }
  };

  const handleAddProker = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const newItem = { id: Date.now(), lembaga: activeLembaga, pelaksanaProker: fd.get("pelaksana"), namaProker: fd.get("namaProker"), tujuan: fd.get("tujuan"), indikator: fd.get("indikator"), sasaran: fd.get("sasaran"), waktuPelaksanaan: fd.get("waktu"), penanggungJawab: fd.get("pj"), estimasiDana: fd.get("dana"), linkFile: urls.prokerFile };
    const updated = [...prokerData, newItem]; setProkerData(updated); e.target.reset(); setUrls(prev => ({ ...prev, prokerFile: "" }));
    try { await setDoc(doc(db, "website_config", "database_administrasi"), { listProker: updated }, { merge: true }); } catch (err) { console.error(err); }
  };

  const handleAddHukum = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const newItem = { id: Date.now(), lembaga: activeLembaga, nomorSK: fd.get("nomorSK"), tentangHukum: fd.get("tentang"), deskripsiHukum: fd.get("deskripsi"), linkFile: urls.hukumFile, thumbnailUrl: urls.hukumThumb };
    const updated = [...hukumData, newItem]; setHukumData(updated); e.target.reset(); setUrls(prev => ({ ...prev, hukumFile: "", hukumThumb: "" }));
    try { await setDoc(doc(db, "website_config", "database_administrasi"), { listProdukHukum: updated }, { merge: true }); } catch (err) { console.error(err); }
  };

  const handleAddLpj = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const newItem = { id: Date.now(), lembaga: activeLembaga, namaLaporan: fd.get("namaLaporan"), periode: fd.get("periode"), deskripsiLaporan: fd.get("deskripsi"), linkFile: urls.lpjFile, thumbnailUrl: urls.lpjThumb };
    const updated = [...lpjData, newItem]; setLpjData(updated); e.target.reset(); setUrls(prev => ({ ...prev, lpjFile: "", lpjThumb: "" }));
    try { await setDoc(doc(db, "website_config", "database_administrasi"), { listLpj: updated }, { merge: true }); } catch (err) { console.error(err); }
  };

  const downloadTemplateSuratMasuk = () => {
    const ws = XLSX.utils.json_to_sheet([{ "No Surat": "001/Masuk/2026", "Asal Surat": "BEM", "Tgl Buat": "12/01/2026", "Tgl Datang": "14/01/2026", "Hal": "Undangan", "Ket": "Segera", "Link File": "https://..." }]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Template"); XLSX.writeFile(wb, "Template_Surat_Masuk.xlsx");
  };

  const downloadTemplateSuratKeluar = () => {
    const ws = XLSX.utils.json_to_sheet([{ "No Surat": "001/Keluar/2026", "Tujuan Surat": "Rektorat", "Tgl Buat": "10/01/2026", "Tgl Kirim": "11/01/2026", "Hal": "Peminjaman Tempat", "Ket": "ACC", "Link File": "https://..." }]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Template"); XLSX.writeFile(wb, "Template_Surat_Keluar.xlsx");
  };

  const downloadTemplateProker = () => {
    const ws = XLSX.utils.json_to_sheet([{ "Pelaksana": "Kaderisasi", "Nama Kegiatan": "Mapaba", "Tujuan": "Rekrutmen", "Indikator": "50 Peserta", "Sasaran": "Maba", "Waktu Pelaksanaan": "Agustus 2026", "Penanggung Jawab": "Ahmad", "Estimasi Dana": "Rp 5.000.000", "Link File": "https://..." }]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Template"); XLSX.writeFile(wb, "Template_Program_Kerja.xlsx");
  };

  // Helper untuk mengubah Excel Date serial number ke DD/MM/YYYY string
  const formatExcelDate = (excelDate) => {
    if (!excelDate) return "";
    
    // Jika bentuknya sudah string/teks biasa dari Excel (bukan tipe Date)
    if (typeof excelDate === 'string') return excelDate;
    
    // Jika bentuknya benar-benar object Date bawaan JS
    if (excelDate instanceof Date) {
       const day = String(excelDate.getDate()).padStart(2, '0');
       const month = String(excelDate.getMonth() + 1).padStart(2, '0');
       const year = excelDate.getFullYear();
       return `${day}/${month}/${year}`;
    }

    return String(excelDate);
  };

  // ================= 7. FUNGSI IMPORT EXCEL YANG DIPERBAIKI (TANGGAL) =================
  const handleExcelSuratMasuk = (e) => {
    const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        // PERBAIKAN: cellDates: true agar angka serial Excel otomatis dikonversi jadi Object Date
        const workbook = XLSX.read(evt.target.result, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        const validData = data.map(row => ({
          id: Date.now() + Math.random(), 
          lembaga: activeLembaga,
          nomorSurat: String(row["No Surat"] || row["Nomor Surat"] || ""), 
          asalSurat: String(row["Asal Surat"] || ""),
          // Gunakan helper formatExcelDate agar terbaca sempurna
          tglBuat: formatExcelDate(row["Tgl Buat"] || row["Tanggal Buat"]), 
          tglDatang: formatExcelDate(row["Tgl Datang"] || row["Tanggal Datang"]),
          hal: String(row["Hal"] || row["Perihal"] || ""), 
          ket: String(row["Ket"] || row["Keterangan"] || ""), 
          linkFile: String(row["Link File"] || "")
        })).filter(i => i.nomorSurat || i.hal);
        
        setSuratMasukData(prev => { const updated = [...prev, ...validData]; setDoc(doc(db, "website_config", "database_administrasi"), { listSuratMasuk: updated }, { merge: true }); return updated; });
        alert(`Berhasil mengimpor ${validData.length} data Surat Masuk ke Ruang Kerja ${activeLembaga}!`);
      } catch (error) { alert("Format excel salah."); }
    }; reader.readAsBinaryString(file); e.target.value = null;
  };

  const handleExcelSuratKeluar = (e) => {
    const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        // PERBAIKAN: cellDates: true
        const workbook = XLSX.read(evt.target.result, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const validData = data.map(row => ({
          id: Date.now() + Math.random(), 
          lembaga: activeLembaga,
          nomorSurat: String(row["No Surat"] || row["Nomor Surat"] || ""), 
          tujuanSurat: String(row["Tujuan Surat"] || ""),
          // Gunakan helper formatExcelDate
          tglBuat: formatExcelDate(row["Tgl Buat"] || row["Tanggal Buat"]), 
          tglKirim: formatExcelDate(row["Tgl Kirim"] || row["Tanggal Kirim"]),
          hal: String(row["Hal"] || row["Perihal"] || ""), 
          ket: String(row["Ket"] || row["Keterangan"] || ""), 
          linkFile: String(row["Link File"] || "")
        })).filter(i => i.nomorSurat || i.hal);
        
        setSuratKeluarData(prev => { const updated = [...prev, ...validData]; setDoc(doc(db, "website_config", "database_administrasi"), { listSuratKeluar: updated }, { merge: true }); return updated; });
        alert(`Berhasil mengimpor ${validData.length} data Surat Keluar ke Ruang Kerja ${activeLembaga}!`);
      } catch (error) { alert("Format excel salah."); }
    }; reader.readAsBinaryString(file); e.target.value = null;
  };

  const handleExcelProker = (e) => {
    const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        // PERBAIKAN: cellDates: true (Meskipun Proker biasanya format string, jaga-jaga bila ada tanggal)
        const workbook = XLSX.read(evt.target.result, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const validData = data.map(row => ({
          id: Date.now() + Math.random(), 
          lembaga: activeLembaga,
          pelaksanaProker: String(row["Pelaksana"] || ""), 
          namaProker: String(row["Nama Kegiatan"] || ""),
          tujuan: String(row["Tujuan"] || ""), 
          indikator: String(row["Indikator"] || ""), 
          sasaran: String(row["Sasaran"] || ""),
          waktuPelaksanaan: formatExcelDate(row["Waktu Pelaksanaan"] || row["Waktu"]), 
          penanggungJawab: String(row["Penanggung Jawab"] || ""),
          estimasiDana: String(row["Estimasi Dana"] || ""), 
          linkFile: String(row["Link File"] || "")
        })).filter(i => i.namaProker);
        
        setProkerData(prev => { const updated = [...prev, ...validData]; setDoc(doc(db, "website_config", "database_administrasi"), { listProker: updated }, { merge: true }); return updated; });
        alert(`Berhasil mengimpor ${validData.length} data Proker ke Ruang Kerja ${activeLembaga}!`);
      } catch (error) { alert("Format excel salah."); }
    }; reader.readAsBinaryString(file); e.target.value = null;
  };

  if (loading) return <p className="text-slate-500 animate-pulse font-medium">Memuat database administrasi...</p>;

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto relative">
      
      {/* HEADER UTAMA */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail size={24} className="text-blue-600" /> Pusat Kelola Administrasi
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola arsip surat, program kerja divisi, produk hukum, dan laporan lembaga.</p>
        </div>
      </div>

      <div className="bg-white p-3 md:px-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center gap-4">
         <div className="flex items-center gap-2 text-slate-600 font-bold text-sm shrink-0">
            <Building size={16} className="text-blue-600"/> Ruang Kerja:
         </div>
         <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none flex-grow">
            <button onClick={() => setActiveLembaga("Komisariat")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeLembaga === "Komisariat" ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Komisariat</button>
            <button onClick={() => setActiveLembaga("KOPRI")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeLembaga === "KOPRI" ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>KOPRI</button>
            
            {listLSO.map(lso => (
               <button key={lso} onClick={() => setActiveLembaga(lso)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeLembaga === lso ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{lso}</button>
            ))}
         </div>
         <button onClick={() => setShowLSOModal(true)} className="shrink-0 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
            <Settings size={14}/> Kelola LSO
         </button>
      </div>

      <div className="bg-blue-50/50 p-2 rounded-2xl flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 border border-blue-100">
        <button onClick={() => setActiveTab("persuratan")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "persuratan" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}><Mail size={16} /> Arsip Surat</button>
        <button onClick={() => setActiveTab("proker")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "proker" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}><Briefcase size={16} /> Program Kerja</button>
        <button onClick={() => setActiveTab("hukum")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "hukum" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}><Scale size={16} /> Produk Hukum</button>
        <button onClick={() => setActiveTab("lpj")} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "lpj" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}><FileCheck size={16} /> Laporan</button>
      </div>

      <div className="text-xs font-bold text-slate-400 pl-2">
         Menampilkan & Mengedit Data Arsip: <span className="text-blue-600 uppercase tracking-widest">{activeLembaga}</span>
      </div>

      <div className="space-y-6">

        {/* ======================= TAB 1: PERSURATAN ======================= */}
        {activeTab === "persuratan" && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-max">
              <button onClick={() => setActiveSuratTab("masuk")} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeSuratTab === "masuk" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}><Inbox size={14} /> Surat Masuk</button>
              <button onClick={() => setActiveSuratTab("keluar")} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeSuratTab === "keluar" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}><Send size={14} /> Surat Keluar</button>
            </div>

            {activeSuratTab === "masuk" ? (
              // SURAT MASUK
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm md:col-span-2">
                  <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Inbox size={16} className="text-amber-600" /> Input Surat Masuk ({activeLembaga})</h2>
                  <form onSubmit={handleAddSuratMasuk} className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                    <div className="col-span-2 sm:col-span-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Nomor Surat</label><input type="text" name="nomorSurat" required className="w-full p-2 border rounded-xl text-sm font-mono" /></div>
                    <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Asal Surat</label><input type="text" name="asalSurat" required className="w-full p-2 border rounded-xl text-sm" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tgl Buat</label><input type="text" name="tglBuat" className="w-full p-2 border rounded-xl text-sm font-mono" placeholder="DD/MM/YYYY"/></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tgl Datang</label><input type="text" name="tglDatang" className="w-full p-2 border rounded-xl text-sm font-mono" placeholder="DD/MM/YYYY"/></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Hal / Perihal</label><input type="text" name="hal" required className="w-full p-2 border rounded-xl text-sm" /></div>
                    <div className="col-span-2 sm:col-span-3"><label className="text-[10px] font-bold text-slate-400 uppercase">Keterangan Singkat</label><input type="text" name="ket" className="w-full p-2 border rounded-xl text-sm" /></div>
                    
                    <div className="col-span-2 sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><UploadCloud size={12}/> File (PDF/Word)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'suratFile' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'}`}>
                          {uploadingField === 'suratFile' ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Pilih Berkas</>}
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'suratFile')} disabled={uploadingField !== null} />
                        </label>
                        <input type="text" value={urls.suratFile} onChange={(e) => setUrls({...urls, suratFile: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs bg-white text-slate-600 focus:ring-2 focus:ring-amber-500 font-mono outline-none" placeholder="Paste Link GDrive..." />
                      </div>
                    </div>
                    <button type="submit" className="col-span-2 sm:col-span-3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm mt-2 transition shadow-md">Simpan Surat Masuk</button>
                  </form>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col justify-center text-center">
                  <FileSpreadsheet className="text-amber-500 mx-auto mb-2" size={32}/>
                  <h3 className="font-bold text-amber-800 text-sm mb-1">Import ke {activeLembaga}</h3>
                  <p className="text-[10px] text-amber-600 mb-4">Upload rekap surat Excel sekaligus.</p>
                  <button type="button" onClick={() => fileInputSuratMasukRef.current.click()} className="bg-amber-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-md">Pilih Excel</button>
                  <input type="file" accept=".xlsx, .xls" ref={fileInputSuratMasukRef} onChange={handleExcelSuratMasuk} className="hidden" />
                  <button type="button" onClick={downloadTemplateSuratMasuk} className="text-[11px] text-amber-700 hover:text-amber-900 font-bold mt-4 flex items-center justify-center gap-1.5 hover:underline"><Download size={14}/> Unduh Template Format</button>
                </div>

                <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap min-w-[1100px]">
                    <thead className="bg-amber-500 text-white text-xs uppercase tracking-wider">
                      <tr><th className="py-2 px-3 w-10 text-center">No</th><th className="py-2 px-3 w-32 text-center">No Surat</th><th className="py-2 px-3 w-40 text-center">Asal Surat</th><th className="py-2 px-3 w-28 text-center">Tgl Buat</th><th className="py-2 px-3 w-28 text-center">Tgl Datang</th><th className="py-2 px-3 w-40 text-center">Hal</th><th className="py-2 px-3 text-center">Keterangan</th><th className="py-2 px-3 w-32 text-center">Link File</th><th className="py-2 px-3 w-12 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredSuratMasuk.map((item, index) => (
                        <tr key={item.id} className="hover:bg-amber-50/50">
                          <td className="py-1.5 px-3 text-center font-bold text-slate-400">{index+1}</td>
                          <td className="py-1.5 px-3"><input type="text" value={item.nomorSurat} onChange={e => handleUpdate('suratMasuk', item.id, 'nomorSurat', e.target.value)} className="w-full bg-transparent outline-none font-mono font-bold text-blue-600" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.asalSurat} onChange={e => handleUpdate('suratMasuk', item.id, 'asalSurat', e.target.value)} className="w-full bg-transparent outline-none font-bold" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.tglBuat || ""} onChange={e => handleUpdate('suratMasuk', item.id, 'tglBuat', e.target.value)} className="w-full bg-transparent outline-none font-mono text-slate-500" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.tglDatang || ""} onChange={e => handleUpdate('suratMasuk', item.id, 'tglDatang', e.target.value)} className="w-full bg-transparent outline-none font-mono text-slate-500" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.hal || ""} onChange={e => handleUpdate('suratMasuk', item.id, 'hal', e.target.value)} className="w-full bg-transparent outline-none font-semibold text-slate-700" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.ket || ""} onChange={e => handleUpdate('suratMasuk', item.id, 'ket', e.target.value)} className="w-full bg-transparent outline-none text-slate-500" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.linkFile || ""} onChange={e => handleUpdate('suratMasuk', item.id, 'linkFile', e.target.value)} className="w-full bg-transparent outline-none text-[10px] font-mono text-blue-500" /></td>
                          <td className="py-1.5 px-3 text-center"><button type="button" onClick={() => handleDelete('suratMasuk', item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></td>
                        </tr>
                      ))}
                      {filteredSuratMasuk.length === 0 && <tr><td colSpan="9" className="py-8 text-center text-slate-400">Kosong</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // SURAT KELUAR
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm md:col-span-2">
                  <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Send size={16} className="text-blue-600" /> Input Surat Keluar ({activeLembaga})</h2>
                  <form onSubmit={handleAddSuratKeluar} className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                    <div className="col-span-2 sm:col-span-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Nomor Surat</label><input type="text" name="nomorSurat" required className="w-full p-2 border rounded-xl text-sm font-mono" /></div>
                    <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Tujuan Surat</label><input type="text" name="tujuanSurat" required className="w-full p-2 border rounded-xl text-sm" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tgl Buat</label><input type="text" name="tglBuat" className="w-full p-2 border rounded-xl text-sm font-mono" placeholder="DD/MM/YYYY"/></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tgl Kirim</label><input type="text" name="tglKirim" className="w-full p-2 border rounded-xl text-sm font-mono" placeholder="DD/MM/YYYY"/></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Hal / Perihal</label><input type="text" name="hal" required className="w-full p-2 border rounded-xl text-sm" /></div>
                    <div className="col-span-2 sm:col-span-3"><label className="text-[10px] font-bold text-slate-400 uppercase">Keterangan Singkat</label><input type="text" name="ket" className="w-full p-2 border rounded-xl text-sm" /></div>
                    
                    <div className="col-span-2 sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><UploadCloud size={12}/> File (PDF/Word)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'suratFile' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'}`}>
                          {uploadingField === 'suratFile' ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Pilih Berkas</>}
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'suratFile')} disabled={uploadingField !== null} />
                        </label>
                        <input type="text" value={urls.suratFile} onChange={(e) => setUrls({...urls, suratFile: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs bg-white text-slate-600 focus:ring-2 focus:ring-blue-500 font-mono outline-none" placeholder="Paste Link GDrive..." />
                      </div>
                    </div>
                    <button type="submit" className="col-span-2 sm:col-span-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm mt-2 transition shadow-md">Simpan Surat Keluar</button>
                  </form>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col justify-center text-center">
                  <FileSpreadsheet className="text-blue-500 mx-auto mb-2" size={32}/>
                  <h3 className="font-bold text-blue-800 text-sm mb-1">Import ke {activeLembaga}</h3>
                  <p className="text-[10px] text-blue-600 mb-4">Upload rekap surat Excel sekaligus.</p>
                  <button type="button" onClick={() => fileInputSuratKeluarRef.current.click()} className="bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md">Pilih Excel</button>
                  <input type="file" accept=".xlsx, .xls" ref={fileInputSuratKeluarRef} onChange={handleExcelSuratKeluar} className="hidden" />
                  <button type="button" onClick={downloadTemplateSuratKeluar} className="text-[11px] text-blue-700 hover:text-blue-900 font-bold mt-4 flex items-center justify-center gap-1.5 hover:underline"><Download size={14}/> Unduh Template Format</button>
                </div>

                <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap min-w-[1100px]">
                    <thead className="bg-[#1e293b] text-white text-xs uppercase tracking-wider">
                      <tr><th className="py-2 px-3 w-10 text-center">No</th><th className="py-2 px-3 w-32 text-center">No Surat</th><th className="py-2 px-3 w-40 text-center">Tujuan Surat</th><th className="py-2 px-3 w-28 text-center">Tgl Buat</th><th className="py-2 px-3 w-28 text-center">Tgl Kirim</th><th className="py-2 px-3 w-40 text-center">Hal</th><th className="py-2 px-3 text-center">Keterangan</th><th className="py-2 px-3 w-32 text-center">Link File</th><th className="py-2 px-3 w-12 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredSuratKeluar.map((item, index) => (
                        <tr key={item.id} className="hover:bg-blue-50/50">
                          <td className="py-1.5 px-3 text-center font-bold text-slate-400">{index+1}</td>
                          <td className="py-1.5 px-3"><input type="text" value={item.nomorSurat} onChange={e => handleUpdate('suratKeluar', item.id, 'nomorSurat', e.target.value)} className="w-full bg-transparent outline-none font-mono font-bold text-blue-600" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.tujuanSurat} onChange={e => handleUpdate('suratKeluar', item.id, 'tujuanSurat', e.target.value)} className="w-full bg-transparent outline-none font-bold" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.tglBuat || ""} onChange={e => handleUpdate('suratKeluar', item.id, 'tglBuat', e.target.value)} className="w-full bg-transparent outline-none font-mono text-slate-500" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.tglKirim || ""} onChange={e => handleUpdate('suratKeluar', item.id, 'tglKirim', e.target.value)} className="w-full bg-transparent outline-none font-mono text-slate-500" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.hal || item.perihalSurat || ""} onChange={e => handleUpdate('suratKeluar', item.id, 'hal', e.target.value)} className="w-full bg-transparent outline-none font-semibold text-slate-700" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.ket || item.deskripsiSurat || ""} onChange={e => handleUpdate('suratKeluar', item.id, 'ket', e.target.value)} className="w-full bg-transparent outline-none text-slate-500" /></td>
                          <td className="py-1.5 px-3"><input type="text" value={item.linkFile || ""} onChange={e => handleUpdate('suratKeluar', item.id, 'linkFile', e.target.value)} className="w-full bg-transparent outline-none text-[10px] font-mono text-blue-500" /></td>
                          <td className="py-1.5 px-3 text-center"><button type="button" onClick={() => handleDelete('suratKeluar', item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></td>
                        </tr>
                      ))}
                      {filteredSuratKeluar.length === 0 && <tr><td colSpan="9" className="py-8 text-center text-slate-400">Kosong</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: PROGRAM KERJA ======================= */}
        {activeTab === "proker" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm lg:col-span-2">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Plus size={16} className="text-emerald-600" /> Input Proker {activeLembaga}</h2>
                <form onSubmit={handleAddProker} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Pelaksana/Biro</label><input type="text" name="pelaksana" required className="w-full p-2 border rounded-lg text-xs" placeholder="Biro Kaderisasi"/></div>
                  <div className="sm:col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Nama Kegiatan</label><input type="text" name="namaProker" required className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tujuan</label><input type="text" name="tujuan" className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Indikator</label><input type="text" name="indikator" className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Sasaran</label><input type="text" name="sasaran" className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Waktu</label><input type="text" name="waktu" className="w-full p-2 border rounded-lg text-xs" placeholder="Misal: Juni 2026"/></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Penanggung Jawab</label><input type="text" name="pj" className="w-full p-2 border rounded-lg text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase">Estimasi Dana</label><input type="text" name="dana" className="w-full p-2 border rounded-lg text-xs font-mono" placeholder="Rp 0"/></div>
                  
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><UploadCloud size={12}/> File Pendukung (Proposal / LPJ)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition border shrink-0 ${uploadingField === 'prokerFile' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-sm'}`}>
                        {uploadingField === 'prokerFile' ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Pilih File</>}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'prokerFile')} disabled={uploadingField !== null} />
                      </label>
                      <input type="text" value={urls.prokerFile} onChange={(e) => setUrls({...urls, prokerFile: e.target.value})} className="w-full p-2.5 border rounded-lg text-xs bg-white text-slate-600 focus:ring-2 focus:ring-emerald-500 font-mono outline-none" placeholder="Paste Link GDrive..." />
                    </div>
                  </div>

                  <button type="submit" className="col-span-2 sm:col-span-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm mt-2 transition shadow-md">Tambah ke Tabel Proker</button>
                </form>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col justify-center text-center">
                <FileSpreadsheet className="text-emerald-500 mx-auto mb-2" size={32}/>
                <h3 className="font-bold text-emerald-800 text-sm mb-1">Import ke {activeLembaga}</h3>
                <p className="text-[10px] text-emerald-600 mb-4">Upload master plan program kerja pengurus sekaligus.</p>
                <button type="button" onClick={() => fileInputProkerRef.current.click()} className="bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md">Pilih File Excel</button>
                <input type="file" accept=".xlsx, .xls" ref={fileInputProkerRef} onChange={handleExcelProker} className="hidden" />
                <button type="button" onClick={downloadTemplateProker} className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold mt-4 flex items-center justify-center gap-1.5 hover:underline"><Download size={14}/> Unduh Template Format Excel</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap min-w-[1300px]">
                <thead className="bg-emerald-900 text-white text-xs uppercase tracking-wider">
                  <tr><th className="py-3 px-3 w-12 text-center">No</th><th className="py-3 px-3 w-40 text-center">Biro/Pelaksana</th><th className="py-3 px-3 w-48 text-center">Kegiatan</th><th className="py-3 px-3 text-center">Tujuan</th><th className="py-3 px-3 text-center">Indikator</th><th className="py-3 px-3 w-32 text-center">Sasaran</th><th className="py-3 px-3 w-32 text-center">Waktu</th><th className="py-3 px-3 w-32 text-center">PJ</th><th className="py-3 px-3 w-32 text-center">Dana</th><th className="py-3 px-3 w-32 text-center">Link File</th><th className="py-3 px-3 w-12 text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProker.map((item, index) => (
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
                  {filteredProker.length === 0 && <tr><td colSpan="11" className="py-8 text-center text-slate-400">Kosong</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: PRODUK HUKUM ======================= */}
        {activeTab === "hukum" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Plus size={16} className="text-purple-600" /> Input Produk Hukum / SK ({activeLembaga})</h2>
              <form onSubmit={handleAddHukum} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nomor SK / Ketetapan</label><input type="text" name="nomorSK" required className="w-full p-2.5 border rounded-xl text-sm font-mono" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tentang / Regulasi</label><input type="text" name="tentang" required className="w-full p-2.5 border rounded-xl text-sm" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Keterangan Singkat</label><input type="text" name="deskripsi" className="w-full p-2.5 border rounded-xl text-sm" /></div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><ImageIcon size={12}/> Gambar Cover Dokumen</label>
                  <div className="flex flex-col xl:flex-row items-center gap-2">
                    <label className={`w-full xl:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'hukumThumb' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 shadow-sm'}`}>
                      {uploadingField === 'hukumThumb' ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'hukumThumb')} disabled={uploadingField !== null} />
                    </label>
                    <input type="text" value={urls.hukumThumb} onChange={(e) => setUrls({...urls, hukumThumb: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500 text-slate-600 font-mono outline-none" placeholder="Paste GDrive..." />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><FileText size={12}/> File Dokumen SK / Ketetapan (PDF)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'hukumFile' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 shadow-sm'}`}>
                      {uploadingField === 'hukumFile' ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Pilih File PDF</>}
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'hukumFile')} disabled={uploadingField !== null} />
                    </label>
                    <input type="text" value={urls.hukumFile} onChange={(e) => setUrls({...urls, hukumFile: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:ring-2 focus:ring-purple-500 font-mono outline-none transition-all" placeholder="Upload PDF atau Paste Link Google Drive..." />
                  </div>
                </div>

                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-sm w-full md:col-span-3 transition shadow-md">Simpan Produk Hukum Baru</button>
              </form>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
                <thead className="bg-[#2e1065] text-white text-xs uppercase tracking-wider">
                  <tr><th className="py-3 px-4 w-12 text-center">No</th><th className="py-3 px-4 w-1/4 text-center">Nomor SK</th><th className="py-3 px-4 w-1/4 text-center">Tentang</th><th className="py-3 px-4 text-center">Deskripsi</th><th className="py-3 px-4 w-32 text-center">Cover URL</th><th className="py-3 px-4 w-40 text-center">Link PDF</th><th className="py-3 px-4 w-16 text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredHukum.map((item, index) => (
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
                  {filteredHukum.length === 0 && <tr><td colSpan="7" className="py-8 text-center text-slate-400">Kosong</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= TAB 4: LAPORAN KEPENGURUSAN ======================= */}
        {activeTab === "lpj" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Plus size={16} className="text-amber-600" /> Input LPJ ({activeLembaga})</h2>
              <form onSubmit={handleAddLpj} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nama Laporan</label><input type="text" name="namaLaporan" required className="w-full p-2.5 border rounded-xl text-sm font-bold" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Periode Kepengurusan</label><input type="text" name="periode" required className="w-full p-2.5 border rounded-xl text-sm" placeholder="2026-2027"/></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Keterangan Singkat</label><input type="text" name="deskripsi" className="w-full p-2.5 border rounded-xl text-sm" /></div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><ImageIcon size={12}/> Gambar Cover Dokumen</label>
                  <div className="flex flex-col xl:flex-row items-center gap-2">
                    <label className={`w-full xl:w-auto cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'lpjThumb' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-sm'}`}>
                      {uploadingField === 'lpjThumb' ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'lpjThumb')} disabled={uploadingField !== null} />
                    </label>
                    <input type="text" value={urls.lpjThumb} onChange={(e) => setUrls({...urls, lpjThumb: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-500 text-slate-600 font-mono outline-none" placeholder="Paste GDrive..." />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><FileText size={12}/> File Dokumen Laporan (PDF)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label className={`w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border shrink-0 ${uploadingField === 'lpjFile' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-sm'}`}>
                      {uploadingField === 'lpjFile' ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Pilih File PDF</>}
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'lpjFile')} disabled={uploadingField !== null} />
                    </label>
                    <input type="text" value={urls.lpjFile} onChange={(e) => setUrls({...urls, lpjFile: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:ring-2 focus:ring-amber-500 font-mono outline-none transition-all" placeholder="Upload PDF atau Paste Link Google Drive..." />
                  </div>
                </div>

                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm w-full md:col-span-3 transition shadow-md">Simpan Laporan Baru</button>
              </form>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
                <thead className="bg-[#78350f] text-white text-xs uppercase tracking-wider">
                  <tr><th className="py-3 px-4 w-12 text-center">No</th><th className="py-3 px-4 w-1/4 text-center">Nama Laporan</th><th className="py-3 px-4 w-1/6 text-center">Periode</th><th className="py-3 px-4 text-center">Deskripsi</th><th className="py-3 px-4 w-32 text-center">Cover URL</th><th className="py-3 px-4 w-40 text-center">Link PDF</th><th className="py-3 px-4 w-16 text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLpj.map((item, index) => (
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
                  {filteredLpj.length === 0 && <tr><td colSpan="7" className="py-8 text-center text-slate-400">Kosong</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TOMBOL SIMPAN GLOBAL ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 sticky bottom-4 z-40 shadow-xl shadow-blue-500/5">
           <div className="flex items-center gap-2 text-xs text-blue-700">
             <Info size={16} className="shrink-0 text-blue-600" />
             <p>Pastikan Anda mengklik tombol "Simpan Sistem Arsip" setiap kali selesai menambah/mengedit data.</p>
           </div>
           
           <button type="button" onClick={handleSaveAll} disabled={uploadingField !== null} className="w-full sm:w-auto bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 shadow-md text-sm shrink-0">
              Simpan Sistem Arsip <Save size={16} />
            </button>
        </div>

      </div>

      {/* ================= MODAL KELOLA LSO ================= */}
      {showLSOModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
             <button onClick={() => setShowLSOModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
             <h2 className="font-extrabold text-xl mb-1 text-slate-800">Manajemen Ruang Kerja</h2>
             <p className="text-xs text-slate-500 mb-6">Tambah atau hapus Lembaga Semi Otonom (LSO) untuk memisahkan laci arsip.</p>
             
             <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
               {listLSO.map(lso => (
                 <div key={lso} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                   <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Building size={14} className="text-slate-400"/> {lso}</span>
                   <button onClick={() => handleDeleteLSO(lso)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg"><Trash2 size={16}/></button>
                 </div>
               ))}
               {listLSO.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Belum ada LSO kustom yang ditambahkan.</p>}
             </div>
             
             <div className="flex gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
               <input type="text" value={newLSO} onChange={e => setNewLSO(e.target.value)} placeholder="Nama LSO baru (Misal: LSO Jurnalistik)" className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500" />
               <button onClick={handleAddLSO} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">Tambah</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}