"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, Filter, Users, MapPin, IdCard, ShieldCheck, GraduationCap } from "lucide-react";
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
  const [visibleCount, setVisibleCount] = useState(12);

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

  // Logika Menentukan Apakah Sedang Melakukan Pencarian
  const isSearching = searchQuery.trim() !== "" || filterRayon !== "Semua" || filterAngkatan !== "Semua";

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
            Pusat data terpadu seluruh anggota dan kader PMII Komisariat. Silakan gunakan fitur pencarian di bawah untuk menemukan data spesifik.
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
        
        {/* Tampilan Jika Belum Ada Pencarian yang Dilakukan */}
        {!isSearching ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 md:p-20 text-center max-w-2xl mx-auto mt-4 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
              <Search size={40} className="opacity-80" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-2xl mb-2">Mulai Pencarian Kader</h3>
            <p className="text-slate-500 mt-1 leading-relaxed max-w-md text-sm">
              Ketik nama, NIM, atau atur filter rayon dan angkatan di atas untuk memunculkan data kader dari sistem.
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          /* Pesan Jika Data Kosong/Tidak Sesuai Filter */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center max-w-xl mx-auto mt-4">
             <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="font-bold text-slate-700 text-lg">Kader Tidak Ditemukan</h3>
             <p className="text-sm text-slate-400 mt-1 leading-relaxed">Pastikan ejaan nama atau NIM sudah benar. Jika data masih kosong, admin mungkin belum mengunggahnya.</p>
          </div>
        ) : (
          /* Grid Tampilan Kartu Baru yang Lebih Modern (Otomatis Ketengah Jika Sedikit) */
          <>
            <div className="mb-6 text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>Menemukan <span className="text-blue-600 text-sm">{filteredData.length}</span> Kader</span>
            </div>

            {/* LOGIKA PUSAT TAMPILAN: Grid berubah tergantung jumlah data */}
            <div className={
              filteredData.length === 1 
                ? "grid grid-cols-1 max-w-sm mx-auto gap-5 md:gap-6 w-full" 
                : filteredData.length === 2 
                ? "grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-5 md:gap-6 w-full" 
                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6 w-full"
            }>
              {filteredData.slice(0, visibleCount).map((kader, index) => (
                <motion.div 
                  key={kader.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-300 relative overflow-hidden flex flex-col w-full"
                >
                  {/* Efek Latar Belakang Dekoratif saat Hover */}
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 z-0"></div>

                  <div className="relative z-10 flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30 transform group-hover:-translate-y-1 transition-transform duration-300">
                      {kader.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 mt-1">
                      <h3 className="font-bold text-slate-800 text-base md:text-[17px] leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {kader.nama}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2">
                        <GraduationCap size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Angkatan {kader.angkatan || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-3 mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-blue-50 transition-colors">
                        <IdCard size={15} className="text-blue-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">NIM</span>
                        <span className="font-semibold text-slate-700 font-mono">{kader.nim || "-"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                        <ShieldCheck size={15} className="text-indigo-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">NIA</span>
                        <span className="font-semibold text-slate-700 font-mono">{kader.nia || "-"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                        <MapPin size={15} className="text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rayon</span>
                        <span className="font-semibold text-slate-700">{kader.rayon || "-"}</span>
                      </div>
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
                  className="bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 font-bold py-3 px-8 rounded-xl transition shadow-sm"
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