"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, Trophy, Award, BookOpen, ExternalLink, Calendar, Medal, Share2, Sparkles, FileText } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function ApresiasiClient() {
  const [loading, setLoading] = useState(true);
  const [kaderData, setKaderData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKader, setActiveKader] = useState(null); 
  const [activeTab, setActiveTab] = useState("akademik"); 

  useEffect(() => {
    async function fetchApresiasi() {
      try {
        const docRef = doc(db, "website_config", "database_apresiasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listApresiasi) {
          const dataValid = docSnap.data().listApresiasi.filter(k => k.prestasi && k.prestasi.length > 0);
          setKaderData(dataValid);

          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const sharedKaderName = params.get('kader');
            if (sharedKaderName) {
              const foundKader = dataValid.find(k => k.namaLengkap === sharedKaderName);
              if (foundKader) {
                setActiveKader(foundKader);
              }
            }
          }
        }
      } catch (error) {
        console.error("Gagal menarik data apresiasi:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchApresiasi();
  }, []);

  const processedData = kaderData
    .map(kader => {
      const filteredPrestasi = kader.prestasi.filter(p => (p.tipe || "").toLowerCase() === activeTab);
      return { ...kader, filteredPrestasi };
    })
    .filter(kader => kader.filteredPrestasi.length > 0)
    .filter(item => 
      (item.namaLengkap || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.filteredPrestasi.some(p => (p.judul || "").toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => b.filteredPrestasi.length - a.filteredPrestasi.length);

  const handleShare = async (kader) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?kader=${encodeURIComponent(kader.namaLengkap)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rekam Jejak ${kader.namaLengkap} - PMII`,
          text: `Lihat profil pencapaian akademik, perlombaan, dan kaderisasi dari sahabat/i ${kader.namaLengkap} di Hall of Fame PMII!`,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Dibatalkan atau gagal membagikan", error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link berhasil disalin ke clipboard!");
    }
  };

  if (loading) return <LoadingScreen text="Memuat Galeri Apresiasi" />;

  return (
    <main className="min-h-screen bg-[#f1f5f9] font-sans text-slate-800 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 md:pt-36 pb-20 md:pb-28 px-5 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-400">Hall of Fame PMII</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-black text-white mb-5 tracking-tight">
            Apresiasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">Kader</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-300 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Pusat galeri pencapaian prestasi dan rekam jejak kaderisasi sahabat/i PMII Komisariat. Ruang apresiasi untuk mereka yang terus berproses dan menghidupkan nilai intelektualitas.
          </motion.p>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="px-4 max-w-7xl mx-auto w-full -mt-12 md:-mt-14 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl p-3 md:p-4 rounded-3xl shadow-xl border border-white flex flex-col md:flex-row items-center gap-4 mb-10">
          <div className="relative w-full">
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kader, judul jurnal, atau status kaderisasi..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>
          
          <div className="flex w-full md:w-auto bg-slate-100/50 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab("akademik")} 
              className={`flex-1 md:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "akademik" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              <BookOpen size={18}/> <span className="hidden sm:inline">Akad & Kaderisasi</span><span className="sm:hidden">Akademik</span>
            </button>
            <button 
              onClick={() => setActiveTab("non-akademik")} 
              className={`flex-1 md:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "non-akademik" ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              <Award size={18}/> <span className="hidden sm:inline">Lomba & Non-Akad</span><span className="sm:hidden">Non-Akad</span>
            </button>
          </div>
        </div>
      </section>

      {/* Grid Profil */}
      <section className="pb-16 px-4 max-w-7xl mx-auto w-full flex-grow">
        {processedData.length === 0 ? (
           <div className="text-center text-slate-400 py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
             <Trophy size={56} className="mx-auto mb-4 opacity-30 text-slate-300"/>
             <p className="font-medium text-slate-500">Belum ada rekam data {activeTab === 'akademik' ? 'Akademik/Kaderisasi' : 'Lomba/Kejuaraan'} ditemukan.</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {processedData.map((kader, idx) => {
              const highlight = kader.filteredPrestasi[0];
              const isAkademik = activeTab === "akademik";

              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer" onClick={() => setActiveKader(kader)}>
                   
                   {/* Banner Atas Kartu */}
                   <div className={`h-16 w-full relative ${isAkademik ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`}>
                      <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-white text-[10px] font-bold">
                        <Trophy size={12} /> {kader.filteredPrestasi.length}
                      </div>
                   </div>

                   {/* Foto Profil */}
                   <div className="relative px-4 flex justify-center -mt-10 mb-2">
                      <div className="w-20 h-20 bg-white rounded-full p-1 shadow-md">
                        {kader.fotoKader ? (
                          <img src={kader.fotoKader} alt={kader.namaLengkap} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center"><Trophy size={28} className="text-slate-300"/></div>
                        )}
                      </div>
                   </div>

                   <div className="px-4 text-center mb-4">
                      <h3 className="font-extrabold text-slate-800 text-sm md:text-base leading-snug line-clamp-2">{kader.namaLengkap}</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded-md">{kader.asalRayon || "Kader PMII"}</p>
                   </div>

                   <div className="px-4 pb-5 flex flex-col flex-grow text-center">
                      <div className="w-8 h-1 bg-slate-100 mx-auto rounded-full mb-3"></div>
                      <h4 className="font-bold text-slate-700 text-xs md:text-sm leading-tight line-clamp-2 mb-1">{highlight.judul}</h4>
                      <p className="text-[10px] md:text-xs font-bold text-blue-600 line-clamp-1 mb-3">{highlight.pencapaian}</p>
                      
                      <div className="mt-auto flex justify-center gap-2">
                        <span className={`text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-md ${isAkademik ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {highlight.tingkat || "Lokal"}
                        </span>
                        <span className="text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-md bg-slate-50 text-slate-500">
                          {highlight.tahun || "-"}
                        </span>
                      </div>
                   </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* MODAL DETAIL KADER */}
      <AnimatePresence>
        {activeKader && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveKader(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#f8fafc] rounded-3xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="bg-white p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 relative border-b border-slate-100 z-20">
                 <div className="flex items-center gap-4">
                   <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-50 shadow-sm overflow-hidden shrink-0">
                     {activeKader.fotoKader ? <img src={activeKader.fotoKader} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Trophy size={24} className="text-slate-400"/></div>}
                   </div>
                   <div>
                     <h2 className="text-lg md:text-2xl font-extrabold text-slate-800">{activeKader.namaLengkap}</h2>
                     <p className="text-amber-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-1">{activeKader.asalRayon}</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-2 sm:ml-auto mt-2 sm:mt-0">
                    <button onClick={() => handleShare(activeKader)} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl transition flex-1 sm:flex-none">
                      <Share2 size={16} /> Bagikan
                    </button>
                    <button onClick={() => setActiveKader(null)} className="bg-red-50 hover:bg-red-500 hover:text-white text-red-500 p-2.5 rounded-xl transition">
                      <span className="sr-only">Tutup</span>✕
                    </button>
                 </div>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
                 <div className="flex items-center justify-between mb-2 px-1">
                   <h4 className="font-bold text-slate-700 text-sm md:text-base">Detail Rekam Jejak</h4>
                   <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black">{activeKader.prestasi.length} Total</span>
                 </div>

                 {activeKader.prestasi.map((p, idx) => {
                   const isAkad = p.tipe === 'akademik';
                   
                   // Deteksi Cerdas: Apakah linkOrFoto berisi Gambar atau Tautan Biasa (Google Drive dll)?
                   const hasMedia = p.linkOrFoto && p.linkOrFoto.trim() !== "";
                   const isImage = hasMedia && (p.linkOrFoto.match(/\.(jpeg|jpg|gif|png|webp)$/i) || p.linkOrFoto.includes("res.cloudinary.com") || p.linkOrFoto.includes("ibb.co") || p.linkOrFoto.includes("imgbb"));

                   return (
                     <div key={idx} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 md:gap-5 items-start hover:border-slate-200 transition">
                        
                        {/* Area Tampilan Media / Ikon */}
                        {isImage ? (
                          <img src={p.linkOrFoto} alt="Dokumentasi" className="w-full sm:w-40 h-32 object-cover rounded-xl shrink-0 bg-slate-50 border border-slate-100" />
                        ) : (
                          <div className={`w-full sm:w-32 h-24 rounded-xl flex items-center justify-center shrink-0 border ${isAkad ? 'bg-emerald-50/50 border-emerald-100 text-emerald-400' : 'bg-amber-50/50 border-amber-100 text-amber-400'}`}>
                             {isAkad ? <BookOpen size={40} strokeWidth={1.5}/> : <Award size={40} strokeWidth={1.5}/>}
                          </div>
                        )}

                        <div className="flex-1 w-full flex flex-col">
                           <div className="flex items-start justify-between gap-2">
                             <div>
                               <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md mb-2 inline-block ${isAkad ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                 {isAkad ? 'Akademik / Kaderisasi' : 'Lomba / Non-Akademik'}
                               </span>
                               <h3 className="font-bold text-slate-800 text-base md:text-lg leading-tight mb-1.5">{p.judul}</h3>
                               <p className="font-bold text-blue-600 text-sm mb-3">{p.pencapaian}</p>
                             </div>
                           </div>

                           <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500 mt-auto">
                             <span className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Medal size={12}/> {p.tingkat || "-"}</span>
                             <span className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Calendar size={12}/> {p.tahun || "-"}</span>
                             
                             {/* Jika memiliki link tapi bukan format gambar, munculkan sebagai tombol */}
                             {hasMedia && !isImage && (
                               <a href={p.linkOrFoto} target="_blank" rel="noopener noreferrer" className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5">
                                 {isAkad ? <FileText size={12}/> : <ExternalLink size={12}/>} 
                                 {isAkad ? 'Buka Tautan / Raport' : 'Lihat Sertifikat'}
                               </a>
                             )}
                           </div>
                        </div>
                     </div>
                   )
                 })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}