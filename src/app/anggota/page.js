"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, Filter, Users, MapPin, Calendar, Hash } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function AnggotaPage() {
  const [loading, setLoading] = useState(true);
  const [anggotaData, setAnggotaData] = useState([]);
  
  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRayon, setFilterRayon] = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(12); // Menampilkan 12 data awal

  // Tarik Data Real dari Firebase
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

  // Mengekstrak Filter Unik Secara Otomatis
  const uniqueRayon = ["Semua", ...new Set(anggotaData.map(item => item.rayon).filter(r => r !== ""))];
  const uniqueAngkatan = ["Semua", ...new Set(anggotaData.map(item => item.angkatan).filter(a => a !== ""))].sort();

  // Logika Filter Data
  const filteredData = anggotaData.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.nim.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRayon = filterRayon === "Semua" || item.rayon === filterRayon;
    const matchAngkatan = filterAngkatan === "Semua" || item.angkatan === filterAngkatan;
    
    return matchSearch && matchRayon && matchAngkatan;
  });

  if (loading) return <LoadingScreen text="Memuat Database Kader" />;

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 w-full overflow-x-hidden flex flex-col">
      <Navbar />

      {/* ================= 1. BANNER HERO ================= */}
      <section className="pt-28 md:pt-36 pb-12 md:pb-16 px-5 bg-[#1e293b] text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mb-4 inline-block flex items-center justify-center gap-1.5 w-max mx-auto">
            <Users size={14} />
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Database <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-400">Kader</span>
          </h1>
          <p className="text-slate-300 text-xs md:text-sm font-light max-w-xl mx-auto leading-relaxed">
            Pusat data terpadu seluruh anggota dan kader PMII Komisariat. Anda dapat mencari kader berdasarkan nama, rayon, maupun tahun angkatan.
          </p>
        </div>
      </section>

      {/* ================= 2. KONTROL FILTER & PENCARIAN ================= */}
      <section className="py-8 px-5 max-w-7xl mx-auto w-full -mt-6 relative z-20">
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
          
          {/* Kolom Pencarian */}
          <div className="relative w-full md:flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(12); }}
              placeholder="Cari nama atau NIM kader..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>

          {/* Filter Rayon */}
          <div className="relative w-full md:w-48 shrink-0">
            <Filter className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <select
              value={filterRayon}
              onChange={(e) => { setFilterRayon(e.target.value); setVisibleCount(12); }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium text-slate-700 cursor-pointer"
            >
              {uniqueRayon.map((r, i) => <option key={i} value={r}>{r === "Semua" ? "Semua Rayon" : r}</option>)}
            </select>
          </div>

          {/* Filter Angkatan */}
          <div className="relative w-full md:w-48 shrink-0">
            <Filter className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <select
              value={filterAngkatan}
              onChange={(e) => { setFilterAngkatan(e.target.value); setVisibleCount(12); }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium text-slate-700 cursor-pointer"
            >
              {uniqueAngkatan.map((a, i) => <option key={i} value={a}>{a === "Semua" ? "Semua Angkatan" : a}</option>)}
            </select>
          </div>

        </div>
      </section>

      {/* ================= 3. AREA GRID KARTU ANGGOTA ================= */}
      <section className="pb-20 px-5 max-w-7xl mx-auto w-full flex-grow">
        
        {/* Pesan Jika Kosong */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center max-w-xl mx-auto mt-8">
             <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="font-bold text-slate-700 text-lg">Kader Tidak Ditemukan</h3>
             <p className="text-sm text-slate-400 mt-1 leading-relaxed">Pastikan ejaan nama atau NIM sudah benar. Jika data masih kosong, admin mungkin belum mengunggah database.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>Menampilkan <span className="text-blue-600">{Math.min(visibleCount, filteredData.length)}</span> dari <span className="text-blue-600">{filteredData.length}</span> Kader</span>
            </div>

            {/* Grid Tampilan Kartu (Responsif) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filteredData.slice(0, visibleCount).map((kader, index) => (
                <motion.div 
                  key={kader.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-inner">
                      {kader.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight line-clamp-2 text-sm md:text-base">
                        {kader.nama}
                      </h3>
                      <p className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider w-max mt-1.5">
                        {kader.angkatan || "Tahun -"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-auto border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-2 text-xs">
                      <Hash size={14} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium w-16 shrink-0">NIM</span>
                      <span className="font-bold text-slate-700 font-mono">{kader.nim || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Hash size={14} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium w-16 shrink-0">NIA</span>
                      <span className="font-bold text-slate-700 font-mono">{kader.nia || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-slate-500 font-medium w-16 shrink-0">Rayon</span>
                      <span className="font-bold text-slate-700">{kader.rayon || "-"}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tombol Load More */}
            {filteredData.length > visibleCount && (
              <div className="flex justify-center mt-10">
                <button 
                  onClick={() => setVisibleCount(visibleCount + 12)}
                  className="bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 font-bold py-3 px-8 rounded-xl transition shadow-sm"
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