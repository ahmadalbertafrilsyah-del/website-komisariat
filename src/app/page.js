"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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

  const displayCount = count >= 1000 ? (count / 1000).toFixed(1).replace('.0', '') + "K" : count;

  return (
    <span ref={ref}>
      {displayCount}
      {count > 0 && <span className="text-blue-600">{suffix}</span>}
    </span>
  );
};

export default function Home() {
  const [config, setConfig] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [latestNews, setLatestNews] = useState([]); 
  const [loading, setLoading] = useState(true);
  
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

        // ================= LOGIKA MEMBACA ARRAY BERTINGKAT (NESTED) =================
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

          const akademikRanks = scores
            .filter(x => x.akademik > 0)
            .map(x => ({ ...x, jumlahPrestasi: x.akademik }))
            .sort((a, b) => b.akademik - a.akademik)
            .slice(0, 3);

          const nonAkademikRanks = scores
            .filter(x => x.nonAkademik > 0)
            .map(x => ({ ...x, jumlahPrestasi: x.nonAkademik }))
            .sort((a, b) => b.nonAkademik - a.nonAkademik)
            .slice(0, 3);

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

  // ================= PERBAIKAN: KOMPONEN KARTU SUPER RESPONSIP (MICRO UI HP) =================
  const AppreciationCard = ({ data, index, category }) => {
    const isFirst = index === 0;
    const colors = [
      "from-amber-400 to-yellow-600", // Peringkat 1
      "from-slate-300 to-slate-500", // Peringkat 2
      "from-orange-400 to-orange-700" // Peringkat 3
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`relative group bg-white rounded-xl md:rounded-3xl p-3 md:p-6 shadow-xl border border-slate-100 flex flex-col items-center justify-between ${isFirst ? 'scale-105 z-10 border-amber-200' : 'scale-95 opacity-90'}`}
      >
        {/* Badge Peringkat (Responsive Text & Padding) */}
        <div className={`absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r ${colors[index]} text-white px-2 py-0.5 md:px-4 md:py-1 rounded-full text-[8px] md:text-xs font-black shadow-lg flex items-center gap-1 whitespace-nowrap`}>
          {isFirst ? <Trophy className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" /> : <Award className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />}
          <span className="hidden sm:inline">PERINGKAT</span> {index + 1}
        </div>

        {/* Foto Profil (Responsive Size) */}
        <div className="relative mt-2 md:mt-4 mb-2 md:mb-4 shrink-0">
          <div className={`w-12 h-12 md:w-24 md:h-24 rounded-full p-[2px] md:p-1 bg-gradient-to-tr ${colors[index]} overflow-hidden`}>
            <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center border-[1.5px] md:border-2 border-white">
              {data.foto ? (
                <img src={data.foto} alt={data.nama} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 md:w-10 md:h-10 text-slate-300" />
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

        {/* Info Nama (Responsive Font Size & Line Clamp) */}
        <div className="flex flex-col items-center flex-grow justify-start w-full px-1">
          <h4 className="text-slate-900 font-bold text-[5px] md:text-base text-center line-clamp-2 md:line-clamp-1 leading-tight mb-1" title={data.nama}>{data.nama}</h4>
          <p className="text-slate-500 text-[4px] md:text-[5px] font-bold uppercase tracking-wider md:tracking-widest mb-2 md:mb-4 line-clamp-1 text-center" title={data.asalRayon || "Kader PMII"}>{data.asalRayon || "Kader PMII"}</p>
        </div>

        {/* Counter Prestasi (Responsive Layout) */}
        <div className="w-full bg-slate-50 rounded-lg md:rounded-2xl p-1.5 md:p-3 flex justify-between items-center mb-2 md:mb-5 shrink-0">
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5 hidden md:block">Total {category}</span>
            <span className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5 md:hidden">Total</span>
            <span className={`text-[5px] md:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${colors[index]} leading-none`}>
              {data.jumlahPrestasi || 0} <span className="hidden md:inline">Prestasi</span>
            </span>
          </div>
          <div className={`p-1.5 md:p-2 rounded-md md:rounded-xl bg-gradient-to-br ${colors[index]} text-white shadow-sm shrink-0`}>
            {category === 'Akademik' ? <GraduationCap className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" /> : <Flame className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />}
          </div>
        </div>

        {/* Tombol Lihat (Responsive Padding & Font Size) */}
        <Link 
          href={`/apresiasi?kader=${encodeURIComponent(data.nama)}`}
          className={`w-full py-1.5 md:py-2.5 rounded-lg md:rounded-xl font-bold text-[8px] md:text-xs flex items-center justify-center gap-1 md:gap-2 transition-all border shrink-0
          ${isFirst ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
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

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden w-full">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-24 flex items-center bg-[#0f172a] overflow-hidden w-full">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] md:w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-5 w-full grid lg:grid-cols-2 gap-8 items-center">
          <motion.div className="text-center lg:text-left flex flex-col items-center lg:items-start z-20" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-[10px] md:text-sm font-medium mb-6 backdrop-blur-md">
              <Sparkles size={14} className="text-yellow-400" /> Tumbuh, Bergerak, Berdampak
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 leading-[1.1] tracking-tight whitespace-pre-line">
              {config?.heroTitle || "Kaderisasi \nTanpa Batas."}
            </h1>
            <p className="text-sm md:text-lg text-slate-300 mb-8 font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
              {config?.heroSubtitle || "Wadah pergerakan mahasiswa Islam di UIN Maulana Malik Ibrahim Malang."}
            </p>
            <div className="flex flex-row justify-center lg:justify-start gap-3 w-full sm:w-max">
              <Link href="/pendaftaran" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 text-xs md:text-sm shadow-lg">
                Gabung PMII <ArrowRight size={14} />
              </Link>
              <Link href="/struktur" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center text-xs md:text-sm">
                Kenali Pengurus
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full flex justify-center lg:justify-end items-end h-[300px] md:h-[400px] lg:h-[500px]">
            {config?.heroImage ? (
                <img src={config.heroImage} alt="Ketua" className="h-full w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-10" />
            ) : (
                <div className="w-full h-full bg-white/5 rounded-3xl flex flex-col items-center justify-center text-white/30 border border-white/10 backdrop-blur-sm"><User size={64} /></div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section className="relative z-20 max-w-6xl mx-auto px-5 -mt-20 mb-20 w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-y-8 md:divide-x divide-slate-100">
          <div className="text-center px-4">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-1"><AnimatedCounter value={stats.kader} suffix="+" /></h3>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">Total Kader</p>
          </div>
          <div className="text-center px-4">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-1"><AnimatedCounter value={stats.rayon} /></h3>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">Total Rayon</p>
          </div>
          <div className="text-center px-4">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-1"><AnimatedCounter value={stats.proker} suffix="+" /></h3>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">Proker Terlaksana</p>
          </div>
          <div className="text-center px-4">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-1"><AnimatedCounter value={stats.alumni} suffix="+" /></h3>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">Jaringan Alumni</p>
          </div>
        </motion.div>
      </section>

      {/* ================= APRESIASI KADER (TERHUBUNG DATABASE_APRESIASI) ================= */}
      <section className="py-12 md:py-20 px-3 md:px-5 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 md:mb-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.2em] mb-3 md:mb-4">
            <Star className="w-3 h-3 md:w-3.5 md:h-3.5" fill="currentColor" /> Hall of Fame
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-2 md:mb-4 tracking-tight">Apresiasi <span className="text-blue-600">Kader Terbaik</span></h2>
          <p className="text-xs md:text-base text-slate-500 font-medium">Periode: <span className="text-slate-800 font-bold">{getCurrentMonth()}</span></p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          
          {/* KATEGORI AKADEMIK */}
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8 border-b-2 border-slate-100 pb-3 md:pb-4 px-1 md:px-0">
              <div className="bg-blue-600 p-1.5 md:p-2.5 rounded-xl md:rounded-2xl text-white shadow-lg shadow-blue-200 shrink-0"><GraduationCap className="w-4 h-4 md:w-6 md:h-6" /></div>
              <div>
                <h3 className="text-sm md:text-xl font-black text-slate-900 leading-tight">Prestasi Akademik</h3>
                <p className="text-[8px] md:text-xs text-slate-400 font-bold uppercase leading-tight">Berdasarkan Sertifikasi & IPK</p>
              </div>
            </div>
            
            {/* GRID 3 KARTU (TETAP 3 KOLOM DI HP) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
              {topAkademik.length > 0 ? topAkademik.map((kader, i) => (
                <AppreciationCard key={kader.id || i} data={kader} index={i} category="Akademik" />
              )) : (
                <div className="col-span-3 py-6 md:py-10 text-center bg-slate-50 rounded-2xl md:rounded-3xl border border-dashed border-slate-200 text-slate-400 text-[10px] md:text-sm font-bold">Data akademik belum tersedia.</div>
              )}
            </div>
          </div>

          {/* KATEGORI NON-AKADEMIK */}
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8 border-b-2 border-slate-100 pb-3 md:pb-4 px-1 md:px-0">
              <div className="bg-orange-500 p-1.5 md:p-2.5 rounded-xl md:rounded-2xl text-white shadow-lg shadow-orange-200 shrink-0"><Flame className="w-4 h-4 md:w-6 md:h-6" /></div>
              <div>
                <h3 className="text-sm md:text-xl font-black text-slate-900 leading-tight">Minat & Bakat</h3>
                <p className="text-[8px] md:text-xs text-slate-400 font-bold uppercase leading-tight">Berdasarkan Prestasi Non-Akademik</p>
              </div>
            </div>
            
            {/* GRID 3 KARTU (TETAP 3 KOLOM DI HP) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
              {topNonAkademik.length > 0 ? topNonAkademik.map((kader, i) => (
                <AppreciationCard key={kader.id || i} data={kader} index={i} category="Non-Akademik" />
              )) : (
                <div className="col-span-3 py-6 md:py-10 text-center bg-slate-50 rounded-2xl md:rounded-3xl border border-dashed border-slate-200 text-slate-400 text-[10px] md:text-sm font-bold">Data non-akademik belum tersedia.</div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ================= SEJARAH SECTION ================= */}
      <section className="py-20 px-5 max-w-7xl mx-auto overflow-hidden w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-blue-600 rounded-3xl transform -translate-x-4 translate-y-4"></div>
            <div className="relative h-56 sm:h-64 md:h-[450px] bg-slate-200 rounded-3xl overflow-hidden shadow-2xl">
               {config?.sejarahImage ? (
                  <img src={config.sejarahImage} alt="Sejarah" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={48} /></div>
               )}
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-2xl border border-slate-50">
               <p className="text-4xl font-black text-blue-600">{config?.sejarahTahun || "1960"}</p>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tahun Berdiri</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
             <div className="inline-block bg-blue-100 text-blue-700 font-black px-4 py-1 rounded-full text-xs mb-4 uppercase tracking-widest">Jejak Pergerakan</div>
             <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
               {config?.sejarahTitle || "Menyatukan Keislaman, Keilmuan & Kebangsaan"}
             </h2>
            <div className="space-y-6 text-slate-600 text-base md:text-lg leading-relaxed">
              <p>{config?.sejarahDesc || "Pergerakan Mahasiswa Islam Indonesia (PMII) lahir sebagai wadah perjuangan mahasiswa berlandaskan Islam Ahlussunnah Wal Jama'ah."}</p>
              <div className="pl-6 border-l-4 border-yellow-400 bg-white py-4 pr-4 rounded-r-3xl shadow-sm italic">
                <p className="text-slate-800">"{config?.sejarahQuote || "Menjadikan Dzikir, Fikir, dan Amal Sholeh..."}"</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= NILAI DASAR SECTION ================= */}
      <section className="bg-[#0f172a] py-24 px-5 text-white relative overflow-hidden w-full">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              {config?.nilaiTitle || "Nilai Dasar"} <span className="text-yellow-400">{config?.nilaiHighlight || "Pergerakan"}</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium">Arah pembentukan kader dan orientasi perjuangan organisasi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <Target />, color: "blue", title: config?.nilai1Title || "Intelektualitas", desc: config?.nilai1Desc || "Fokus pada kajian ilmiah dan penguasaan ilmu pengetahuan." },
              { icon: <ShieldCheck />, color: "yellow", title: config?.nilai2Title || "Ketakwaan", desc: config?.nilai2Desc || "Berlandaskan iman dan kedekatan kepada Allah SWT." },
              { icon: <Handshake />, color: "emerald", title: config?.nilai3Title || "Pengabdian", desc: config?.nilai3Desc || "Turun langsung melakukan advokasi isu-isu kemasyarakatan." },
              { icon: <Landmark />, color: "purple", title: config?.nilai4Title || "Kebangsaan", desc: config?.nilai4Desc || "Menjaga cita-cita kemerdekaan dan merawat kebhinekaan." }
            ].map((item, idx) => (
              <motion.div key={idx} whileHover={{ y: -5 }} className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 transition-colors hover:bg-slate-800/60">
                <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-yellow-400`}>{item.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= BERITA TERBARU SECTION ================= */}
      <section className="bg-white py-24 px-5 overflow-hidden w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-row justify-between items-end mb-12">
            <div>
              <div className="inline-block bg-blue-100 text-blue-700 font-black px-4 py-1 rounded-full text-xs mb-3 uppercase tracking-widest">Publikasi</div>
              <h2 className="text-4xl font-extrabold text-slate-900 leading-none">Kabar <span className="text-blue-600">Terbaru</span></h2>
            </div>
            <Link href="/berita" className="flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all">Semua Berita <ArrowRight size={18} /></Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestNews.map((berita) => (
              <div key={berita.id} className="bg-[#f8fafc] rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-5 hover:shadow-xl transition-all group flex flex-col h-full">
                <div className="relative h-52 bg-slate-200 rounded-2xl mb-5 overflow-hidden">
                  {berita.imageUrl ? (
                    <img src={berita.imageUrl} alt="Berita" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={32} /></div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 rounded-xl px-3 py-2 text-center shadow-lg font-black">
                     <p className="text-lg leading-none">{berita.createdAt?.toDate ? berita.createdAt.toDate().getDate() : "00"}</p>
                     <p className="text-[10px] uppercase text-blue-600 mt-1">Hari</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">{berita.kategori}</span>
                <h3 className="font-bold text-slate-900 text-xl mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{berita.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed grow">{berita.excerpt}</p>
                <Link href={`/berita/${berita.id}`} className="inline-flex items-center gap-2 text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors pt-5 border-t border-slate-200/50">BACA SELENGKAPNYA <ArrowRight size={14} /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="px-5 pb-24 max-w-7xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">Mari Melangkah <br/>Bersama PMII.</h2>
            <p className="text-blue-100 mb-10 text-lg leading-relaxed opacity-80">Daftarkan diri Anda dan jadilah bagian dari agen perubahan yang progresif untuk masa depan Indonesia.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <Link href="/pendaftaran" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black py-4 px-10 rounded-2xl transition shadow-xl text-base flex items-center justify-center gap-2">DAFTAR SEKARANG <ArrowRight size={20}/></Link>
               <Link href="/anggota" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md font-bold py-4 px-10 rounded-2xl flex items-center justify-center text-base">CARI KADER</Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}