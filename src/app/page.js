"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Landmark, Target, Handshake, Calendar, ArrowRight, 
  ShieldCheck, Sparkles, Newspaper, User, Image as ImageIcon,
  Trophy, Medal, Award, ChevronRight, Star, GraduationCap, Flame
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// IMPORT FIREBASE
import { db } from "@/lib/firebase"; 
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

// IMPORT FRAMER MOTION
import { motion, useInView, AnimatePresence } from "framer-motion";

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

  const displayCount = count >= 1000 ? (count / 1000).toFixed(1).replace('.0', '') + "K" : count;

  return (
    <span ref={ref}>
      {displayCount}
      {count > 0 && <span className="text-blue-600 dark:text-blue-400">{suffix}</span>}
    </span>
  );
};

export default function Home() {
  const [config, setConfig] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [latestNews, setLatestNews] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // STATE SLIDER HERO
  const [currentSlide, setCurrentSlide] = useState(0);

  // STATE STATISTIK
  const [stats, setStats] = useState({ kader: 0, rayon: 0, proker: 0, alumni: 0 });

  // STATE APRESIASI KADER
  const [topAkademik, setTopAkademik] = useState([]);
  const [topNonAkademik, setTopNonAkademik] = useState([]);

  useEffect(() => {
    const cachedGlobal = localStorage.getItem('pmii_global_config');
    if (cachedGlobal) setGlobalConfig(JSON.parse(cachedGlobal));

    async function fetchData() {
      try {
        const [
          berandaSnap, globalSnap, anggotaSnap,
          rayonSnap, adminSnap, alumniSnap, apresiasiSnap
        ] = await Promise.all([
          getDoc(doc(db, "website_config", "settings")),
          getDoc(doc(db, "website_config", "global")),
          getDoc(doc(db, "website_config", "database_anggota")),
          getDoc(doc(db, "website_config", "database_rayon")),
          getDoc(doc(db, "website_config", "database_administrasi")),
          getDoc(doc(db, "website_config", "database_alumni")),
          getDoc(doc(db, "website_config", "database_apresiasi")) 
        ]);
        
        if (berandaSnap.exists()) setConfig(berandaSnap.data());
        if (globalSnap.exists()) {
          const gData = globalSnap.data();
          setGlobalConfig(gData);
          localStorage.setItem('pmii_global_config', JSON.stringify(gData));
        }

        if (apresiasiSnap.exists()) {
          const listApresiasi = apresiasiSnap.data().listApresiasi || [];
          const scores = [];

          listApresiasi.forEach(kader => {
            if (!kader.prestasi || !Array.isArray(kader.prestasi)) return;
            let countAkad = 0;
            let countNonAkad = 0;

            kader.prestasi.forEach(p => {
              const kat = (p.tipe || p.kategori || "").toLowerCase();
              if ((kat.includes("akad") && !kat.includes("non")) || kat.includes("kaderisasi") || kat.includes("jurnal") || kat.includes("sertifikasi")) {
                countAkad += 1;
              } else if (kat.includes("non") || kat.includes("lomba") || kat.includes("minat") || kat.includes("bakat")) {
                countNonAkad += 1;
              }
            });

            scores.push({
              nama: kader.namaLengkap || kader.namaKader || kader.nama || "Tanpa Nama",
              foto: kader.fotoKader || kader.foto || "",
              asalRayon: kader.asalRayon || kader.rayon || "",
              akademik: countAkad,
              nonAkademik: countNonAkad
            });
          });

          const akademikRanks = scores.filter(x => x.akademik > 0).map(x => ({ ...x, jumlahPrestasi: x.akademik })).sort((a, b) => b.akademik - a.akademik).slice(0, 3);
          const nonAkademikRanks = scores.filter(x => x.nonAkademik > 0).map(x => ({ ...x, jumlahPrestasi: x.nonAkademik })).sort((a, b) => b.nonAkademik - a.nonAkademik).slice(0, 3);

          setTopAkademik(akademikRanks);
          setTopNonAkademik(nonAkademikRanks);
        }

        if (anggotaSnap.exists()) setStats(prev => ({ ...prev, kader: (anggotaSnap.data().listAnggota || []).length }));
        if (rayonSnap.exists()) setStats(prev => ({ ...prev, rayon: (rayonSnap.data().listRayon || []).length }));
        if (adminSnap.exists()) setStats(prev => ({ ...prev, proker: (adminSnap.data().listProker || []).length }));
        if (alumniSnap.exists()) setStats(prev => ({ ...prev, alumni: (alumniSnap.data().listAlumni || []).length }));

        const newsRef = collection(db, "berita");
        const q = query(newsRef, orderBy("createdAt", "desc"), limit(3));
        const newsSnap = await getDocs(q);
        setLatestNews(newsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getCurrentMonth = () => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
  };

  // ================= DATA SLIDER HERO (TERHUBUNG KE FIREBASE ADMIN) =================
  const HERO_SLIDES = config?.heroSlides && config.heroSlides.length > 0 
    ? config.heroSlides 
    : [
        {
          id: "default-1",
          badge: "Tumbuh, Bergerak, Berdampak",
          title: config?.heroTitle || "Kaderisasi \nTanpa Batas.",
          subtitle: config?.heroSubtitle || "Memuat data dari server...",
          button1Text: "Gabung PMII",
          button1Link: "/pendaftaran",
          button2Text: "Kenali Pengurus",
          button2Link: "/struktur",
          image: config?.heroImage || "",
          bgColor: "from-[#0f172a] to-[#1e293b]"
        }
      ];

  // Efek Slider Otomatis tiap 5 Detik
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [HERO_SLIDES.length]);


  // ================= KOMPONEN KARTU SUPER RESPONSIP KHUSUS 3 KOLOM HP =================
  const AppreciationCard = ({ data, index, category }) => {
    const isFirst = index === 0;
    const colors = [
      "from-amber-400 to-yellow-600", 
      "from-slate-300 to-slate-500", 
      "from-orange-400 to-orange-700" 
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`relative group bg-white dark:bg-slate-800 rounded-xl md:rounded-3xl p-2 md:p-6 shadow-xl border flex flex-col items-center justify-between transition-transform duration-300
        ${isFirst ? 'scale-105 md:scale-105 z-10 border-amber-200 dark:border-amber-700/50' : 'scale-95 md:scale-95 opacity-95 hover:opacity-100 border-slate-100 dark:border-slate-700'}`}
      >
        <div className={`absolute -top-2.5 md:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r ${colors[index]} text-white px-2 md:px-4 py-0.5 md:py-1 rounded-full text-[8px] md:text-xs font-black shadow-lg flex items-center gap-1 whitespace-nowrap`}>
          {isFirst ? <Trophy className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" /> : <Award className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />}
          <span className="hidden md:inline">PERINGKAT</span> <span className="md:hidden">#</span>{index + 1}
        </div>

        <div className="relative mt-2 md:mt-4 mb-2 md:mb-4 shrink-0">
          <div className={`w-12 h-12 md:w-24 md:h-24 rounded-full p-[2px] md:p-1 bg-gradient-to-tr ${colors[index]} overflow-hidden`}>
            <div className="relative w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center border-[1.5px] md:border-2 border-white dark:border-slate-800">
              {data.foto ? (
                <Image 
                  src={data.foto} 
                  alt={data.nama} 
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <User className="w-6 h-6 md:w-10 md:h-10 text-slate-300 dark:text-slate-600" />
              )}
            </div>
          </div>
          {isFirst && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-4px] md:inset-[-8px] border-[1.5px] md:border-2 border-dashed border-amber-400 rounded-full opacity-50 pointer-events-none"
            />
          )}
        </div>

        <div className="flex flex-col items-center flex-grow justify-start w-full px-0.5 text-center mb-2 md:mb-4">
          <h4 className="text-slate-900 dark:text-slate-100 font-bold text-[10px] md:text-base line-clamp-2 leading-tight mb-0.5 md:mb-1" title={data.nama}>{data.nama}</h4>
          <p className="text-slate-500 dark:text-slate-400 text-[7px] md:text-xs font-bold uppercase tracking-widest line-clamp-1" title={data.asalRayon || "Kader PMII"}>{data.asalRayon || "Kader PMII"}</p>
        </div>

        <div className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-lg md:rounded-xl p-1.5 md:p-4 flex flex-col md:flex-row justify-center md:justify-between items-center mb-2 md:mb-4 shrink-0 border border-slate-100 dark:border-slate-600 text-center md:text-left gap-0 md:gap-2">
          <div className="flex flex-col">
            <span className="hidden md:block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase leading-none mb-1">Total {category}</span>
            <span className={`text-[12px] md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r ${colors[index]} leading-none flex items-center justify-center md:justify-start gap-1`}>
              {data.jumlahPrestasi || 0} <span className="text-[8px] md:text-sm font-bold text-slate-600 dark:text-slate-400 md:mt-0.5">Prestasi</span>
            </span>
          </div>
          <div className={`hidden md:block p-2 rounded-xl bg-gradient-to-br ${colors[index]} text-white shadow-sm shrink-0`}>
            {category === 'Akademik' ? <GraduationCap className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
          </div>
        </div>

        <Link 
          href={`/apresiasi?kader=${encodeURIComponent(data.nama)}`}
          className={`w-full py-1.5 md:py-2.5 rounded-lg md:rounded-xl font-bold text-[9px] md:text-sm flex items-center justify-center gap-1 md:gap-2 transition-all border shrink-0
          ${isFirst ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          Lihat <span className="hidden md:inline">Profil</span> <ChevronRight className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
        </Link>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 md:w-64 h-48 md:h-64 bg-blue-600/30 rounded-full blur-[80px] animate-pulse"></div>
         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="relative z-10 flex flex-col items-center">
           <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className={`w-20 h-20 md:w-28 md:h-28 flex items-center justify-center mb-8 relative z-20 ${globalConfig?.logoUrl ? '' : 'bg-blue-600 rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.4)] border border-blue-400/30'}`}>
              {globalConfig?.logoUrl ? (
                 <Image src={globalConfig.logoUrl} alt="Logo" fill className="object-contain drop-shadow-2xl" sizes="112px"/>
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

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 overflow-x-hidden w-full transition-colors duration-300">
      <Navbar />

      {/* ================= HERO SLIDER SECTION ================= */}
      <section className={`relative pt-24 pb-12 md:pt-28 md:pb-16 flex flex-col items-center bg-gradient-to-br ${HERO_SLIDES[currentSlide]?.bgColor || 'from-[#0f172a] to-[#1e293b]'} overflow-hidden w-full transition-colors duration-1000`}>
        <div className="absolute top-[-10%] left-[-10%] w-[80%] md:w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-5 w-full">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center"
            >
              <div className="text-center lg:text-left flex flex-col items-center lg:items-start z-20">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs md:text-sm font-medium mb-4 md:mb-6 backdrop-blur-md mt-4 lg:mt-0 shadow-lg">
                  <Sparkles size={14} className="text-yellow-400" /> {HERO_SLIDES[currentSlide]?.badge}
                </div>
                
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-4 leading-[1.2] lg:leading-[1.1] tracking-tight whitespace-pre-line drop-shadow-md">
                  {HERO_SLIDES[currentSlide]?.title}
                </h1>
                
                <p className="text-sm md:text-lg text-slate-300 mb-6 md:mb-8 font-light leading-relaxed max-w-xl mx-auto lg:mx-0 drop-shadow-md">
                  {HERO_SLIDES[currentSlide]?.subtitle}
                </p>
                
                <div className="flex flex-row justify-center lg:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
                  <Link href={HERO_SLIDES[currentSlide]?.button1Link || "#"} className="flex-1 sm:flex-none bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-3 sm:py-3.5 px-2 sm:px-6 rounded-xl transition flex items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-sm shadow-lg text-center">
                    {HERO_SLIDES[currentSlide]?.button1Text} <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                  </Link>
                  <Link href={HERO_SLIDES[currentSlide]?.button2Link || "#"} className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm font-semibold py-3 sm:py-3.5 px-2 sm:px-6 rounded-xl transition flex items-center justify-center text-[11px] sm:text-sm text-center shadow-lg">
                    {HERO_SLIDES[currentSlide]?.button2Text}
                  </Link>
                </div>
              </div>

              <div className="relative w-full flex justify-center lg:justify-end items-end h-[240px] sm:h-[350px] lg:h-[450px]">
                {HERO_SLIDES[currentSlide]?.image ? (
                    <Image 
                      src={HERO_SLIDES[currentSlide].image} 
                      alt="Hero Image" 
                      fill
                      className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-10" 
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                ) : (
                    <div className="w-full h-full bg-white/5 rounded-3xl flex flex-col items-center justify-center text-white/30 border border-white/10 backdrop-blur-sm"><ImageIcon size={64} /></div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* INDIKATOR TITIK-TITIK SLIDER */}
          {HERO_SLIDES.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 md:mt-4 z-20 relative">
              {HERO_SLIDES.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all duration-300 rounded-full ${idx === currentSlide ? 'w-8 h-2 bg-yellow-400' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-5 -mt-6 md:-mt-10 mb-16 sm:mb-20 w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 grid grid-cols-2 lg:grid-cols-4 gap-y-8 lg:divide-x divide-slate-100 dark:divide-slate-700">
          <div className="text-center px-2 sm:px-4">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 mb-1"><AnimatedCounter value={stats.kader} suffix="" /></h3>
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Total Kader</p>
          </div>
          <div className="text-center px-2 sm:px-4 border-l lg:border-none border-slate-100 dark:border-slate-700">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 mb-1"><AnimatedCounter value={stats.rayon} /></h3>
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Total Rayon</p>
          </div>
          <div className="text-center px-2 sm:px-4">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 mb-1"><AnimatedCounter value={stats.proker} suffix="" /></h3>
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Proker Komisariat</p>
          </div>
          <div className="text-center px-2 sm:px-4 border-l lg:border-none border-slate-100 dark:border-slate-700">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 mb-1"><AnimatedCounter value={stats.alumni} suffix="" /></h3>
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Jaringan Alumni</p>
          </div>
        </motion.div>
      </section>

      {/* ================= APRESIASI KADER ================= */}
      <section className="py-12 md:py-20 px-2 md:px-5 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8 md:mb-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.2em] mb-4 border border-amber-200 dark:border-amber-800/50">
            <Star className="w-3.5 h-3.5" fill="currentColor" /> Hall of Fame
          </motion.div>
          <h2 className="text-2xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 md:mb-3 tracking-tight">Apresiasi <span className="text-blue-600 dark:text-blue-400">Kader</span></h2>
          <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium">Periode: <span className="text-slate-800 dark:text-slate-200 font-bold">{getCurrentMonth()}</span></p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 px-1 md:px-0">
          
          {/* KATEGORI AKADEMIK */}
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-5 md:mb-8 border-b-2 border-slate-100 dark:border-slate-700 pb-3 md:pb-4 px-2 md:px-0">
              <div className="bg-blue-600 p-2 md:p-2.5 rounded-xl md:rounded-2xl text-white shadow-lg shadow-blue-200 dark:shadow-none shrink-0"><GraduationCap className="w-4 h-4 md:w-6 md:h-6" /></div>
              <div>
                <h3 className="text-sm md:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">Prestasi Akademik</h3>
                <p className="text-[8px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase leading-tight mt-0.5 md:mt-1">Berdasarkan Sertifikasi & Lomba</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 md:gap-6">
              {topAkademik.length > 0 ? topAkademik.map((kader, i) => (
                <AppreciationCard key={kader.id || i} data={kader} index={i} category="Akademik" />
              )) : (
                <div className="col-span-3 py-10 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-sm font-bold">Data akademik belum tersedia.</div>
              )}
            </div>
          </div>

          {/* KATEGORI NON-AKADEMIK */}
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-5 md:mb-8 border-b-2 border-slate-100 dark:border-slate-700 pb-3 md:pb-4 px-2 md:px-0">
              <div className="bg-orange-500 p-2 md:p-2.5 rounded-xl md:rounded-2xl text-white shadow-lg shadow-orange-200 dark:shadow-none shrink-0"><Flame className="w-4 h-4 md:w-6 md:h-6" /></div>
              <div>
                <h3 className="text-sm md:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">Minat & Bakat</h3>
                <p className="text-[8px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase leading-tight mt-0.5 md:mt-1">Berdasarkan Prestasi Non-Akademik</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 md:gap-6">
              {topNonAkademik.length > 0 ? topNonAkademik.map((kader, i) => (
                <AppreciationCard key={kader.id || i} data={kader} index={i} category="Non-Akademik" />
              )) : (
                <div className="col-span-3 py-10 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-sm font-bold">Data non-akademik belum tersedia.</div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ================= SEJARAH SECTION ================= */}
      <section className="py-16 md:py-20 px-5 max-w-7xl mx-auto overflow-hidden w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative order-2 lg:order-1 px-4 sm:px-0">
            <div className="absolute inset-0 bg-blue-600 rounded-3xl transform -translate-x-3 translate-y-3 md:-translate-x-4 md:translate-y-4"></div>
            <div className="relative h-64 md:h-[450px] bg-slate-200 dark:bg-slate-700 rounded-3xl overflow-hidden shadow-2xl">
               {config?.sejarahImage ? (
                  <Image 
                    src={config.sejarahImage} 
                    alt="Sejarah" 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 1024px) 100vw, 50vw" 
                  />
               ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={48} /></div>
               )}
            </div>
            <div className="absolute -bottom-4 -right-2 md:-bottom-6 md:-right-6 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-2xl border border-slate-50 dark:border-slate-700">
               <p className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400">{config?.sejarahTahun || "1960"}</p>
               <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Tahun Berdiri</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
             <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 font-black px-4 py-1.5 rounded-full text-[10px] md:text-xs mb-4 uppercase tracking-widest">Jejak Pergerakan</div>
             <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
               {config?.sejarahTitle || "Menyatukan Keislaman, Keilmuan & Kebangsaan"}
             </h2>
            <div className="space-y-4 md:space-y-6 text-slate-600 dark:text-slate-300 text-sm md:text-lg leading-relaxed">
              <p>{config?.sejarahDesc || "Pergerakan Mahasiswa Islam Indonesia (PMII) lahir sebagai wadah perjuangan mahasiswa berlandaskan Islam Ahlussunnah Wal Jama'ah."}</p>
              <div className="pl-4 md:pl-6 border-l-4 border-yellow-400 bg-white dark:bg-slate-800 py-3 md:py-4 pr-3 md:pr-4 rounded-r-2xl md:rounded-r-3xl shadow-sm italic">
                <p className="text-slate-800 dark:text-slate-200 text-sm md:text-base">"{config?.sejarahQuote || "Menjadikan Dzikir, Fikir, dan Amal Sholeh..."}"</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= NILAI DASAR SECTION ================= */}
      <section className="bg-[#0f172a] py-16 md:py-24 px-5 text-white relative overflow-hidden w-full">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">
              {config?.nilaiTitle || "Nilai Dasar"} <span className="text-yellow-400">{config?.nilaiHighlight || "Pergerakan"}</span>
            </h2>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto font-medium px-4">Arah pembentukan kader dan orientasi perjuangan organisasi.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {[
              { icon: <Target />, color: "blue", title: config?.nilai1Title || "Intelektualitas", desc: config?.nilai1Desc || "Fokus pada kajian ilmiah dan penguasaan ilmu pengetahuan." },
              { icon: <ShieldCheck />, color: "yellow", title: config?.nilai2Title || "Ketakwaan", desc: config?.nilai2Desc || "Berlandaskan iman dan kedekatan kepada Allah SWT." },
              { icon: <Handshake />, color: "emerald", title: config?.nilai3Title || "Pengabdian", desc: config?.nilai3Desc || "Turun langsung melakukan advokasi isu-isu kemasyarakatan." },
              { icon: <Landmark />, color: "purple", title: config?.nilai4Title || "Kebangsaan", desc: config?.nilai4Desc || "Menjaga cita-cita kemerdekaan dan merawat kebhinekaan." }
            ].map((item, idx) => (
              <motion.div key={idx} whileHover={{ y: -5 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl md:rounded-3xl p-6 md:p-8 transition-colors hover:bg-slate-800/60">
                <div className={`w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-yellow-400`}>{item.icon}</div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 tracking-tight">{item.title}</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= BERITA TERBARU SECTION ================= */}
      <section className="bg-white dark:bg-slate-900 py-16 md:py-24 px-5 overflow-hidden w-full transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-12">
            <div>
              <div className="inline-block bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 font-black px-4 py-1.5 rounded-full text-[10px] md:text-xs mb-3 uppercase tracking-widest">Publikasi</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">Kabar <span className="text-blue-600 dark:text-blue-400">Terbaru</span></h2>
            </div>
            <Link href="/berita" className="flex items-center gap-2 text-sm md:text-base text-blue-600 dark:text-blue-400 font-bold hover:gap-3 transition-all bg-blue-50 dark:bg-blue-900/20 sm:bg-transparent px-4 py-2 sm:p-0 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
               Semua Berita <ArrowRight size={18} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {latestNews.map((berita) => (
              <div key={berita.id} className="bg-[#f8fafc] dark:bg-slate-800/80 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 p-4 md:p-5 hover:shadow-xl transition-all group flex flex-col h-full">
                <div className="relative h-48 md:h-52 bg-slate-200 dark:bg-slate-700 rounded-xl md:rounded-2xl mb-4 md:mb-5 overflow-hidden">
                  {berita.imageUrl ? (
                    <Image 
                      src={berita.imageUrl} 
                      alt="Berita" 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                      sizes="(max-width: 768px) 100vw, 33vw" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500"><ImageIcon size={32} /></div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-900 dark:text-slate-100 rounded-lg md:rounded-xl px-2.5 py-1.5 md:px-3 md:py-2 text-center shadow-lg font-black border border-slate-100 dark:border-slate-600">
                     <p className="text-base md:text-lg leading-none">{berita.createdAt?.toDate ? berita.createdAt.toDate().getDate() : "00"}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 block">{berita.kategori}</span>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg md:text-xl mb-2 md:mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{berita.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm line-clamp-2 mb-4 md:mb-6 leading-relaxed grow">{berita.excerpt}</p>
                <Link href={`/berita/${berita.id}`} className="inline-flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pt-4 md:pt-5 border-t border-slate-200/50 dark:border-slate-700/50">BACA SELENGKAPNYA <ArrowRight size={14} /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="px-4 sm:px-5 pb-16 md:pb-24 max-w-7xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 md:mb-6 leading-tight tracking-tight">Mari Melangkah <br/>Bersama PMII.</h2>
            <p className="text-blue-100 mb-8 md:mb-10 text-sm md:text-lg leading-relaxed opacity-80 px-2">Daftarkan diri Anda dan jadilah bagian dari agen perubahan yang progresif untuk masa depan Indonesia.</p>
            <div className="flex flex-row justify-center gap-2 sm:gap-4 w-full">
               <Link href="/pendaftaran" className="flex-1 sm:flex-none bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black py-3 md:py-4 px-2 sm:px-10 rounded-xl md:rounded-2xl transition shadow-xl text-[10px] sm:text-base flex items-center justify-center gap-1 sm:gap-2 text-center leading-tight">
                 DAFTAR SEKARANG <ArrowRight size={14} className="sm:w-[18px] sm:h-[18px] shrink-0" />
               </Link>
               <Link href="/anggota" className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md font-bold py-3 md:py-4 px-2 sm:px-10 rounded-xl md:rounded-2xl flex items-center justify-center text-[10px] sm:text-base text-center leading-tight">
                 CARI KADER
               </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}