"use client";
import React, { useState, useEffect } from "react";
import GridSkeleton from "@/components/GridSkeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Filter, Users, MapPin, Hash, GraduationCap, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function AnggotaPage() {
  const [loading, setLoading] = useState(true);
  const [anggotaData, setAnggotaData] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRayon, setFilterRayon] = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    async function fetchAnggota() {
      try {
        const docRef = doc(db, "website_config", "database_anggota");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAnggota) {
          setAnggotaData(docSnap.data().listAnggota);
        }
      } catch (error) {
        console.error("Gagal menarik data anggota:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnggota();
  }, []);

  const uniqueRayon = ["Semua", ...new Set(anggotaData.map(item => item.rayon).filter(r => r !== ""))];
  const uniqueAngkatan = ["Semua", ...new Set(anggotaData.map(item => item.angkatan).filter(a => a !== ""))].sort();

  const isSearching = searchQuery.trim() !== "" || filterRayon !== "Semua" || filterAngkatan !== "Semua";

  const filteredData = anggotaData.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.nim.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRayon = filterRayon === "Semua" || item.rayon === filterRayon;
    const matchAngkatan = filterAngkatan === "Semua" || item.angkatan === filterAngkatan;
    
    return matchSearch && matchRayon && matchAngkatan;
  });

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 w-full overflow-x-hidden flex flex-col">
      <Navbar />

      <section className="pt-32 pb-24 px-5 bg-slate-900 text-center relative border-b border-slate-800">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Users size={14} /> Database Publik
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Direktori <span className="text-blue-400">Kader</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
            Pusat data terpadu anggota PMII Komisariat. Temukan relasi, bangun jaringan pergerakan, dan kenali lebih dekat sahabat-sahabat seperjuangan.
          </motion.p>
        </div>
      </section>

      <section className="px-5 max-w-5xl mx-auto w-full -mt-10 relative z-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-2 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-2">
          
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(12); }}
              placeholder="Cari nama atau NIM kader..."
              className="w-full pl-12 pr-4 py-3.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-50 dark:focus:bg-slate-700 rounded-xl text-sm focus:outline-none transition-colors font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-700 my-2"></div>

          <div className="relative w-full md:w-56 shrink-0">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <select
              value={filterRayon}
              onChange={(e) => { setFilterRayon(e.target.value); setVisibleCount(12); }}
              className="w-full pl-11 pr-10 py-3.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm focus:outline-none appearance-none font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
            >
              {uniqueRayon.map((r, i) => <option key={i} value={r}>{r === "Semua" ? "Semua Rayon" : r}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-48 shrink-0">
            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <select
              value={filterAngkatan}
              onChange={(e) => { setFilterAngkatan(e.target.value); setVisibleCount(12); }}
              className="w-full pl-11 pr-10 py-3.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm focus:outline-none appearance-none font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
            >
              {uniqueAngkatan.map((a, i) => <option key={i} value={a}>{a === "Semua" ? "Semua Angkatan" : a}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

        </motion.div>
      </section>

      <section className="pt-12 pb-20 px-5 max-w-7xl mx-auto w-full flex-grow">
        
        {loading ? (
          <GridSkeleton />
        ) : !isSearching ? (
          <div className="text-center max-w-md mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xl mb-2">Mulai Pencarian Kader</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Ketik nama, NIM, atau gunakan filter di atas untuk menampilkan profil kader secara instan dari database.
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center max-w-md mx-auto mt-10 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <Users className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
             <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Kader Tidak Ditemukan</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Pastikan ejaan pencarian sudah benar atau coba sesuaikan filter kategori Anda.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Menemukan <span className="text-blue-600 dark:text-blue-400 font-bold">{filteredData.length}</span> data kader
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {filteredData.slice(0, visibleCount).map((kader, index) => (
                <motion.div 
                  key={kader.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 group flex flex-col"
                >
                  <div className="h-16 w-full bg-slate-100 dark:bg-slate-700 relative group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    <div className="absolute -bottom-6 left-5 w-14 h-14 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-100 dark:border-slate-700">
                      <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white font-extrabold text-lg">
                        {kader.nama.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 pb-5 px-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight mb-1 truncate" title={kader.nama}>
                      {kader.nama}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-5">
                      <MapPin size={12} className="text-blue-500 dark:text-blue-400" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{kader.rayon || "Tanpa Rayon"}</p>
                    </div>

                    <div className="mt-auto space-y-2.5 border-t border-slate-100 dark:border-slate-700 pt-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5"><Hash size={12}/> NIM</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{kader.nim || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5"><Hash size={12}/> NIA</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{kader.nia || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5"><GraduationCap size={12}/> Angkatan</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{kader.angkatan || "-"}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredData.length > visibleCount && (
              <div className="flex justify-center mt-12">
                <button 
                  onClick={() => setVisibleCount(visibleCount + 12)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 font-bold py-2.5 px-6 rounded-full transition shadow-sm text-sm"
                >
                  Tampilkan Lebih Banyak
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}