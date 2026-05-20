"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, Download, FolderArchive, Mail, Briefcase, Scale, FileText, FileCheck, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function AdministrasiPage() {
  const [loading, setLoading] = useState(true);
  
  // State Data per Kategori Sub-Halaman
  const [suratData, setSuratData] = useState([]);
  const [prokerData, setProkerData] = useState([]);
  const [produkHukumData, setProdukHukumData] = useState([]);
  const [lpjData, setLpjData] = useState([]); 
  
  // State Navigasi Sub-Halaman (Tabs)
  const [activeTab, setActiveTab] = useState("persuratan"); 
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchAdministrasiData() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSuratData(data.listDokumen || []); 
          setProkerData(data.listProker || []);   
          setProdukHukumData(data.listProdukHukum || []); 
          setLpjData(data.listLpj || []); 
        }
      } catch (error) {
        console.error("Gagal menarik database administrasi:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAdministrasiData();
  }, []);

  // Logika Filter Pencarian Cerdas (DISINKRONKAN DENGAN FIELD ADMIN TERBARU)
  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    
    if (activeTab === "persuratan") {
      return suratData.filter(item => 
        (item.perihalSurat || "").toLowerCase().includes(q) ||
        (item.nomorSurat || "").toLowerCase().includes(q) ||
        (item.deskripsiSurat || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "proker") {
      return prokerData.filter(item => 
        (item.namaProker || "").toLowerCase().includes(q) ||
        (item.pelaksanaProker || "").toLowerCase().includes(q) ||
        (item.tujuan || "").toLowerCase().includes(q) ||
        (item.penanggungJawab || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "produkhukum") {
      return produkHukumData.filter(item => 
        (item.nomorSK || "").toLowerCase().includes(q) ||
        (item.tentangHukum || "").toLowerCase().includes(q) ||
        (item.deskripsiHukum || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "laporan") {
      return lpjData.filter(item => 
        (item.namaLaporan || "").toLowerCase().includes(q) ||
        (item.periode || "").toLowerCase().includes(q) ||
        (item.deskripsiLaporan || "").toLowerCase().includes(q)
      );
    }
    return [];
  };

  const currentListData = getFilteredData();

  if (loading) return <LoadingScreen text="Memuat Bank Data Arsip" />;

  // Komponen Kartu Dokumen PDF (Digunakan untuk Produk Hukum & LPJ)
  const DocumentCard = ({ item, isHukum }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
    >
      {/* Area Preview Cover (Proporsi Kertas A4: padding-top 141.4%) */}
      <div className="relative w-full pt-[141.4%] bg-slate-100 border-b border-slate-200 overflow-hidden">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-200">
            <FileText size={48} className="mb-2 drop-shadow-sm" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pratinjau PDF</span>
          </div>
        )}
        
        {/* Label Badge di Pojok Kiri Atas */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md shadow-sm border border-slate-100/50">
           <span className={`text-[9px] font-black uppercase tracking-widest ${isHukum ? 'text-purple-600' : 'text-amber-600'}`}>
             {isHukum ? 'Produk Hukum' : 'Laporan'}
           </span>
        </div>

        {/* Overlay Tombol Download (Muncul saat di-hover) */}
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
           {item.linkFile ? (
             <a href={item.linkFile} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-blue-600 text-white p-4 rounded-full hover:scale-110 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/30">
                <Download size={24} />
             </a>
           ) : (
             <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-full text-xs font-bold">File Kosong</span>
           )}
        </div>
      </div>

      {/* Area Detail Judul & Keterangan */}
      <div className="p-4 flex flex-col flex-grow bg-white">
         <span className="text-[10px] font-mono font-bold text-slate-400 mb-1.5 line-clamp-1">
           {isHukum ? (item.nomorSK || "Tanpa Nomor") : (item.periode || "Tanpa Periode")}
         </span>
         <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
           {isHukum ? (item.tentangHukum || "Dokumen Hukum") : (item.namaLaporan || "Laporan Kepengurusan")}
         </h3>
         <p className="text-xs text-slate-500 line-clamp-2 mt-auto">
           {isHukum ? (item.deskripsiHukum || "-") : (item.deskripsiLaporan || "-")}
         </p>
      </div>
    </motion.div>
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 w-full overflow-x-hidden flex flex-col">
      <Navbar />

      {/* ================= 1. BANNER HERO ================= */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-5 bg-[#0f172a] text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay"><div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.span initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-purple-400 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-5 inline-flex items-center justify-center gap-2 w-max mx-auto backdrop-blur-sm">
            <FolderArchive size={14} />
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Pusat <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Administrasi</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-300 text-sm md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Satu pintu untuk mengakses arsip persuratan, transparansi program kerja divisi, produk hukum, hingga rekapitulasi laporan pertanggungjawaban.
          </motion.p>
        </div>
      </section>

      {/* ================= 2. MENU SUB-HALAMAN (4 TABS) ================= */}
      <section className="px-5 max-w-7xl mx-auto w-full -mt-10 md:-mt-12 relative z-20 space-y-4">
        
        <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex flex-row gap-1 shadow-xl backdrop-blur-md overflow-x-auto whitespace-nowrap scrollbar-none w-full">
          <button 
            onClick={() => { setActiveTab("persuratan"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "persuratan" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            <Mail size={16} /> Arsip Persuratan
          </button>
          <button 
            onClick={() => { setActiveTab("proker"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "proker" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            <Briefcase size={16} /> Program Kerja
          </button>
          <button 
            onClick={() => { setActiveTab("produkhukum"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "produkhukum" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            <Scale size={16} /> Produk Hukum / SK
          </button>
          <button 
            onClick={() => { setActiveTab("laporan"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "laporan" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            <FileCheck size={16} /> Laporan Kepengurusan
          </button>
        </div>

        <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100 flex items-center relative">
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "persuratan" ? "Cari nomor surat atau perihal..." : 
              activeTab === "proker" ? "Cari nama program kerja atau divisi pelaksana..." : 
              activeTab === "produkhukum" ? "Cari nomor SK atau tentang ketetapan..." :
              "Cari judul laporan atau periode..."
            }
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
          <Search className="absolute left-7 h-5 w-5 text-slate-400" />
        </div>
      </section>

      {/* ================= 3. AREA KONTEN DINAMIS SUB-HALAMAN ================= */}
      <section className="pb-24 px-5 max-w-7xl mx-auto w-full flex-grow mt-6">
        
        <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <p>Kategori: <span className="text-blue-600 uppercase tracking-wider">{activeTab}</span> ({currentListData.length} Data)</p>
        </div>

        {currentListData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
             <FileText className="w-14 h-14 text-slate-300 mx-auto mb-3" />
             <h3 className="font-bold text-slate-700 text-lg">Dokumen Belum Tersedia</h3>
             <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">Admin belum mengunggah berkas untuk kategori ini, atau kata kunci pencarian Anda tidak ditemukan.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="w-full"
            >
              
              {/* ================= SUB 1: PERSURATAN (Tabel Kompak) ================= */}
              {activeTab === "persuratan" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center font-bold">No</th>
                          <th className="py-3 px-4 w-1/4 font-bold">Nomor Surat</th>
                          <th className="py-3 px-4 w-1/4 font-bold">Perihal</th>
                          <th className="py-3 px-4 w-auto font-bold">Deskripsi</th>
                          <th className="py-3 px-4 w-32 text-center font-bold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {currentListData.map((doc, index) => (
                          <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                            <td className="py-2.5 px-4 text-center font-bold text-slate-400">{index + 1}</td>
                            <td className="py-2.5 px-4"><span className="font-mono text-xs font-bold text-blue-700 block truncate max-w-[280px]">{doc.nomorSurat || "-"}</span></td>
                            <td className="py-2.5 px-4 font-bold text-slate-800 text-sm">{doc.perihalSurat || "Tanpa Perihal"}</td>
                            <td className="py-2.5 px-4 text-slate-500 text-xs leading-snug line-clamp-2 max-w-sm">{doc.deskripsiSurat || "-"}</td>
                            <td className="py-2.5 px-4 text-center">
                              {doc.linkFile ? (
                                <a href={doc.linkFile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 w-full bg-slate-900 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg transition text-[11px] uppercase tracking-wider"><Download size={12} /> Unduh</a>
                              ) : (
                                <span className="text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider block text-center font-bold">Kosong</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================= SUB 2: PROGRAM KERJA (Tabel Per Biro) ================= */}
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
                                <th className="py-3 px-4 border-r border-slate-200 w-48 font-bold">Nama Kegiatan</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-48 font-bold">Tujuan</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-40 font-bold">Indikator</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-32 font-bold">Sasaran</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-36 font-bold">Waktu Pelaksanaan</th>
                                <th className="py-3 px-4 border-r border-slate-200 w-36 font-bold">Penanggung Jawab</th>
                                <th className="py-3 px-4 border-r border-slate-200 text-center font-bold">Estimasi Dana</th>
                                {/* TAMBAHAN KOLOM BERKAS */}
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
                                  <td className="py-3 px-4 border-r border-slate-100 text-slate-600 text-xs leading-relaxed">{doc.waktuPelaksanaan || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 font-semibold text-emerald-700 text-xs leading-relaxed">{doc.penanggungJawab || "-"}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 text-center font-mono text-xs font-bold text-slate-700 bg-slate-50/50">{doc.estimasiDana || "-"}</td>
                                  
                                  {/* TOMBOL UNDUH BERKAS CLOUDINARY (PROPOSAL/LPJ) */}
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

              {/* ================= SUB 3: PRODUK HUKUM (Grid Folder/File Explorer) ================= */}
              {activeTab === "produkhukum" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                   {currentListData.map((doc, index) => (
                      <DocumentCard key={index} item={doc} isHukum={true} />
                   ))}
                </div>
              )}

              {/* ================= SUB 4: LAPORAN KEPENGURUSAN (Grid Folder/File Explorer) ================= */}
              {activeTab === "laporan" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                   {currentListData.map((doc, index) => (
                      <DocumentCard key={index} item={doc} isHukum={false} />
                   ))}
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