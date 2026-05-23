"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, Download, FolderArchive, Mail, Briefcase, Scale, FileText, FileCheck, ExternalLink, Inbox, Send, ChevronLeft, ChevronRight, FileSpreadsheet, Building2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx"; 

export default function AdministrasiPage() {
  const [loading, setLoading] = useState(true);
  
  // ================= STATE RUANG KERJA (LEMBAGA) =================
  const [activeLembaga, setActiveLembaga] = useState("Komisariat"); 
  const [listLSO, setListLSO] = useState([]); 
  
  // State Data Master dari Firebase (Menyimpan seluruh data)
  const [masterSuratMasuk, setMasterSuratMasuk] = useState([]); 
  const [masterSuratKeluar, setMasterSuratKeluar] = useState([]); 
  const [masterProker, setMasterProker] = useState([]);
  const [masterProdukHukum, setMasterProdukHukum] = useState([]);
  const [masterLpj, setMasterLpj] = useState([]); 
  
  // State Navigasi & Filter
  const [activeTab, setActiveTab] = useState("persuratan"); 
  const [activeSuratTab, setActiveSuratTab] = useState("masuk"); 
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Tarik Data Administrasi
  useEffect(() => {
    async function fetchAdministrasiData() {
      setLoading(true);
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
        console.error("Gagal menarik database administrasi:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAdministrasiData();
  }, []); 

  // ================= HELPER: PENERJEMAH TANGGAL EXCEL/SISTEM =================
  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "-";
    
    // 1. Jika nilai berupa angka serial Excel (misal: 45304)
    if (!isNaN(dateVal) && Number(dateVal) > 20000) {
      const date = new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000));
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }
    
    // 2. Jika formatnya ISO System Date (misal: "2026-05-23T11:37:00.000Z")
    if (typeof dateVal === 'string' && dateVal.includes('T') && !isNaN(new Date(dateVal))) {
      const d = new Date(dateVal);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    // 3. Jika sudah format teks biasa (misal "12/01/2026"), biarkan saja
    return dateVal;
  };

  const filterByLembaga = (dataArray) => {
    return dataArray.filter(item => (item.lembaga || "Komisariat") === activeLembaga);
  };

  const currentSuratMasuk = filterByLembaga(masterSuratMasuk);
  const currentSuratKeluar = filterByLembaga(masterSuratKeluar);
  const currentProker = filterByLembaga(masterProker);
  const currentProdukHukum = filterByLembaga(masterProdukHukum);
  const currentLpj = filterByLembaga(masterLpj);

  // Logika Filter Pencarian Cerdas
  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    
    if (activeTab === "persuratan") {
      const targetData = activeSuratTab === "masuk" ? currentSuratMasuk : currentSuratKeluar;
      return targetData.filter(item => 
        (item.nomorSurat || "").toLowerCase().includes(q) ||
        (item.hal || item.perihalSurat || "").toLowerCase().includes(q) ||
        (item.asalSurat || item.tujuanSurat || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "proker") {
      return currentProker.filter(item => 
        (item.namaProker || "").toLowerCase().includes(q) ||
        (item.pelaksanaProker || "").toLowerCase().includes(q) ||
        (item.tujuan || "").toLowerCase().includes(q) ||
        (item.penanggungJawab || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "produkhukum") {
      return currentProdukHukum.filter(item => 
        (item.nomorSK || "").toLowerCase().includes(q) ||
        (item.tentangHukum || "").toLowerCase().includes(q) ||
        (item.deskripsiHukum || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "laporan") {
      return currentLpj.filter(item => 
        (item.namaLaporan || "").toLowerCase().includes(q) ||
        (item.periode || "").toLowerCase().includes(q) ||
        (item.deskripsiLaporan || "").toLowerCase().includes(q)
      );
    }
    return [];
  };

  const currentListData = getFilteredData();

  const handleTabChange = (tab) => { setActiveTab(tab); setSearchQuery(""); setCurrentPage(1); };
  const handleSuratTabChange = (tab) => { setActiveSuratTab(tab); setSearchQuery(""); setCurrentPage(1); };
  const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
  
  const handleLembagaChange = (e) => {
    setActiveLembaga(e.target.value);
    setActiveTab("persuratan");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(currentListData.length / ITEMS_PER_PAGE);
  const paginatedSuratData = activeTab === "persuratan" 
    ? currentListData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) 
    : currentListData;

  // ================= EXPORT EXCEL (Dengan Tanggal yang Diforrmat) =================
  const handleExportExcel = () => {
    if (currentListData.length === 0) return alert("Tidak ada data arsip untuk diekspor!");
    
    let formattedData = [];
    if (activeTab === "persuratan") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1,
        "Nomor Surat": item.nomorSurat || "-",
        [activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"]: activeSuratTab === "masuk" ? (item.asalSurat||"-") : (item.tujuanSurat||"-"),
        "Tanggal Buat": formatDisplayDate(item.tglBuat),
        [activeSuratTab === "masuk" ? "Tanggal Datang" : "Tanggal Kirim"]: activeSuratTab === "masuk" ? formatDisplayDate(item.tglDatang) : formatDisplayDate(item.tglKirim),
        "Perihal": item.hal || item.perihalSurat || "-",
        "Keterangan": item.ket || item.deskripsiSurat || "-",
        "Link Berkas": item.linkFile || "Tidak Ada"
      }));
    } else if (activeTab === "proker") {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1,
        "Biro/Pelaksana": item.pelaksanaProker || "-",
        "Nama Kegiatan": item.namaProker || "-",
        "Tujuan": item.tujuan || "-",
        "Indikator": item.indikator || "-",
        "Sasaran": item.sasaran || "-",
        "Waktu Pelaksanaan": formatDisplayDate(item.waktuPelaksanaan),
        "Penanggung Jawab": item.penanggungJawab || "-",
        "Estimasi Dana": item.estimasiDana || "-"
      }));
    } else {
      formattedData = currentListData.map((item, idx) => ({
        "No": idx + 1,
        "Judul/Ketetapan": item.tentangHukum || item.namaLaporan || "-",
        "Nomor/Periode": item.nomorSK || item.periode || "-",
        "Deskripsi Singkat": item.deskripsiHukum || item.deskripsiLaporan || "-"
      }));
    }

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Arsip");
    XLSX.writeFile(wb, `Rekap_${activeTab}_${activeLembaga.toUpperCase()}_${Date.now()}.xlsx`);
  };

  if (loading) return <LoadingScreen text={`Memuat Bank Data Arsip`} />;

  const DocumentCard = ({ item, isHukum }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
      <div className="relative w-full pt-[141.4%] bg-slate-100 border-b border-slate-200 overflow-hidden">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-200"><FileText size={48} className="mb-2 drop-shadow-sm" /><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pratinjau PDF</span></div>
        )}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md shadow-sm border border-slate-100/50"><span className={`text-[9px] font-black uppercase tracking-widest ${isHukum ? 'text-purple-600' : 'text-amber-600'}`}>{isHukum ? 'Produk Hukum' : 'Laporan'}</span></div>
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
           {item.linkFile ? (<a href={item.linkFile} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-blue-600 text-white p-4 rounded-full hover:scale-110 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/30"><Download size={24} /></a>) : (<span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-full text-xs font-bold">File Kosong</span>)}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow bg-white">
         <span className="text-[10px] font-mono font-bold text-slate-400 mb-1.5 line-clamp-1">{isHukum ? (item.nomorSK || "Tanpa Nomor") : (item.periode || "Tanpa Periode")}</span>
         <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{isHukum ? (item.tentangHukum || "Dokumen Hukum") : (item.namaLaporan || "Laporan Kepengurusan")}</h3>
         <p className="text-xs text-slate-500 line-clamp-2 mt-auto">{isHukum ? (item.deskripsiHukum || "-") : (item.deskripsiLaporan || "-")}</p>
      </div>
    </motion.div>
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 w-full overflow-x-hidden flex flex-col">
      <Navbar />

      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-5 bg-[#0f172a] text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay"><div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.span initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-purple-400 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-5 inline-flex items-center justify-center gap-2 w-max mx-auto backdrop-blur-sm"><FolderArchive size={14} /></motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">Pusat <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Administrasi</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-300 text-sm md:text-lg font-light max-w-2xl mx-auto leading-relaxed">Satu pintu untuk mengakses arsip persuratan, transparansi program kerja divisi, produk hukum, hingga rekapitulasi laporan pertanggungjawaban.</motion.p>
        </div>
      </section>

      <section className="px-5 max-w-7xl mx-auto w-full -mt-10 md:-mt-12 relative z-20 space-y-4">
        
        <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100 flex items-center justify-between relative z-30">
           <div className="flex items-center gap-3 w-full">
               <div className="bg-blue-100 p-2 rounded-lg text-blue-600 hidden sm:flex">
                   <Building2 size={20} />
               </div>
               <div className="flex-grow">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-0.5">Ruang Kerja / Lembaga</p>
                   <select
                     value={activeLembaga}
                     onChange={handleLembagaChange}
                     className="w-full text-sm sm:text-base font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                   >
                      <option value="Komisariat">Administrasi Komisariat</option>
                      <option value="KOPRI">Administrasi KOPRI</option>
                      {listLSO.map((lso, index) => (
                          <option key={index} value={lso}>Administrasi {lso}</option>
                      ))}
                   </select>
               </div>
           </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex flex-row gap-1 shadow-xl backdrop-blur-md overflow-x-auto whitespace-nowrap scrollbar-none w-full">
          <button onClick={() => handleTabChange("persuratan")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "persuratan" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><Mail size={16} /> Arsip Persuratan</button>
          <button onClick={() => handleTabChange("proker")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "proker" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><Briefcase size={16} /> Program Kerja</button>
          <button onClick={() => handleTabChange("produkhukum")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "produkhukum" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><Scale size={16} /> Produk Hukum / SK</button>
          <button onClick={() => handleTabChange("laporan")} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "laporan" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}><FileCheck size={16} /> Laporan Kepengurusan</button>
        </div>

        <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100 flex items-center relative">
          <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder={activeTab === "persuratan" ? "Cari nomor surat, perihal, atau tujuan/asal..." : activeTab === "proker" ? "Cari nama program kerja atau divisi pelaksana..." : activeTab === "produkhukum" ? "Cari nomor SK atau tentang ketetapan..." : "Cari judul laporan atau periode..."} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
          <Search className="absolute left-7 h-5 w-5 text-slate-400" />
        </div>
      </section>

      <section className="pb-24 px-5 max-w-7xl mx-auto w-full flex-grow mt-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <p className="text-xs font-bold text-slate-400 px-1 flex-1">
            Kategori: <span className="text-blue-600 uppercase tracking-wider">{activeTab}</span> 
            {activeTab !== "persuratan" && ` (${currentListData.length} Data)`}
            {activeTab === "persuratan" && ` (Total ${currentListData.length} Surat)`}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {activeTab === "persuratan" && (
              <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto shadow-inner">
                <button onClick={() => handleSuratTabChange("masuk")} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeSuratTab === "masuk" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Inbox size={14} /> Surat Masuk ({currentSuratMasuk.length})</button>
                <button onClick={() => handleSuratTabChange("keluar")} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeSuratTab === "keluar" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Send size={14} /> Surat Keluar ({currentSuratKeluar.length})</button>
              </div>
            )}
            
            <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm self-start sm:self-auto">
              <FileSpreadsheet size={14} /> Export ke Excel
            </button>
          </div>
        </div>

        {currentListData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm mt-4">
             <FileText className="w-14 h-14 text-slate-300 mx-auto mb-3" />
             <h3 className="font-bold text-slate-700 text-lg">Dokumen Belum Tersedia</h3>
             <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">Admin belum mengunggah berkas untuk kategori ini di ruang kerja <b>{activeLembaga}</b>, atau kata kunci pencarian Anda tidak ditemukan.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${activeLembaga}-${activeTab}-${activeSuratTab}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full">
              
              {/* ================= SUB 1: PERSURATAN ================= */}
              {activeTab === "persuratan" && (
                <div className="bg-white border border-amber-300 rounded-xl shadow-md overflow-hidden flex flex-col">
                  
                  <div className="bg-amber-50 px-4 py-3 border-b border-amber-300 flex items-center justify-between">
                    <h3 className="font-black text-amber-800 uppercase tracking-wide text-sm underline underline-offset-4">
                      {activeSuratTab === "masuk" ? "BUKU AGENDA SURAT MASUK" : "BUKU AGENDA SURAT KELUAR"}
                    </h3>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-200/50 px-2 py-1 rounded">Hal. {currentPage} / {totalPages || 1}</span>
                  </div>

                  <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead className="bg-amber-500 text-white text-[11px] uppercase tracking-wider text-center">
                        <tr>
                          <th rowSpan={2} className="py-2 px-3 w-10 font-bold border border-amber-600">No</th>
                          <th rowSpan={2} className="py-2 px-4 w-64 whitespace-nowrap font-bold border border-amber-600">No. Surat</th>
                          <th rowSpan={2} className="py-2 px-4 w-64 font-bold border border-amber-600">
                            {activeSuratTab === "masuk" ? "Asal Surat" : "Tujuan Surat"}
                          </th>
                          <th colSpan={2} className="py-1.5 border border-amber-600 font-bold">Tgl Surat</th>
                          <th rowSpan={2} className="py-2 px-4 w-auto font-bold border border-amber-600">Hal</th>
                          <th rowSpan={2} className="py-2 px-4 w-64 font-bold border border-amber-600">Ket</th>
                          <th rowSpan={2} className="py-2 px-3 w-20 font-bold border border-amber-600 bg-amber-600">Berkas</th>
                        </tr>
                        <tr>
                          <th className="py-1.5 px-3 w-24 font-bold border border-amber-600 bg-amber-500/90">Buat</th>
                          <th className="py-1.5 px-3 w-24 font-bold border border-amber-600 bg-amber-500/90">{activeSuratTab === "masuk" ? "Datang" : "Kirim"}</th>
                        </tr>
                    </thead>
                      
                      <tbody className="divide-y divide-amber-200 text-sm bg-white">
                        {paginatedSuratData.map((doc, index) => {
                          const realNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                          return (
                            <tr key={index} className="hover:bg-amber-50 transition-colors">
                              <td className="py-1.5 px-3 text-center border-r border-amber-200 font-bold text-slate-500">{realNumber}</td>
                              <td className="py-1.5 px-4 border-r border-amber-200 whitespace-nowrap">
                                <span className="font-mono text-[11px] md:text-xs font-bold text-slate-800">{doc.nomorSurat || "-"}</span>
                              </td>
                              <td className="py-1.5 px-4 border-r border-amber-200 text-xs font-semibold text-slate-700 leading-snug">{activeSuratTab === "masuk" ? (doc.asalSurat || "-") : (doc.tujuanSurat || "-")}</td>
                              
                              {/* PERUBAHAN: TANGGAL DIPARSING DENGAN HELPER AGAR TIDAK MUNCUL ANGKA ANEH */}
                              <td className="py-1.5 px-3 border-r border-amber-200 text-[11px] text-center text-slate-600 font-mono whitespace-nowrap">{formatDisplayDate(doc.tglBuat)}</td>
                              <td className="py-1.5 px-3 border-r border-amber-200 text-[11px] text-center text-slate-600 font-mono whitespace-nowrap">{activeSuratTab === "masuk" ? formatDisplayDate(doc.tglDatang) : formatDisplayDate(doc.tglKirim)}</td>
                              
                              <td className="py-1.5 px-4 border-r border-amber-200">
                                <div className="font-bold text-slate-800 text-xs leading-snug w-48">{doc.hal || doc.perihalSurat || "-"}</div>
                              </td>
                              <td className="py-1.5 px-4 border-r border-amber-200">
                                <div className="text-slate-500 text-[11px] leading-snug">{doc.ket || doc.deskripsiSurat || "-"}</div>
                              </td>
                              <td className="py-1.5 px-3 text-center">
                                {doc.linkFile ? (
                                  <a href={doc.linkFile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 w-full bg-slate-900 hover:bg-amber-600 text-white font-bold px-2 py-1.5 rounded text-[10px] uppercase tracking-wider transition-colors"><Download size={12} /> Buka</a>
                                ) : (
                                  <span className="text-slate-400 bg-slate-100 px-2 py-1.5 rounded text-[10px] uppercase tracking-wider block text-center font-bold">Kosong</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="bg-amber-50 border-t border-amber-200 p-3 flex justify-center items-center gap-2">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-md bg-white border border-amber-300 text-amber-700 hover:bg-amber-200 disabled:opacity-50 transition"><ChevronLeft size={16}/></button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                        <button 
                          key={num} onClick={() => setCurrentPage(num)} 
                          className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${currentPage === num ? 'bg-amber-500 text-white shadow-sm border border-amber-600' : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-200'}`}
                        >
                          {num}
                        </button>
                      ))}

                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-md bg-white border border-amber-300 text-amber-700 hover:bg-amber-200 disabled:opacity-50 transition"><ChevronRight size={16}/></button>
                    </div>
                  )}
                </div>
              )}

              {/* ================= SUB 2: PROGRAM KERJA ================= */}
              {activeTab === "proker" && (
                <div className="space-y-8">
                  {(() => {
                    const groupedProker = currentListData.reduce((acc, curr) => {
                      const biro = curr.pelaksanaProker || "Biro / LSO Umum";
                      if (!acc[biro]) acc[biro] = [];
                      acc[biro].push(curr);
                      return acc;
                    }, {});

                    return Object.keys(groupedProker).map((biroName, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-emerald-600 px-5 py-3.5 text-white flex items-center gap-2">
                          <Briefcase size={18} />
                          <h3 className="font-bold text-sm uppercase tracking-wider">{biroName}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[1250px]">
                            <thead className="bg-emerald-50 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider">
                              <tr>
                                <th className="py-3 px-3 border-r border-slate-200 w-12 text-center font-bold">No</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-48 text-center font-bold">Nama Kegiatan</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-48 text-center font-bold">Tujuan</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-40 text-center font-bold">Indikator</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-32 text-center font-bold">Sasaran</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-36 text-center font-bold">Waktu Pelaksanaan</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-36 text-center font-bold">Penanggung Jawab</th>
                                <th className="py-3 px-4 border-r border-slate-200 text-center font-bold">Estimasi Dana</th>
                                <th className="py-3 px-4 font-bold text-center w-24">Berkas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                              {groupedProker[biroName].map((doc, docIdx) => (
                                <tr key={docIdx} className="hover:bg-emerald-50/30 transition-colors">
                                  <td className="py-3 px-3 border-r border-slate-100 text-center font-bold text-slate-400">{docIdx + 1}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-800 text-xs leading-relaxed">{doc.namaProker || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 text-slate-600 text-xs leading-relaxed">{doc.tujuan || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 text-slate-600 text-xs leading-relaxed">{doc.indikator || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 text-slate-600 text-xs leading-relaxed">{doc.sasaran || "-"}</td>
                                  {/* TANGGAL WAKTU PROKER JUGA DIPARSING */}
                                  <td className="py-3 px-4 border-r border-slate-100 text-slate-600 text-xs leading-relaxed">{formatDisplayDate(doc.waktuPelaksanaan)}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 font-semibold text-emerald-700 text-xs leading-relaxed">{doc.penanggungJawab || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 text-center font-mono text-xs font-bold text-slate-700 bg-slate-50/50">{doc.estimasiDana || "-"}</td>
                                  <td className="py-3 px-4 text-center">
                                    {doc.linkFile ? (
                                      <a href={doc.linkFile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 w-full bg-emerald-100 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold px-3 py-1.5 rounded-lg transition text-[10px] uppercase tracking-wider shadow-sm">
                                        <ExternalLink size={12} /> Buka
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider block text-center font-bold">Kosong</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* ================= SUB 3: PRODUK HUKUM ================= */}
              {activeTab === "produkhukum" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                   {currentListData.map((doc, index) => <DocumentCard key={index} item={doc} isHukum={true} />)}
                </div>
              )}

              {/* ================= SUB 4: LAPORAN KEPENGURUSAN ================= */}
              {activeTab === "laporan" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                   {currentListData.map((doc, index) => <DocumentCard key={index} item={doc} isHukum={false} />)}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </section>

      <Footer />
    </main>
  );
}