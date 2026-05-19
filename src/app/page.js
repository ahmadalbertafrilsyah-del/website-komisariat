"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Landmark, Target, Handshake, Calendar, ArrowRight, ShieldCheck, Sparkles, Newspaper } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// IMPORT FIREBASE
import { db } from "@/lib/firebase"; 
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

// IMPORT FRAMER MOTION
import { motion, useInView } from "framer-motion";

// ================= KOMPONEN ANIMASI ANGKA MENGHITUNG =================
const AnimatedCounter = ({ value, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" }); 

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2500; 
      let startTime = null;

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeProgress * (end - start) + start));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [isInView, value]);

  const displayCount = count >= 1000 ? (count / 1000).toFixed(0) + "K" : count;

  return (
    <span ref={ref}>
      {displayCount}
      <span className="text-blue-600">{suffix}</span>
    </span>
  );
};

export default function Home() {
  const [config, setConfig] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [latestNews, setLatestNews] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedGlobal = localStorage.getItem('pmii_global_config');
    if (cachedGlobal) {
      setGlobalConfig(JSON.parse(cachedGlobal));
    }

    async function fetchData() {
      try {
        const [berandaSnap, globalSnap] = await Promise.all([
          getDoc(doc(db, "website_config", "settings")),
          getDoc(doc(db, "website_config", "global"))
        ]);
        
        if (berandaSnap.exists()) setConfig(berandaSnap.data());
        if (globalSnap.exists()) {
          const gData = globalSnap.data();
          setGlobalConfig(gData);
          localStorage.setItem('pmii_global_config', JSON.stringify(gData));
        }

        const newsRef = collection(db, "berita");
        const q = query(newsRef, orderBy("createdAt", "desc"), limit(3));
        const newsSnap = await getDocs(q);
        
        const newsData = newsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setLatestNews(newsData);

      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return { day: "00", month: "---" };
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: months[date.getMonth()]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 md:w-64 h-48 md:h-64 bg-blue-600/30 rounded-full blur-[80px] animate-pulse"></div>
         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="relative z-10 flex flex-col items-center">
           <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className={`w-20 h-20 md:w-28 md:h-28 flex items-center justify-center mb-8 relative z-20 ${globalConfig?.logoUrl ? '' : 'bg-blue-600 rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.4)] border border-blue-400/30'}`}>
              {globalConfig?.logoUrl ? (
                 <img src={globalConfig.logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
              ) : (
                 <span className="text-yellow-400 font-extrabold text-2xl tracking-widest">{globalConfig?.logoText || "PMII"}</span>
              )}
           </motion.div>
           <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs tracking-widest uppercase">
              <span>Memuat Sistem</span>
           </div>
         </motion.div>
      </div>
    );
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden w-full">
      <Navbar />

      {/* ================= HERO SECTION (REVISI RESPONSIVE) ================= */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-24 flex items-center bg-[#0f172a] overflow-hidden w-full">
        {/* Dekorasi Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[80%] md:w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-5 w-full grid lg:grid-cols-2 gap-8 items-center">
          
          {/* KOLOM TEKS */}
          <motion.div className="text-center lg:text-left flex flex-col items-center lg:items-start z-20" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-[10px] md:text-sm font-medium mb-6">
              <Sparkles size={14} className="text-yellow-400" /> Tumbuh, Bergerak, Berdampak
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 leading-[1.1] tracking-tight">
              {config?.heroTitle || "Kaderisasi \nTanpa Batas."}
            </motion.h1>

            <motion.p variants={fadeUp} className="text-sm md:text-lg text-slate-300 mb-8 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
              {config?.heroSubtitle || "Wadah pergerakan mahasiswa Islam di UIN Maulana Malik Ibrahim Malang."}
            </motion.p>

            {/* TOMBOL: flex-row (berjejer) di semua ukuran layar */}
            <motion.div variants={fadeUp} className="flex flex-row justify-center lg:justify-start gap-3 w-full sm:w-max">
              <Link href="/pendaftaran" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 text-xs md:text-sm shadow-lg">
                Gabung PMII <ArrowRight size={14} />
              </Link>
              <Link href="/struktur" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center text-xs md:text-sm">
                Kenali Pengurus
              </Link>
            </motion.div>
          </motion.div>

          {/* KOLOM GAMBAR (REVISI: Muncul di semua layar, ukuran menyesuaikan) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8 }} 
            className="relative w-full flex justify-center lg:justify-end items-end h-[300px] md:h-[400px] lg:h-[500px] mt-8 lg:mt-0"
          >
            {config?.heroImage ? (
                <img 
                    src={config.heroImage} 
                    alt="Ketua PMII" 
                    // max-h-full memastikan gambar tidak keluar dari kotak
                    // w-auto dan h-full menjaga proporsi
                    className="h-full w-auto object-contain drop-shadow-2xl z-10" 
                />
            ) : (
                <div className="w-full h-full bg-white/5 rounded-3xl flex items-center justify-center text-white/30 border border-white/10">
                    [Foto Kader PNG]
                </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ================= 2. OVERLAPPING STATS ================= */}
      <section className="relative z-20 max-w-6xl mx-auto px-5 -mt-20 md:-mt-24 mb-12 md:mb-20 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-6 md:p-10 border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 md:gap-0 md:divide-x divide-slate-100"
        >
          <div className="text-center px-2 md:px-6">
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-1 md:mb-2"><AnimatedCounter value={Number(config?.statKader || 200)} suffix="+" /></h3>
            <p className="text-xs md:text-base text-slate-500 font-medium">Kader Aktif</p>
          </div>
          <div className="text-center px-2 md:px-6">
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-1 md:mb-2"><AnimatedCounter value={Number(config?.statRayon || 3)} /></h3>
            <p className="text-xs md:text-base text-slate-500 font-medium">Rayon Fakultas</p>
          </div>
          <div className="text-center px-2 md:px-6">
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-1 md:mb-2"><AnimatedCounter value={Number(config?.statKegiatan || 50)} suffix="+" /></h3>
            <p className="text-xs md:text-base text-slate-500 font-medium">Kegiatan/Tahun</p>
          </div>
          <div className="text-center px-2 md:px-6">
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-1 md:mb-2"><AnimatedCounter value={Number(config?.statAlumni || 1000)} suffix="+" /></h3>
            <p className="text-xs md:text-base text-slate-500 font-medium">Jejaring Alumni</p>
          </div>
        </motion.div>
      </section>

      {/* ================= 3. SEJARAH ================= */}
      <section className="py-8 md:py-20 px-5 max-w-7xl mx-auto overflow-hidden w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-blue-600 rounded-2xl transform -translate-x-3 translate-y-3 md:-translate-x-4 md:translate-y-4"></div>
            <div className="relative h-56 sm:h-64 md:h-80 lg:h-[450px] bg-slate-200 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center">
               {config?.sejarahImage ? (
                  <img src={config.sejarahImage} alt="Sejarah PMII" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-xs md:text-base text-slate-500 font-medium z-10">Gambar Sejarah</span>
               )}
            </div>
            <div className="absolute -bottom-3 -right-3 md:-bottom-6 md:-right-6 bg-white p-4 md:p-6 rounded-xl shadow-xl border border-slate-50">
               <p className="text-2xl md:text-4xl font-extrabold text-blue-600 mb-0">{config?.sejarahTahun || "1960"}</p>
               <p className="text-[10px] md:text-sm text-slate-600 font-semibold">Tahun Berdiri</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
             <div className="inline-block bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs md:text-sm mb-3">Jejak Pergerakan</div>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
               {config?.sejarahTitle || "Menyatukan Keislaman, Keilmuan & Kebangsaan"}
             </h2>
            <div className="space-y-4 md:space-y-6 text-slate-600 text-sm md:text-lg leading-relaxed">
              <p>{config?.sejarahDesc || "Pergerakan Mahasiswa Islam Indonesia (PMII) lahir sebagai wadah perjuangan mahasiswa berlandaskan Islam Ahlussunnah Wal Jama'ah."}</p>
              <div className="pl-4 border-l-4 border-yellow-400 bg-slate-50 py-3 pr-4 rounded-r-lg">
                <p className="italic text-slate-700 text-sm md:text-base">"{config?.sejarahQuote || "Menjadikan Dzikir, Fikir, dan Amal Sholeh..."}"</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= 4. NILAI DASAR PERGERAKAN (EKSKLUSIF MINIMALIS) ================= */}
      {/* Warna latar belakang dirancang gelap (slate-900) dengan tipografi bersih */}
      <section className="bg-slate-900 py-20 md:py-28 px-5 text-white relative overflow-hidden mt-12 md:mt-20 w-full">
        <div className="max-w-7xl mx-auto relative z-10">
          
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 md:mb-5 tracking-tight">
              {config?.nilaiTitle || "Nilai Dasar"} <span className="text-yellow-400">{config?.nilaiHighlight || "Pergerakan"}</span>
            </h2>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto px-4">
              {config?.nilaiSubtitle || "Arah pembentukan kader dan orientasi perjuangan organisasi."}
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {[
              { icon: <Target className="w-6 h-6"/>, color: "blue", title: config?.nilai1Title || "Intelektualitas & Kritis", desc: config?.nilai1Desc || "Fokus pada kajian ilmiah, peningkatan literasi, dan penguasaan ilmu pengetahuan." },
              { icon: <ShieldCheck className="w-6 h-6"/>, color: "yellow", title: config?.nilai2Title || "Ketakwaan", desc: config?.nilai2Desc || "Berlandaskan iman dan kedekatan kepada Allah SWT." },
              { icon: <Handshake className="w-6 h-6"/>, color: "emerald", title: config?.nilai3Title || "Pengabdian", desc: config?.nilai3Desc || "Turun langsung melakukan advokasi isu-isu kemasyarakatan." },
              { icon: <Landmark className="w-6 h-6"/>, color: "purple", title: config?.nilai4Title || "Komitmen Kebangsaan", desc: config?.nilai4Desc || "Berjuang menjaga cita-cita kemerdekaan Indonesia dan merawat kebhinekaan." }
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} 
                // Pendekatan Card Gelap Elegan
                className="bg-slate-800/50 border border-slate-700/50 rounded-[1.5rem] p-8 md:p-10 hover:bg-slate-800 transition-colors group flex flex-col items-start"
              >
                <div className={`w-14 h-14 bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-full flex items-center justify-center mb-6 text-${item.color}-400 group-hover:bg-${item.color}-500/20 transition-colors`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{item.title}</h3>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= 5. KABAR TERBARU ================= */}
      <section className="bg-[#f8fafc] py-16 md:py-24 px-5 overflow-hidden w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-row justify-between items-end mb-8 gap-4">
            <div>
              <div className="inline-block bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-full text-xs md:text-sm mb-2">Publikasi</div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-none">Kabar <span className="text-blue-600">Terbaru</span></h2>
            </div>
            <Link href="/berita" className="flex items-center gap-1 text-xs md:text-base text-blue-600 font-semibold hover:text-blue-700 whitespace-nowrap">Semua <ArrowRight size={14} /></Link>
          </div>
          
          {latestNews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestNews.map((berita) => {
                const date = formatDate(berita.createdAt);
                return (
                  <div key={berita.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 p-5 hover:shadow-lg transition-all group flex flex-col h-full">
                    <div className="relative h-48 bg-slate-200 rounded-xl mb-4 overflow-hidden shrink-0">
                      {berita.imageUrl ? (
                        <img src={berita.imageUrl} alt={berita.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Tanpa Gambar</div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900 rounded-lg px-3 py-1.5 text-center shadow-md">
                         <p className="text-xs md:text-sm font-extrabold leading-none">{date.day}</p>
                         <p className="text-[10px] font-bold uppercase text-blue-600 mt-1">{date.month}</p>
                      </div>
                    </div>
                    
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 block">
                      {berita.kategori || "Berita"}
                    </span>
                    <h3 className="font-bold text-slate-900 text-lg md:text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {berita.title}
                    </h3>
                    <p className="text-slate-500 text-sm md:text-xs line-clamp-2 mb-4 leading-relaxed grow">
                      {berita.excerpt || "Baca selengkapnya untuk mengetahui detail informasi ini..."}
                    </p>
                    <Link href={`/berita`} className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-auto pt-4 border-t border-slate-50">
                      Baca Selengkapnya <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-10 text-center">
               <Newspaper size={40} className="mx-auto text-slate-300 mb-3" />
               <h3 className="text-lg font-bold text-slate-700">Belum Ada Berita</h3>
               <p className="text-sm text-slate-500 mt-1">Silakan tambahkan publikasi pertama melalui Panel Admin Manajemen Berita.</p>
            </div>
          )}
        </div>
      </section>

      {/* ================= 6. CTA ================= */}
      <section className="px-5 pb-16 md:pb-24 max-w-7xl mx-auto overflow-hidden w-full">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[2rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-blue-500/10">
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-400 rounded-full blur-[40px] opacity-30"></div>
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-400 rounded-full blur-[40px] opacity-30"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
              {config?.ctaTitle || "Mari Melangkah Bersama PMII."}
            </h2>
            <p className="text-blue-100 mb-8 md:mb-10 text-sm md:text-lg leading-relaxed">
              {config?.ctaSubtitle || "Sistem pendataan terintegrasi telah dibuka. Daftarkan diri Anda dan jadilah bagian dari agen perubahan yang progresif."}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-max mx-auto mt-2">
               <Link href="/pendaftaran" className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-3.5 px-8 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm md:text-base">
                 Daftar Sekarang <ArrowRight size={16} />
               </Link>
               <Link href="/anggota" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm font-semibold py-3.5 px-8 rounded-xl flex items-center justify-center text-sm md:text-base">
                 Cari Kader
               </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}