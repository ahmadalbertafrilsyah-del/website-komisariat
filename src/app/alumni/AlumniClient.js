"use client";
import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, GraduationCap, MapPin, Briefcase, Calendar, User, X, Share2, Info, Star, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function AlumniClient() {
  const [loading, setLoading] = useState(true);
  const [alumniData, setAlumniData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; 
  
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  useEffect(() => {
    async function fetchAlumni() {
      try {
        const docRef = doc(db, "website_config", "database_alumni");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAlumni) {
          const data = docSnap.data().listAlumni;
          setAlumniData(data);
          
          const params = new URLSearchParams(window.location.search);
          const namaParam = params.get("nama");
          if (namaParam) {
            const found = data.find(a => a.nama === decodeURIComponent(namaParam));
            if (found) setSelectedAlumni(found);
          }
        }
      } catch (error) {
        console.error("Gagal menarik data alumni:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAlumni();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredData = alumniData.filter(item => {
    const profesiString = Array.isArray(item.profesi) ? item.profesi.join(" ") : (item.profesi || "");
    const bidangString = Array.isArray(item.bidang) ? item.bidang.join(" ") : (item.bidang || "");
    
    const deskripsiString = typeof item.deskripsiProfesi === 'object' && item.deskripsiProfesi !== null 
      ? Object.values(item.deskripsiProfesi).join(" ") 
      : (typeof item.deskripsiProfesi === 'string' ? item.deskripsiProfesi : "");

    const searchLower = searchQuery.toLowerCase();

    return (
      (item.nama || "").toLowerCase().includes(searchLower) || 
      profesiString.toLowerCase().includes(searchLower) ||
      bidangString.toLowerCase().includes(searchLower) ||
      deskripsiString.toLowerCase().includes(searchLower) ||
      (item.asalRayon || "").toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentAlumniData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const handleOpenModal = (alumni) => {
    setSelectedAlumni(alumni);
    window.history.pushState(null, "", `?nama=${encodeURIComponent(alumni.nama)}`);
  };

  const handleCloseModal = () => {
    setSelectedAlumni(null);
    window.history.pushState(null, "", `/alumni`);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `Profil Alumni: ${selectedAlumni.nama}`,
      text: `Lihat profil keahlian alumni PMII ${selectedAlumni.nama} di Direktori Alumni.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log("Error sharing:", err); }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link profil berhasil disalin ke clipboard!");
    }
  };

  if (loading) return <LoadingScreen text="Memuat Direktori Alumni" />;

  const getSafeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string' && data.trim() !== '') return data.split(',').map(s => s.trim());
    return [];
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 flex flex-col relative">
      <Navbar />

      <section className="pt-28 md:pt-36 pb-20 md:pb-28 px-4 md:px-5 bg-slate-900 text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} 
            className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full mb-4 md:mb-5 inline-flex items-center justify-center gap-2 w-max backdrop-blur-sm"
          >
            <GraduationCap size={14} /> Jaringan Profesional Kader
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
            className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 md:mb-6 tracking-tight leading-tight"
          >
            Direktori <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">Alumni</span>
          </motion.h1>
        </div>
      </section>

      <section className="px-4 md:px-5 max-w-4xl mx-auto w-full -mt-6 md:-mt-8 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl p-1.5 md:p-2 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 flex items-center relative transition-all focus-within:shadow-xl focus-within:shadow-blue-100/50"
        >
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3 md:left-4 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
            <input
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, profesi, atau keahlian..."
              className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-3.5 bg-transparent border-none rounded-xl text-xs md:text-sm focus:outline-none text-slate-700 placeholder:text-slate-400 font-medium"
            />
          </div>
        </motion.div>
      </section>

      <section className="py-10 md:py-16 px-3 md:px-5 max-w-7xl mx-auto w-full flex-grow flex flex-col">
        {filteredData.length === 0 ? (
           <div className="text-center text-slate-400 py-20 flex flex-col items-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4"><Search size={32} className="opacity-50"/></div>
              <p className="font-medium text-sm">Tidak ada data alumni yang ditemukan.</p>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {currentAlumniData.map((alumni, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                  whileInView={{ opacity: 1, scale: 1, y: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 group flex flex-col"
                >
                   <div className="h-16 md:h-20 w-full bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                   </div>

                   <div className="relative -mt-10 md:-mt-12 mx-auto">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-md bg-slate-100 overflow-hidden group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                        {alumni.foto ? (
                          <img src={alumni.foto} alt={alumni.nama} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                   </div>

                   <div className="pt-3 pb-5 px-4 flex flex-col items-center flex-grow text-center">
                      <h3 className="text-slate-800 font-bold text-sm md:text-base leading-tight mb-4 line-clamp-2 min-h-[40px] flex items-center">
                        {alumni.nama}
                      </h3>
                      
                      <button 
                        onClick={() => handleOpenModal(alumni)}
                        className="mt-auto w-full bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 hover:border-blue-600 transition-colors duration-300 font-semibold py-2 rounded-xl text-xs md:text-sm flex justify-center items-center gap-1.5"
                      >
                        <Info size={16} /> Lihat Profil
                      </button>
                   </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 md:gap-3 mt-12 md:mt-16 w-full">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 md:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="hidden md:flex items-center gap-1.5">
                  {getPageNumbers().map((pageNum, idx) => (
                    <button
                      key={idx}
                      onClick={() => pageNum !== '...' && setCurrentPage(pageNum)}
                      disabled={pageNum === '...'}
                      className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : pageNum === '...'
                          ? 'text-slate-400 cursor-default bg-transparent'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <div className="md:hidden px-4 text-sm font-bold text-slate-600">
                  Hal <span className="text-blue-600">{currentPage}</span> / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 md:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
      
      <Footer />

      <AnimatePresence>
        {selectedAlumni && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row my-auto max-h-[90vh] md:max-h-[85vh]"
            >
              <button onClick={handleCloseModal} className="absolute top-4 right-4 z-20 bg-black/10 hover:bg-black/30 text-slate-800 hover:text-white p-2 rounded-full backdrop-blur-md transition-colors">
                 <X size={20} />
              </button>

              <div className="w-full md:w-2/5 lg:w-1/3 bg-slate-50 border-r border-slate-100 flex flex-col items-center pt-10 md:pt-14 pb-8 px-6 relative shrink-0">
                 <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10 rounded-b-[50%]"></div>
                 
                 <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl bg-slate-100 overflow-hidden flex items-center justify-center mb-6 relative z-10">
                    {selectedAlumni.foto ? (
                      <img src={selectedAlumni.foto} alt={selectedAlumni.nama} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-slate-300" />
                    )}
                 </div>

                 <h2 className="text-xl md:text-2xl font-black text-slate-800 text-center leading-tight mb-6">
                   {selectedAlumni.nama}
                 </h2>

                 <div className="w-full space-y-3 mt-auto">
                    <div className="flex items-center p-3.5 bg-white shadow-sm border border-slate-100 rounded-2xl gap-3">
                       <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Calendar size={18}/></div>
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Tahun Mapaba</p>
                         <p className="text-sm font-bold text-slate-700">{selectedAlumni.tahunMapaba || "Tidak diketahui"}</p>
                       </div>
                    </div>
                    <div className="flex items-center p-3.5 bg-white shadow-sm border border-slate-100 rounded-2xl gap-3">
                       <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><MapPin size={18}/></div>
                       <div className="overflow-hidden">
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Asal Rayon</p>
                         <p className="text-sm font-bold text-slate-700 truncate" title={selectedAlumni.asalRayon}>{selectedAlumni.asalRayon || "Tidak diketahui"}</p>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={handleShare}
                   className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20"
                 >
                   <Share2 size={18} /> Bagikan Profil
                 </button>
              </div>

              <div className="w-full md:w-3/5 lg:w-2/3 p-6 md:p-8 lg:p-10 overflow-y-auto">
                 <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Briefcase className="text-blue-600"/> Informasi Profesional
                 </h3>

                 <div className="mb-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Profesi Saat Ini</p>
                    <div className="space-y-3">
                      {(() => {
                        const profesiList = getSafeArray(selectedAlumni.profesi);
                        return profesiList.length > 0 ? (
                          profesiList.map((p, idx) => {
                            const descText = (typeof selectedAlumni.deskripsiProfesi === 'object' && selectedAlumni.deskripsiProfesi !== null)
                              ? selectedAlumni.deskripsiProfesi[p]
                              : null;
                              
                            return (
                              <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                 <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                                      <Briefcase size={14} /> {p}
                                    </span>
                                 </div>
                                 {descText && (
                                   <div className="flex gap-2.5 items-start mt-2">
                                      <FileText className="text-slate-400 shrink-0 mt-0.5" size={16}/>
                                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                        {descText}
                                      </p>
                                   </div>
                                 )}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-sm font-medium text-slate-500 italic bg-slate-50 px-4 py-3 rounded-xl block border border-slate-100 text-center">
                            Belum mengisi data profesi.
                          </span>
                        );
                      })()}
                    </div>
                 </div>

                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bidang yang Dikuasai / Keahlian</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const bidangList = getSafeArray(selectedAlumni.bidang);
                        return bidangList.length > 0 ? (
                          bidangList.map((b, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-100/50 rounded-lg text-sm font-bold">
                              <Star size={14} className="text-violet-500" /> {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm font-medium text-slate-500 italic bg-slate-50 px-4 py-3 rounded-xl w-full text-center block border border-slate-100">
                            Data keahlian belum ditambahkan.
                          </span>
                        );
                      })()}
                    </div>
                 </div>
                 
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}