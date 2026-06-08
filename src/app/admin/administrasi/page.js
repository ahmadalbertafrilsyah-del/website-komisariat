"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { 
  FolderArchive, Mail, Briefcase, Scale, FileCheck, Inbox, Send, Search, 
  Download, Plus, Trash2, Edit, Save, FileSpreadsheet, Building2, 
  Loader2, Sparkles, X, ExternalLink, UploadCloud
} from "lucide-react";

export default function AdminAdministrasi() {
  const [loading, setLoading] = useState(true);
  const [activeLembaga, setActiveLembaga] = useState("Komisariat"); 
  const [listLSO, setListLSO] = useState([]); 
  
  // State Data Master
  const [masterSuratMasuk, setMasterSuratMasuk] = useState([]); 
  const [masterSuratKeluar, setMasterSuratKeluar] = useState([]); 
  const [masterProker, setMasterProker] = useState([]);
  const [masterProdukHukum, setMasterProdukHukum] = useState([]);
  const [masterLpj, setMasterLpj] = useState([]); 
  
  // State Navigasi
  const [activeTab, setActiveTab] = useState("persuratan"); 
  const [activeSuratTab, setActiveSuratTab] = useState("masuk"); 
  const [searchQuery, setSearchQuery] = useState("");

  // State Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDataId, setEditDataId] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedRowId, setExpandedRowId] = useState(null);
  
  const excelInputRef = useRef(null);

  // Styling Standar Enterprise (Sesuai Alumni)
  const inputStandardClass = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm bg-white";
  const labelStandardClass = "text-xs font-semibold text-slate-700 block mb-1.5";

  useEffect(() => {
    fetchAdministrasiData();
  }, []); 

  async function fetchAdministrasiData() {
    try {
      const docRef = doc(db, "website_config", "database_administrasi");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasterSuratMasuk(data.listSuratMasuk || []); 
        setMasterSuratKeluar(data.listSuratKeluar || data.listDokumen || []); 
        setMasterProker(data.listProker || []);   
        setMasterProdukHukum(data.listProdukHukum || []); 
        setMasterLpj(data.listLpj || []); 
        setListLSO(data.listLSO || []);
      }
    } catch (error) {
      console.error("Gagal menarik database:", error);
    } finally {
      setLoading(false);
    }
  }

  // ================= HELPER & FILTERING =================
  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "-";
    if (!isNaN(dateVal) && Number(dateVal) > 20000) {
      const date = new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000));
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }
    if (typeof dateVal === 'string' && dateVal.includes('T') && !isNaN(new Date(dateVal))) {
      const d = new Date(dateVal);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    return dateVal;
  };

  const currentSuratMasuk = masterSuratMasuk.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  const currentSuratKeluar = masterSuratKeluar.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  const currentProker = masterProker.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  const currentProdukHukum = masterProdukHukum.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  const currentLpj = masterLpj.filter(item => (item.lembaga || "Komisariat") === activeLembaga);

  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === "persuratan") {
      const targetData = activeSuratTab === "masuk" ? currentSuratMasuk : currentSuratKeluar;
      return targetData.filter(i => (i.nomorSurat||"").toLowerCase().includes(q) || (i.hal||i.perihalSurat||"").toLowerCase().includes(q) || (i.asalSurat||i.tujuanSurat||"").toLowerCase().includes(q));
    } else if (activeTab === "proker") {
      return currentProker.filter(i => (i.namaProker||"").toLowerCase().includes(q) || (i.pelaksanaProker||"").toLowerCase().includes(q) || (i.penanggungJawab||"").toLowerCase().includes(q));
    } else if (activeTab === "produkhukum") {
      return currentProdukHukum.filter(i => (i.nomorSK||"").toLowerCase().includes(q) || (i.tentangHukum||"").toLowerCase().includes(q));
    } else {
      return currentLpj.filter(i => (i.namaLaporan||"").toLowerCase().includes(q) || (i.periode||"").toLowerCase().includes(q));
    }
  };
  const currentListData = getFilteredData();

  // ================= MANAJEMEN DATA =================
  const handleOpenModal = (data = null) => {
    if (data) {
      setEditDataId(data.id || data.nomorSurat || data.nomorSK || data.namaProker || Math.random());
      setFormData(data);
    } else {
      setEditDataId(null);
      setFormData({ lembaga: activeLembaga });
    }
    setIsModalOpen(true);
  };

  const handleSaveData = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, id: editDataId || Date.now().toString(), lembaga: activeLembaga };
      let newMaster;

      if (activeTab === "persuratan") {
        if (activeSuratTab === "masuk") {
          newMaster = editDataId ? masterSuratMasuk.map(i => i.id === editDataId ? payload : i) : [payload, ...masterSuratMasuk];
          setMasterSuratMasuk(newMaster);
        } else {
          newMaster = editDataId ? masterSuratKeluar.map(i => i.id === editDataId ? payload : i) : [payload, ...masterSuratKeluar];
          setMasterSuratKeluar(newMaster);
        }
      } else if (activeTab === "proker") {
        newMaster = editDataId ? masterProker.map(i => i.id === editDataId ? payload : i) : [payload, ...masterProker];
        setMasterProker(newMaster);
      } else if (activeTab === "produkhukum") {
        newMaster = editDataId ? masterProdukHukum.map(i => i.id === editDataId ? payload : i) : [payload, ...masterProdukHukum];
        setMasterProdukHukum(newMaster);
      } else if (activeTab === "laporan") {
        newMaster = editDataId ? masterLpj.map(i => i.id === editDataId ? payload : i) : [payload, ...masterLpj];
        setMasterLpj(newMaster);
      }

      await saveDataToFirebase(activeTab, activeSuratTab, newMaster);
      alert("Data berhasil disimpan!");
      setIsModalOpen(false);
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  const handleDeleteData = async (idToDelete) => {
    if (!confirm("Hapus arsip ini secara permanen?")) return;
    try {
      let newMaster;
      if (activeTab === "persuratan") {
        if (activeSuratTab === "masuk") { newMaster = masterSuratMasuk.filter(i => i.id !== idToDelete); setMasterSuratMasuk(newMaster); } 
        else { newMaster = masterSuratKeluar.filter(i => i.id !== idToDelete); setMasterSuratKeluar(newMaster); }
      } else if (activeTab === "proker") { newMaster = masterProker.filter(i => i.id !== idToDelete); setMasterProker(newMaster);
      } else if (activeTab === "produkhukum") { newMaster = masterProdukHukum.filter(i => i.id !== idToDelete); setMasterProdukHukum(newMaster);
      } else if (activeTab === "laporan") { newMaster = masterLpj.filter(i => i.id !== idToDelete); setMasterLpj(newMaster); }

      await saveDataToFirebase(activeTab, activeSuratTab, newMaster);
    } catch (error) { alert("Gagal menghapus: " + error.message); }
  };

  const saveDataToFirebase = async (tab, suratTab, newMasterData) => {
    const docRef = doc(db, "website_config", "database_administrasi");
    let updateField = {};
    if (tab === "persuratan") updateField = suratTab === "masuk" ? { listSuratMasuk: newMasterData } : { listSuratKeluar: newMasterData };
    else if (tab === "proker") updateField = { listProker: newMasterData };
    else if (tab === "produkhukum") updateField = { listProdukHukum: newMasterData };
    else if (tab === "laporan") updateField = { listLpj: newMasterData };
    await setDoc(docRef, updateField, { merge: true });
  };

  // ================= IMPORT & EXPORT EXCEL SESUAI AWAL =================
  const handleDownloadTemplate = () => {
    let templateData = [];
    if (activeTab === "persuratan") {
      templateData = [{
        "Nomor Surat": "001/PMII/2026",
        "Asal/Tujuan Surat": "PC PMII Kota Malang",
        "Tanggal Buat (YYYY-MM-DD)": "2026-06-01",
        "Tanggal Terima/Kirim (YYYY-MM-DD)": "2026-06-02",
        "Perihal": "Undangan Kegiatan",
        "Keterangan": "Surat Penting",
        "Link Berkas": "https://drive.google.com/..."
      }];
    } else if (activeTab === "proker") {
      templateData = [{
        "Nama Program Kerja": "Pelatihan Jurnalistik",
        "Biro / Pelaksana": "Biro Media",
        "Waktu Pelaksanaan (YYYY-MM-DD)": "2026-07-15",
        "Tujuan Kegiatan": "Meningkatkan kemampuan menulis kader",
        "Indikator": "50 Peserta mampu menulis opini",
        "Sasaran": "Anggota Baru",
        "Penanggung Jawab": "Ahmad Albert",
        "Estimasi Dana": "Rp 500.000",
        "Link Berkas": ""
      }];
    } else if (activeTab === "produkhukum") {
      templateData = [{
        "Nomor SK / Ketetapan": "01/SK/PMII/2026",
        "Tentang": "Pengesahan Pengurus Rayon",
        "Deskripsi Singkat": "Mengesahkan kepengurusan Rayon untuk masa khidmat 2026-2027",
        "Link Berkas": ""
      }];
    } else if (activeTab === "laporan") {
      templateData = [{
        "Nama Laporan": "LPJ Panitia RTK",
        "Periode": "Tahun 2026",
        "Deskripsi Singkat": "Laporan akhir panitia Rapat Tahunan",
        "Link Berkas": ""
      }];
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Template_${activeTab}`);
    XLSX.writeFile(wb, `Template_Impor_${activeTab.toUpperCase()}.xlsx`);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        let updatedData = [];
        if (activeTab === "persuratan") {
          const isMasuk = activeSuratTab === "masuk";
          updatedData = data.map(row => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            lembaga: activeLembaga,
            nomorSurat: row["Nomor Surat"] || "",
            hal: row["Perihal"] || "",
            ket: row["Keterangan"] || "",
            tglBuat: row["Tanggal Buat (YYYY-MM-DD)"] || "",
            linkFile: row["Link Berkas"] || "",
            ...(isMasuk 
              ? { asalSurat: row["Asal/Tujuan Surat"] || "", tglDatang: row["Tanggal Terima/Kirim (YYYY-MM-DD)"] || "" } 
              : { tujuanSurat: row["Asal/Tujuan Surat"] || "", tglKirim: row["Tanggal Terima/Kirim (YYYY-MM-DD)"] || "" })
          }));
          const newMaster = [...updatedData, ...(isMasuk ? masterSuratMasuk : masterSuratKeluar)];
          if (isMasuk) setMasterSuratMasuk(newMaster); else setMasterSuratKeluar(newMaster);
          await saveDataToFirebase(activeTab, activeSuratTab, newMaster);
        } else if (activeTab === "proker") {
          updatedData = data.map(row => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            lembaga: activeLembaga,
            namaProker: row["Nama Program Kerja"] || "",
            pelaksanaProker: row["Biro / Pelaksana"] || "",
            waktuPelaksanaan: row["Waktu Pelaksanaan (YYYY-MM-DD)"] || "",
            tujuan: row["Tujuan Kegiatan"] || "",
            indikator: row["Indikator"] || "",
            sasaran: row["Sasaran"] || "",
            penanggungJawab: row["Penanggung Jawab"] || "",
            estimasiDana: row["Estimasi Dana"] || "",
            linkFile: row["Link Berkas"] || ""
          }));
          const newMaster = [...updatedData, ...masterProker];
          setMasterProker(newMaster);
          await saveDataToFirebase(activeTab, null, newMaster);
        } else if (activeTab === "produkhukum") {
          updatedData = data.map(row => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            lembaga: activeLembaga,
            nomorSK: row["Nomor SK / Ketetapan"] || "",
            tentangHukum: row["Tentang"] || "",
            deskripsiHukum: row["Deskripsi Singkat"] || "",
            linkFile: row["Link Berkas"] || ""
          }));
          const newMaster = [...updatedData, ...masterProdukHukum];
          setMasterProdukHukum(newMaster);
          await saveDataToFirebase(activeTab, null, newMaster);
        } else if (activeTab === "laporan") {
          updatedData = data.map(row => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            lembaga: activeLembaga,
            namaLaporan: row["Nama Laporan"] || "",
            periode: row["Periode"] || "",
            deskripsiLaporan: row["Deskripsi Singkat"] || "",
            linkFile: row["Link Berkas"] || ""
          }));
          const newMaster = [...updatedData, ...masterLpj];
          setMasterLpj(newMaster);
          await saveDataToFirebase(activeTab, null, newMaster);
        }

        alert(`Berhasil mengimpor ${updatedData.length} data ke arsip ${activeTab.toUpperCase()} (${activeLembaga})!`);
      } catch (error) {
        alert("Gagal membaca file Excel. Pastikan format tabel sesuai dengan Template Unduhan.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleExportExcel = () => {
    if (currentListData.length === 0) return alert("Tidak ada data untuk diekspor!");
    let formattedData = [];
    if (activeTab === "persuratan") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Nomor Surat": i.nomorSurat, [activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"]: activeSuratTab === "masuk" ? i.asalSurat : i.tujuanSurat, "Tanggal Buat": i.tglBuat, [activeSuratTab === "masuk" ? "Tanggal Datang" : "Tanggal Kirim"]: activeSuratTab === "masuk" ? i.tglDatang : i.tglKirim, "Perihal": i.hal || i.perihalSurat, "Keterangan": i.ket || i.deskripsiSurat, "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "proker") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Biro/Pelaksana": i.pelaksanaProker, "Nama Kegiatan": i.namaProker, "Tujuan": i.tujuan, "Indikator": i.indikator, "Sasaran": i.sasaran, "Waktu Pelaksanaan": i.waktuPelaksanaan, "Penanggung Jawab": i.penanggungJawab, "Estimasi Dana": i.estimasiDana, "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "produkhukum") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Nomor SK": i.nomorSK, "Tentang Hukum": i.tentangHukum, "Deskripsi": i.deskripsiHukum, "Link Berkas": i.linkFile
      }));
    } else if (activeTab === "laporan") {
      formattedData = currentListData.map((i, idx) => ({
        "No": idx + 1, "Nama Laporan": i.namaLaporan, "Periode": i.periode, "Deskripsi Laporan": i.deskripsiLaporan, "Link Berkas": i.linkFile
      }));
    }
    const ws = XLSX.utils.json_to_sheet(formattedData); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Arsip"); XLSX.writeFile(wb, `Rekap_${activeTab}_${Date.now()}.xlsx`);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="text-blue-600 animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-12 w-full text-sm">
      
      {/* HEADER PANEL */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Sistem Administrasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Kelola arsip surat, program kerja, produk hukum, dan laporan lembaga.</p>
        </div>
        <div className="bg-white p-2 rounded-md border border-slate-300 flex items-center gap-2 shadow-sm min-w-[250px]">
           <Building2 size={18} className="text-blue-600 ml-2" />
           <select value={activeLembaga} onChange={e => {setActiveLembaga(e.target.value); setSearchQuery("");}} className="w-full text-sm font-bold text-slate-800 bg-transparent border-none focus:ring-0 outline-none cursor-pointer">
              <option value="Komisariat">Administrasi Komisariat</option>
              <option value="KOPRI">Administrasi KOPRI</option>
              {listLSO.map(lso => <option key={lso} value={lso}>Administrasi {lso}</option>)}
           </select>
        </div>
      </div>

      {/* TABS MENU STANDAR */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px scrollbar-none mb-4">
        <button onClick={() => {setActiveTab("persuratan"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "persuratan" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Mail size={16} /> Arsip Persuratan</button>
        <button onClick={() => {setActiveTab("proker"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "proker" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Briefcase size={16} /> Program Kerja</button>
        <button onClick={() => {setActiveTab("produkhukum"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "produkhukum" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><Scale size={16} /> Produk Hukum</button>
        <button onClick={() => {setActiveTab("laporan"); setSearchQuery("");}} className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "laporan" ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}><FileCheck size={16} /> Laporan (LPJ)</button>
      </div>

      {/* FILTER & AKSI */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between gap-4 items-center mb-6">
         <div className="flex w-full xl:w-auto gap-3 items-center">
           {activeTab === "persuratan" && (
             <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 items-center shrink-0">
               <button onClick={() => setActiveSuratTab("masuk")} className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${activeSuratTab === "masuk" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><Inbox size={14}/> S. Masuk</button>
               <button onClick={() => setActiveSuratTab("keluar")} className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${activeSuratTab === "keluar" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><Send size={14}/> S. Keluar</button>
             </div>
           )}
           <div className="relative flex-1 xl:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <input type="text" placeholder="Cari arsip..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className={`${inputStandardClass} pl-9`} />
           </div>
         </div>
         
         <div className="flex w-full xl:w-auto flex-wrap gap-2 justify-end">
           <button onClick={handleDownloadTemplate} className="flex-1 md:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
              <Download size={16} /> <span className="hidden sm:inline">Template</span>
           </button>
           <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={excelInputRef} onChange={handleImportExcel} />
           <button onClick={() => excelInputRef.current.click()} className="flex-1 md:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
              <UploadCloud size={16} /> <span className="hidden sm:inline">Impor</span>
           </button>
           <button onClick={handleExportExcel} className="flex-1 md:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition shadow-sm">
              <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Ekspor</span>
           </button>
           <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
              <Plus size={16} /> Tambah Data
           </button>
         </div>
      </div>

      {/* TABEL DATA SESUAI KOLOM AWAL */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-4 px-4 w-12 text-center">No</th>
                
                {/* Header Persuratan */}
                {activeTab === "persuratan" && (
                  <>
                    <th className="py-4 px-4">Nomor Surat</th>
                    <th className="py-4 px-4">{activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}</th>
                    <th className="py-4 px-4">Tanggal</th>
                    <th className="py-4 px-4">Perihal</th>
                    <th className="py-4 px-4 max-w-[200px]">Keterangan</th>
                  </>
                )}

                {/* Header Proker */}
                {activeTab === "proker" && (
                  <>
                    <th className="py-4 px-4">Nama Kegiatan</th>
                    <th className="py-4 px-4">Tujuan</th>
                    <th className="py-4 px-4">Indikator</th>
                    <th className="py-4 px-4">Sasaran</th>
                    <th className="py-4 px-4">Pelaksanaan</th>
                    <th className="py-4 px-4">PJ</th>
                    <th className="py-4 px-4">Dana</th>
                  </>
                )}

                {/* Header Produk Hukum & Laporan */}
                {(activeTab === "produkhukum" || activeTab === "laporan") && (
                  <>
                    <th className="py-4 px-4">{activeTab === "produkhukum" ? "Nomor SK / Judul" : "Judul Laporan"}</th>
                    <th className="py-4 px-4 max-w-[300px]">Deskripsi Singkat</th>
                  </>
                )}

                <th className="py-4 px-4 text-center">Berkas</th>
                <th className="py-4 px-4 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {currentListData.length === 0 ? (
                <tr><td colSpan="10" className="py-16 text-center text-slate-500 font-medium">Belum ada data pada kategori ini.</td></tr>
              ) : (
                currentListData.map((item, index) => {
                  const isExpanded = expandedRowId === index;

                  return (
                    <React.Fragment key={index}>
                      <tr className={`transition-colors hover:bg-slate-50 cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`} onClick={() => setExpandedRowId(isExpanded ? null : index)}>
                        <td className="py-3 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                        
                        {/* Row Persuratan */}
                        {activeTab === "persuratan" && (
                          <>
                            <td className="py-3 px-4 font-semibold text-slate-900">{item.nomorSurat || "-"}</td>
                            <td className="py-3 px-4 text-slate-600">{activeSuratTab === "masuk" ? (item.asalSurat||"-") : (item.tujuanSurat||"-")}</td>
                            <td className="py-3 px-4 text-slate-600">{formatDisplayDate(item.tglBuat)}</td>
                            <td className="py-3 px-4 font-medium">{item.hal || item.perihalSurat || "-"}</td>
                            <td className="py-3 px-4 text-slate-500 truncate max-w-[150px]">{item.ket || item.deskripsiSurat || "-"}</td>
                          </>
                        )}

                        {/* Row Proker */}
                        {activeTab === "proker" && (
                          <>
                            <td className="py-3 px-4 font-semibold text-slate-900">{item.namaProker || "-"}</td>
                            <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">{item.tujuan || "-"}</td>
                            <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">{item.indikator || "-"}</td>
                            <td className="py-3 px-4 text-slate-600">{item.sasaran || "-"}</td>
                            <td className="py-3 px-4 text-slate-600">{formatDisplayDate(item.waktuPelaksanaan)}</td>
                            <td className="py-3 px-4 text-slate-600">{item.penanggungJawab || "-"}</td>
                            <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">{item.estimasiDana || "-"}</td>
                          </>
                        )}

                        {/* Row Hukum & Laporan */}
                        {(activeTab === "produkhukum" || activeTab === "laporan") && (
                          <>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900">{activeTab === "produkhukum" ? item.nomorSK : item.namaLaporan}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{activeTab === "produkhukum" ? item.tentangHukum : item.periode}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-600 truncate max-w-[300px]">{item.deskripsiHukum || item.deskripsiLaporan || "-"}</td>
                          </>
                        )}

                        <td className="py-3 px-4 text-center">
                          {item.linkFile ? (
                             <a href={item.linkFile} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md border border-blue-200 transition"><Download size={14}/> Buka</a>
                          ) : <span className="text-slate-400 text-xs bg-slate-100 px-2 py-1.5 rounded-md">Kosong</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleOpenModal(item)} className="text-amber-500 hover:text-amber-700 p-1.5 bg-white border border-slate-200 hover:border-amber-200 rounded-md shadow-sm transition"><Edit size={14}/></button>
                            <button onClick={() => handleDeleteData(item.id)} className="text-red-500 hover:text-red-700 p-1.5 bg-white border border-slate-200 hover:border-red-200 rounded-md shadow-sm transition"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
               <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  {editDataId ? <Edit size={18} className="text-amber-500"/> : <Plus size={18} className="text-blue-600"/>}
                  {editDataId ? "Edit Arsip" : "Tambah Arsip Baru"}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-md transition"><X size={18}/></button>
            </div>

            <div className="p-6 overflow-y-auto bg-white flex-1">
               
               {/* TOMBOL LINK BANTUAN AI */}
               {activeTab === "persuratan" && !editDataId && (
                  <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1">
                       <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 mb-1"><Sparkles size={16} className="text-indigo-600"/> Ekstrak Teks Surat via AI</h4>
                       <p className="text-xs text-indigo-700">Gunakan asisten AI eksternal untuk mengekstrak teks dari foto/scan surat Anda, lalu salin hasilnya ke form ini.</p>
                    </div>
                    <a href="https://gemini.google.com/share/37c53e940950" target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition flex items-center gap-2 shrink-0">
                       <ExternalLink size={14}/> Buka Asisten AI
                    </a>
                  </div>
               )}

               <form id="arsipForm" onSubmit={handleSaveData} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* INPUT PERSURATAN */}
                  {activeTab === "persuratan" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nomor Surat</label>
                        <input type="text" required value={formData.nomorSurat || ''} onChange={e => setFormData({...formData, nomorSurat: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>{activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}</label>
                        <input type="text" required value={activeSuratTab === "masuk" ? formData.asalSurat || '' : formData.tujuanSurat || ''} onChange={e => setFormData({...formData, [activeSuratTab === "masuk" ? "asalSurat" : "tujuanSurat"]: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Tanggal Pembuatan</label>
                        <input type="date" value={formData.tglBuat || ''} onChange={e => setFormData({...formData, tglBuat: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>{activeSuratTab === "masuk" ? "Tanggal Diterima" : "Tanggal Dikirim"}</label>
                        <input type="date" value={activeSuratTab === "masuk" ? formData.tglDatang || '' : formData.tglKirim || ''} onChange={e => setFormData({...formData, [activeSuratTab === "masuk" ? "tglDatang" : "tglKirim"]: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Perihal / Hal</label>
                        <input type="text" value={formData.hal || ''} onChange={e => setFormData({...formData, hal: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Keterangan (Opsional)</label>
                        <input type="text" value={formData.ket || ''} onChange={e => setFormData({...formData, ket: e.target.value})} className={inputStandardClass} placeholder="Contoh: Sangat Penting, Segera..." />
                      </div>
                    </>
                  )}

                  {/* INPUT PROGRAM KERJA */}
                  {activeTab === "proker" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nama Program Kerja</label>
                        <input type="text" required value={formData.namaProker || ''} onChange={e => setFormData({...formData, namaProker: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Biro / Pelaksana</label>
                        <input type="text" required value={formData.pelaksanaProker || ''} onChange={e => setFormData({...formData, pelaksanaProker: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Waktu Pelaksanaan</label>
                        <input type="date" value={formData.waktuPelaksanaan || ''} onChange={e => setFormData({...formData, waktuPelaksanaan: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Tujuan Kegiatan</label>
                        <textarea rows="2" value={formData.tujuan || ''} onChange={e => setFormData({...formData, tujuan: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Indikator Keberhasilan</label>
                        <textarea rows="2" value={formData.indikator || ''} onChange={e => setFormData({...formData, indikator: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Sasaran</label>
                        <input type="text" value={formData.sasaran || ''} onChange={e => setFormData({...formData, sasaran: e.target.value})} className={inputStandardClass} placeholder="Misal: Kader Baru" />
                      </div>
                      <div>
                        <label className={labelStandardClass}>Penanggung Jawab</label>
                        <input type="text" value={formData.penanggungJawab || ''} onChange={e => setFormData({...formData, penanggungJawab: e.target.value})} className={inputStandardClass} placeholder="Nama Koordinator" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Estimasi Dana</label>
                        <input type="text" value={formData.estimasiDana || ''} onChange={e => setFormData({...formData, estimasiDana: e.target.value})} className={inputStandardClass} placeholder="Misal: Rp 1.500.000" />
                      </div>
                    </>
                  )}

                  {/* INPUT PRODUK HUKUM */}
                  {activeTab === "produkhukum" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nomor SK / Ketetapan</label>
                        <input type="text" required value={formData.nomorSK || ''} onChange={e => setFormData({...formData, nomorSK: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Tentang</label>
                        <textarea rows="2" required value={formData.tentangHukum || ''} onChange={e => setFormData({...formData, tentangHukum: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Deskripsi Singkat Hukum</label>
                        <textarea rows="2" value={formData.deskripsiHukum || ''} onChange={e => setFormData({...formData, deskripsiHukum: e.target.value})} className={inputStandardClass} />
                      </div>
                    </>
                  )}

                  {/* INPUT LPJ */}
                  {activeTab === "laporan" && (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Nama / Judul Laporan</label>
                        <input type="text" required value={formData.namaLaporan || ''} onChange={e => setFormData({...formData, namaLaporan: e.target.value})} className={inputStandardClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Periode Laporan</label>
                        <input type="text" value={formData.periode || ''} onChange={e => setFormData({...formData, periode: e.target.value})} className={inputStandardClass} placeholder="Misal: Tahun 2024" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStandardClass}>Deskripsi Singkat Laporan</label>
                        <textarea rows="2" value={formData.deskripsiLaporan || ''} onChange={e => setFormData({...formData, deskripsiLaporan: e.target.value})} className={inputStandardClass} />
                      </div>
                    </>
                  )}

                  {/* INPUT GLOBAL (LINK) */}
                  <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <label className={labelStandardClass}>Link File Arsip (G-Drive / PDF)</label>
                    <input type="url" value={formData.linkFile || ''} onChange={e => setFormData({...formData, linkFile: e.target.value})} className={`${inputStandardClass} font-mono text-xs`} placeholder="https://drive.google.com/..." />
                  </div>
               </form>
            </div>
            
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3 shrink-0">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition">Batal</button>
               <button type="submit" form="arsipForm" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-md shadow-sm transition flex items-center gap-2">
                  <Save size={16}/> Simpan Data
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}