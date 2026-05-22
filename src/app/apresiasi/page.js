"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, Trophy, Award, BookOpen, ExternalLink, Calendar, Medal } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function ApresiasiPage() {
  const [loading, setLoading] = useState(true);
  const [kaderData, setKaderData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKader, setActiveKader] = useState(null); // Modal detail prestasi

  useEffect(() => {
    async function fetchApresiasi() {
      try {
        const docRef = doc(db, "website_config", "database_apresiasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listApresiasi) {
          // Hanya tampilkan yang punya prestasi
          const dataValid = docSnap.data().listApresiasi.filter(k => k.prestasi && k.prestasi.length > 0);
          setKaderData(dataValid);
        }
      } catch (error) {
        console.error("Gagal menarik data apresiasi:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchApresiasi();
  }, []);

  const filteredData = kaderData.filter(item => 
    (item.namaLengkap || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.prestasi.some(p => (p.judul || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <LoadingScreen text="Memuat Galeri Prestasi" />;

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 flex flex-col">
      <Navbar />

      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-5 bg-[#0f172a] text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.span initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-400 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-5 inline-flex items-center justify-center gap-2 w-max backdrop-blur-sm">
            <Trophy size={14} /> Hall of Fame PMII
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Apresiasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">Kader</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-300 text-sm md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Galeri pencapaian prestasi akademik dan non-akademik sahabat/i PMII Komisariat. Menghidupkan nilai intelektualitas di kancah nasional maupun internasional.
          </motion.p>
        </div>
      </section>

      <section className="px-5 max-w-7xl mx-auto w-full -mt-10 md:-mt-12 relative z-20">
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center relative">
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kader atau judul perlombaan / jurnal..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
          />
          <Search className="absolute left-7 h-5 w-5 text-slate-400" />
        </div>
      </section>

      <section className="py-16 px-5 max-w-7xl mx-auto w-full flex-grow">
        {filteredData.length === 0 ? (
           <div className="text-center text-slate-400 py-10"><Trophy size={48} className="mx-auto mb-4 opacity-50"/>Belum ada rekam prestasi ditemukan.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredData.map((kader, idx) => {
              // Ambil Highlight Prestasi Pertama sebagai teaser
              const highlight = kader.prestasi[0];
              const isAkademik = highlight.tipe === "akademik";

              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col group">
                   <div className="p-5 flex items-center gap-4 bg-slate-900 text-white">
                      {kader.fotoKader ? (
                        <img src={kader.fotoKader} className="w-14 h-14 rounded-full object-cover border-2 border-slate-700 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border-2 border-slate-700"><Trophy size={20} className="text-slate-500"/></div>
                      )}
                      <div>
                         <h3 className="font-bold text-sm leading-snug line-clamp-2">{kader.namaLengkap}</h3>
                         <span className="text-[9px] text-amber-400 uppercase tracking-widest font-bold bg-amber-400/10 px-2 py-0.5 rounded-md mt-1 inline-block">{kader.asalRayon || "Kader"}</span>
                      </div>
                   </div>

                   <div className="p-5 bg-white flex flex-col flex-grow border-t border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">{isAkademik ? <BookOpen size={100}/> : <Award size={100}/>}</div>
                      
                      <div className="mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${isAkademik ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>Highlight {isAkademik ? 'Jurnal' : 'Lomba'}</span>
                      </div>
                      
                      <h4 className="font-extrabold text-slate-800 text-base leading-snug mb-1 line-clamp-2 relative z-10">{highlight.judul}</h4>
                      <p className="text-sm font-semibold text-blue-600 mb-4">{highlight.pencapaian}</p>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-auto border-t border-slate-50 pt-3">
                         <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><Medal size={12}/> {highlight.tingkat || "Lokal"}</span>
                         <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><Calendar size={12}/> {highlight.tahun || "-"}</span>
                      </div>
                   </div>
                   
                   <button onClick={() => setActiveKader(kader)} className="w-full bg-slate-50 hover:bg-amber-500 text-slate-600 hover:text-white font-bold py-3.5 text-xs transition-colors flex items-center justify-center gap-1.5 border-t border-slate-100">
                     Lihat Semua {kader.prestasi.length} Prestasi <ExternalLink size={14}/>
                   </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* MODAL LIHAT SEMUA PRESTASI KADER */}
      <AnimatePresence>
        {activeKader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveKader(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="bg-slate-900 text-white p-6 flex items-center gap-4 shrink-0">
                 {activeKader.fotoKader ? <img src={activeKader.fotoKader} className="w-16 h-16 rounded-full object-cover border-2 border-slate-700"/> : <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center"><Trophy size={24}/></div>}
                 <div><h2 className="text-xl font-bold">{activeKader.namaLengkap}</h2><p className="text-amber-400 text-xs font-bold tracking-widest uppercase mt-0.5">{activeKader.asalRayon}</p></div>
                 <button onClick={() => setActiveKader(null)} className="ml-auto bg-slate-800 hover:bg-red-500 text-white p-2 rounded-xl transition"><span className="sr-only">Tutup</span>✕</button>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6">
                 <div className="space-y-4">
                   {activeKader.prestasi.map((p, idx) => {
                     const isAkad = p.tipe === 'akademik';
                     return (
                       <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 items-start">
                          {p.linkOrFoto && !isAkad ? (
                            <img src={p.linkOrFoto} alt="Piala" className="w-full md:w-48 h-32 object-cover rounded-xl shrink-0 border border-slate-100" />
                          ) : (
                            <div className={`w-full md:w-32 h-24 rounded-xl flex items-center justify-center shrink-0 border ${isAkad ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-amber-50 border-amber-100 text-amber-500'}`}>
                               {isAkad ? <BookOpen size={36}/> : <Award size={36}/>}
                            </div>
                          )}
                          <div className="flex-1">
                             <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block ${isAkad ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{isAkad ? 'Publikasi Jurnal' : 'Kejuaraan'}</span>
                             <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{p.judul}</h3>
                             <p className="font-bold text-blue-600 mb-3">{p.pencapaian}</p>
                             <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                               <span className="bg-slate-100 px-2.5 py-1 rounded-lg">Tingkat: {p.tingkat || "-"}</span>
                               <span className="bg-slate-100 px-2.5 py-1 rounded-lg">Tahun: {p.tahun || "-"}</span>
                               {isAkad && p.linkOrFoto && <a href={p.linkOrFoto} target="_blank" rel="noopener noreferrer" className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"><ExternalLink size={12}/> Link Jurnal / DOI</a>}
                             </div>
                          </div>
                       </div>
                     )
                   })}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}