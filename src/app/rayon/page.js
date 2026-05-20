"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { MapPin, Users, BookOpen, ExternalLink, Shield, ArrowRight, Compass, Map } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function RayonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rayonData, setRayonData] = useState([]);

  // Tarik Data Real dari Firebase (Tersinkronisasi dengan database_rayon)
  useEffect(() => {
    async function fetchRayon() {
      try {
        const docRef = doc(db, "website_config", "database_rayon");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listRayon) {
          setRayonData(docSnap.data().listRayon);
        }
      } catch (error) {
        console.error("Gagal menarik data rayon:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRayon();
  }, []);

  if (loading) return <LoadingScreen text="Memuat Data Rayon" />;

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 w-full overflow-x-hidden flex flex-col">
      <Navbar />

      {/* ================= 1. BANNER HERO ================= */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-5 bg-[#0f172a] text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay"><div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-yellow-400 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-5 inline-block flex items-center justify-center gap-2 w-max mx-auto backdrop-blur-sm"
          >
            <Compass size={14} />
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight"
          >
            Daftar <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Rayon</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 text-sm md:text-lg font-light max-w-2xl mx-auto leading-relaxed"
          >
            Kenali lebih dekat rayon-rayon PMII di setiap fakultas. Wadah berproses yang mengintegrasikan nilai-nilai intelektual, keagamaan, dan sosial kemasyarakatan.
          </motion.p>
        </div>
      </section>

      {/* ================= 2. GRID KARTU RAYON ================= */}
      <section className="py-12 md:py-20 px-5 max-w-7xl mx-auto w-full flex-grow relative z-20 -mt-10 md:-mt-16">
        
        {rayonData.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-12 md:p-16 text-center max-w-2xl mx-auto">
             <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-5" />
             <h3 className="font-extrabold text-slate-800 text-xl md:text-2xl mb-2">Data Rayon Belum Tersedia</h3>
             <p className="text-sm md:text-base text-slate-500 leading-relaxed">Profil masing-masing rayon belum ditambahkan oleh Admin. Silakan kelola melalui Dashboard Admin untuk menampilkan daftar rayon di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {rayonData.map((rayon, index) => {
              const rayonSlug = encodeURIComponent(rayon.nama.toLowerCase().replace(/\s+/g, '-'));

              return (
                <motion.div 
                  key={index}
                  onClick={() => router.push(`/rayon/${rayonSlug}`)}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-300 group flex flex-col h-full cursor-pointer"
                >
                  {/* TAMPILAN HEADER BARU: Khusus untuk Logo PNG Transparan */}
                  <div className="relative h-48 md:h-56 w-full bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
                    {/* Background Logo Watermark */}
                    {rayon.logoUrl ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center p-8 opacity-30 group-hover:opacity-50 transition-opacity duration-700 blur-[2px]">
                           <img src={rayon.logoUrl} alt={rayon.nama} className="w-full h-full object-contain" />
                        </div>
                        <div className="relative z-10 w-24 h-24 md:w-28 md:h-28 flex items-center justify-center drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">
                           <img src={rayon.logoUrl} alt={rayon.nama} className="w-full h-full object-contain" />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center opacity-20">
                         <Compass size={80} className="text-white" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 uppercase tracking-wider z-20">
                      <BookOpen size={12} className="text-blue-600" /> {rayon.fakultas || "Fakultas"}
                    </div>

                    <div className="absolute bottom-4 left-5 right-5 z-20">
                      <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight group-hover:text-yellow-400 transition-colors">
                        {rayon.nama}
                      </h3>
                    </div>
                  </div>

                  {/* Bagian Bawah: Info & Deskripsi */}
                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow italic">
                      "{rayon.deskripsi || "Berproses bersama mengawal pergerakan di tingkat fakultas dengan nilai-nilai Ahlussunnah Wal Jama'ah."}"
                    </p>

                    <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Shield size={18} className="text-blue-600 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ketua Rayon</p>
                          <p className="font-bold text-slate-700 text-sm">{rayon.ketua || "Belum ditentukan"}</p>
                        </div>
                      </div>
                      
                      {/* Tautan Fakultas & Lokasi */}
                      <div className="flex gap-2 pt-2 mt-2 border-t border-slate-200">
                        {rayon.linkFakultas ? (
                          <a 
                            href={rayon.linkFakultas} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} 
                            className="flex-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 text-[11px] font-bold py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink size={14}/> Web/IG
                          </a>
                        ) : (
                          <span className="flex-1 bg-slate-100 text-slate-400 text-[11px] font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"><ExternalLink size={14}/> Web/IG</span>
                        )}
                        
                        {rayon.linkMap ? (
                          <a 
                            href={rayon.linkMap} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} 
                            className="flex-1 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 text-[11px] font-bold py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Map size={14}/> Lokasi Map
                          </a>
                        ) : (
                          <span className="flex-1 bg-slate-100 text-slate-400 text-[11px] font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"><Map size={14}/> Lokasi Map</span>
                        )}
                      </div>
                    </div>

                    {/* Tombol Aksi Detail */}
                    <div className="pt-2">
                      <div className="w-full bg-slate-900 group-hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md">
                        Lihat Profil Lengkap <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}