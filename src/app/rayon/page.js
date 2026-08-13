"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GridSkeleton from "@/components/GridSkeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, BookOpen, ExternalLink, Shield, ArrowRight, Compass, Map } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import Image from 'next/image';

export default function RayonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rayonData, setRayonData] = useState([]);

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

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 w-full overflow-x-hidden flex flex-col">
      <Navbar />

      <section className="pt-32 pb-24 px-5 bg-slate-900 text-center relative border-b border-slate-800">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Compass size={14} /> Peta Pergerakan
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Daftar <span className="text-blue-400">Rayon</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-400 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Kenali lebih dekat basis pergerakan PMII di tingkat fakultas. Ruang dialektika dan kaderisasi yang mengintegrasikan nilai intelektual dan keislaman.
          </motion.p>
        </div>
      </section>

      <section className="py-16 px-5 max-w-7xl mx-auto w-full flex-grow relative z-20 -mt-8">
        {loading ? (
          <GridSkeleton />
        ) : rayonData.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center max-w-xl mx-auto">
             <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
             <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">Data Rayon Belum Tersedia</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400">Profil rayon belum ditambahkan ke dalam database sistem.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {rayonData.map((rayon, index) => {
              const rayonSlug = encodeURIComponent(rayon.nama.toLowerCase().replace(/\s+/g, '-'));

              return (
                <motion.div 
                  key={index}
                  onClick={() => router.push(`/rayon/${rayonSlug}`)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 group flex flex-col cursor-pointer"
                >
                  {/* Header/Cover Kartu */}
                  <div className="relative h-40 w-full bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-600 flex items-center justify-center p-6 shrink-0 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/30 transition-colors">
                    {rayon.logoUrl ? (
                       <Image 
                         src={rayon.logoUrl} 
                         alt={rayon.nama} 
                         fill 
                         className="object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-500 p-6" 
                         sizes="(max-width: 768px) 100vw, 33vw" 
                       />
                    ) : (
                       <Compass size={48} className="text-slate-300 dark:text-slate-500 group-hover:text-blue-200 dark:group-hover:text-blue-400 transition-colors z-10" />
                    )}
                    <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-sm z-20">
                      <BookOpen size={12} className="text-blue-500 dark:text-blue-400" /> {rayon.fakultas || "Fakultas"}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {rayon.nama}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
                      {rayon.deskripsi || "Berproses bersama mengawal pergerakan di tingkat fakultas."}
                    </p>

                    <div className="space-y-3 mb-6 bg-slate-50/50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                      <div className="flex items-center gap-3">
                        <Shield size={16} className="text-slate-400 dark:text-slate-500" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ketua Rayon</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{rayon.ketua || "Belum ditentukan"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-auto border-t border-slate-100 dark:border-slate-700 pt-4">
                      {rayon.igUrl ? (
                        <a href={rayon.igUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                          <ExternalLink size={14}/> Sosmed
                        </a>
                      ) : (
                        <span className="flex-1 text-center bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed"><ExternalLink size={14}/> Sosmed</span>
                      )}
                      
                      {rayon.mapUrl ? (
                        <a href={rayon.mapUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                          <Map size={14}/> Lokasi
                        </a>
                      ) : (
                        <span className="flex-1 text-center bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed"><Map size={14}/> Lokasi</span>
                      )}

                      <div className="flex-1 text-center bg-slate-900 dark:bg-blue-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs shadow-sm">
                        Profil <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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