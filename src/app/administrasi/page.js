"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, Download, FolderArchive, Hash, Mail } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function AdministrasiPage() {
  const [loading, setLoading] = useState(true);
  const [dokumenData, setDokumenData] = useState([]);
  
  // State Search (Hanya Search karena Kategori sudah diganti Nomor Surat)
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchDokumen() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listDokumen) {
          setDokumenData(docSnap.data().listDokumen);
        }
      } catch (error) {
        console.error("Gagal menarik data dokumen:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDokumen();
  }, []);

  // Logika Pencarian (Mencari berdasarkan Perihal, Nomor Surat, atau Deskripsi)
  const filteredData = dokumenData.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchPerihal = (item.perihalSurat || "").toLowerCase().includes(q);
    const matchNomor = (item.nomorSurat || "").toLowerCase().includes(q);
    const matchDeskripsi = (item.deskripsiSurat || "").toLowerCase().includes(q);
    return matchPerihal || matchNomor || matchDeskripsi;
  });

  if (loading) return <LoadingScreen text="Memuat Bank Data" />;

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 w-full overflow-x-hidden flex flex-col">
      <Navbar />

      {/* ================= 1. BANNER HERO ================= */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-5 bg-[#0f172a] text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay"><div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-purple-400 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-5 inline-block flex items-center justify-center gap-2 w-max mx-auto backdrop-blur-sm"
          >
            <FolderArchive size={14} />
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight"
          >
            Pusat <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Administrasi</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 text-sm md:text-lg font-light max-w-2xl mx-auto leading-relaxed"
          >
            Akses dan pantau arsip penomoran surat serta berkas-berkas persuratan PMII Komisariat secara transparan, rapi, dan sistematis.
          </motion.p>
        </div>
      </section>

      {/* ================= 2. KONTROL PENCARIAN ================= */}
      <section className="py-8 px-5 max-w-5xl mx-auto w-full -mt-10 md:-mt-12 relative z-20">
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
          <div className="relative w-full">
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Nomor Surat atau Perihal..."
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          </div>
        </div>
      </section>

      {/* ================= 3. GRID DAFTAR SURAT ================= */}
      <section className="pb-24 px-5 max-w-5xl mx-auto w-full flex-grow">
        
        <div className="mb-6 flex items-center justify-between text-xs font-bold text-slate-400">
          <p>Ditemukan <span className="text-blue-600">{filteredData.length}</span> Arsip Surat</p>
        </div>

        {filteredData.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
             <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
             <h3 className="font-extrabold text-slate-800 text-xl mb-2">Surat Tidak Ditemukan</h3>
             <p className="text-sm text-slate-500 max-w-md mx-auto">Coba gunakan nomor surat atau perihal yang berbeda pada kolom pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {filteredData.map((doc, index) => (
              <motion.div 
                key={doc.id || index}
                initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group"
              >
                {/* Header Kartu: Nomor Surat */}
                <div className="flex items-start justify-between gap-4 mb-4 border-b border-slate-50 pb-4">
                   <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                     <Mail size={22} />
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                       Nomor Surat
                     </span>
                     <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg max-w-[150px] sm:max-w-[200px] truncate">
                       {doc.nomorSurat || "-"}
                     </span>
                   </div>
                </div>
                
                {/* Body Kartu: Perihal & Deskripsi */}
                <h3 className="text-lg font-extrabold text-slate-800 mb-2 leading-snug line-clamp-2">
                  {doc.perihalSurat || "Tanpa Perihal"}
                </h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed flex-grow">
                  {doc.deskripsiSurat || "Tidak ada deskripsi tambahan untuk surat ini."}
                </p>

                {/* Footer Kartu: Tombol Unduh */}
                <div className="pt-4 mt-auto">
                  {doc.linkFile ? (
                    <a 
                      href={doc.linkFile} target="_blank" rel="noopener noreferrer"
                      className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
                    >
                      <Download size={16} /> Lihat / Unduh File
                    </a>
                  ) : (
                    <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                      File Belum Diunggah
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}