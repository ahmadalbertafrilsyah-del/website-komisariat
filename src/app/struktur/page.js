"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image"; // Mengimpor komponen Image dari next
import GridSkeleton from "@/components/GridSkeleton"; // Mengimpor komponen skeleton
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Hash, MapPin, Calendar, Award, Shield, Users, Briefcase } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function StrukturPage() {
  const [selectedPengurus, setSelectedPengurus] = useState(null);
  const [strukturData, setStrukturData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil Data Nyata dari Firestore Firebase
  useEffect(() => {
    async function fetchStruktur() {
      try {
        const docRef = doc(db, "website_config", "struktur_organisasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listKategori) {
          setStrukturData(docSnap.data().listKategori);
        }
      } catch (error) {
        console.error("Gagal menarik data struktur:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStruktur();
  }, []);

  // Ikon Otomatis Berdasarkan Kata Kunci Biro
  const renderIkonBiro = (namaBiro) => {
    const LowerStr = namaBiro.toLowerCase();
    if (LowerStr.includes("bph") || LowerStr.includes("harian") || LowerStr.includes("inti")) {
      return <Shield size={22} className="text-blue-600" />;
    } else if (LowerStr.includes("kaderisasi") || LowerStr.includes("anggota") || LowerStr.includes("psdm")) {
      return <Users size={22} className="text-blue-600" />;
    }
    return <Briefcase size={22} className="text-blue-600" />;
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 w-full overflow-x-hidden">
      <Navbar />

      {/* 1. BANNER HERO UTAMA */}
      <section className="pt-28 md:pt-36 pb-12 md:pb-16 px-4 bg-[#1e293b] text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-yellow-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mb-4 inline-block">
            Masa Khidmat Berjalan
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Struktur <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Kepengurusan</span>
          </h1>
          <p className="text-slate-300 text-xs md:text-sm font-light max-w-xl mx-auto leading-relaxed">
            Nakhoda pergerakan PMII Komisariat yang berkomitmen membawa organisasi bergerak progresif dan inklusif.
          </p>
        </div>
      </section>

      {/* 2. AREA KONTEN (RENDERING NYATA DARI FIREBASE) */}
      <section className="py-12 md:py-16 px-5 max-w-6xl mx-auto min-h-[50vh]">
        
        {loading ? (
          <GridSkeleton /> // Pemuatan kerangka animasi pengganti loading screen penuh
        ) : strukturData.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm max-w-xl mx-auto">
             <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="font-bold text-slate-700 text-lg">Data Struktur Kosong</h3>
             <p className="text-sm text-slate-400 mt-1 leading-relaxed">Susunan kepengurusan belum diunggah. Silakan isi data personil organisasi melalui Dashboard Admin.</p>
          </div>
        ) : (
          strukturData.map((divisi, divIndex) => (
            <div key={divIndex} className="mb-16 md:mb-20">
              
              {/* Header Kategori Divisi/Biro */}
              <div className="flex flex-col items-center mb-8 md:mb-10 text-center">
                <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 mb-2 flex items-center justify-center gap-2 md:gap-3">
                  {renderIkonBiro(divisi.kategori)} {divisi.kategori}
                </h2>
                <div className="w-16 h-1 bg-blue-600 rounded-full mt-2"></div>
              </div>

              {/* Grid Kartu Pengurus */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {divisi.anggota && divisi.anggota.map((item, memberIndex) => (
                  <motion.div 
                    key={memberIndex} 
                    onClick={() => setSelectedPengurus(item)} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: memberIndex * 0.05 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                  >
                    {/* Area Foto Profil dengan komponen Image Next.js */}
                    <div className="relative h-44 sm:h-56 w-full bg-slate-50 flex items-center justify-center border-b border-slate-100 overflow-hidden shrink-0">
                      {item.foto ? (
                        <Image 
                          src={item.foto} 
                          alt={item.nama || "Foto Pengurus"} 
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 text-2xl font-bold uppercase shadow-sm">
                          {item.nama ? item.nama.charAt(0) : "?"}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                      <span className="absolute bottom-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-slate-900/70 text-white px-2.5 py-1 rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        Detail Profil
                      </span>
                    </div>
                    
                    {/* Info Jabatan */}
                    <div className="p-4 text-center border-t-4 border-[#facc15] flex-grow flex flex-col justify-center bg-white z-10">
                      <h4 className="font-extrabold text-slate-900 text-xs md:text-sm leading-tight mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {item.nama || "Nama Kosong"}
                      </h4>
                      <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {item.jabatan || "Anggota"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          )
        ))}
      </section>

      {/* ================= 3. POPUP MODAL IDENTITAS DIRI ================= */}
      <AnimatePresence>
        {selectedPengurus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPengurus(null)} className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 w-full max-w-md relative z-10 flex flex-col max-h-[85vh]"
            >
              {/* Header Modal */}
              <div className="bg-[#1e293b] text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-yellow-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Profil Identitas Pengurus</span>
                </div>
                <button onClick={() => setSelectedPengurus(null)} className="text-slate-400 hover:text-white transition p-1.5 bg-white/5 rounded-lg border border-white/10">
                  <X size={16} />
                </button>
              </div>

              {/* Konten Scrollable */}
              <div className="p-5 md:p-6 space-y-4 overflow-y-auto hide-scrollbar">
                <div className="flex flex-col items-center border-b border-slate-100 pb-4 text-center">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 mb-3 shadow-md border-4 border-white shadow-slate-200 flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0">
                    {selectedPengurus.foto ? (
                      <Image 
                        src={selectedPengurus.foto} 
                        alt={selectedPengurus.nama || "Foto Profil"} 
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      selectedPengurus.nama ? selectedPengurus.nama.charAt(0) : "?"
                    )}
                  </div>
                  <h3 className="text-base md:text-lg font-extrabold text-slate-900 leading-tight px-1">{selectedPengurus.nama || "Nama Kosong"}</h3>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mt-2">
                    {selectedPengurus.jabatan || "Anggota"}
                  </span>
                </div>

                {/* List Data */}
                <div className="space-y-2.5 text-xs md:text-sm">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0"><Hash size={14} className="text-blue-600" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">NIM / NIA KADER</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedPengurus.nim || "-"} <span className="text-slate-300 mx-1">|</span> <span className="text-blue-700 font-mono">{selectedPengurus.nia || "-"}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0"><MapPin size={14} className="text-emerald-600" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Asal Rayon</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedPengurus.rayon || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0"><Calendar size={14} className="text-amber-600" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Angkatan Mapaba/PKD</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedPengurus.angkatan ? `Tahun ${selectedPengurus.angkatan}` : "-"}</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                {selectedPengurus.whatsapp && (
                  <div className="pt-2">
                    <a 
                      href={`https://wa.me/${selectedPengurus.whatsapp.replace(/[^0-9]/g, "")}?text=Assalamualaikum%20Sahabat%20${encodeURIComponent(selectedPengurus.nama)}...`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs md:text-sm font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                    >
                      <MessageSquare size={14} /> Hubungi via WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}