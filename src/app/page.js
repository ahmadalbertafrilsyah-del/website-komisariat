"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Landmark,
  Target,
  Handshake,
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Newspaper,
  User,
  Image as ImageIcon,
  Trophy,
  Award,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Flame,
  Users,
  Compass,
  BookOpen,
  Search,
  X,
  FileSignature,
  Scale,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  Layers,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
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
      const duration = 2200;
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

  const displayCount =
    count >= 1000 ? (count / 1000).toFixed(1).replace(".0", "") + "K" : count;

  return (
    <span ref={ref} className="tabular-nums">
      {displayCount}
      {count > 0 && (
        <span className="text-blue-600 dark:text-yellow-400">{suffix}</span>
      )}
    </span>
  );
};

// Helper inisial nama jika foto kosong / gagal dimuat
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PK";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// ================= KOMPONEN KARTU APRESIASI ANTI-NABRAK (HORIZONTAL LEADERBOARD) =================
const AppreciationCard = ({ data, index, maxScore = 1 }) => {
  const [imgError, setImgError] = useState(false);
  const isFirst = index === 0;

  const rankMeta = [
    {
      label: "01",
      tag: "TERBAIK I",
      cardStyle:
        "border-amber-400/90 dark:border-amber-500/60 bg-gradient-to-r from-amber-50/70 via-white to-white dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900",
      badgeStyle: "bg-amber-400 text-slate-950 shadow-xs",
      avatarRing: "ring-2 ring-amber-400 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
      barColor: "bg-amber-400",
      scoreBox:
        "bg-amber-500/10 dark:bg-amber-400/10 border-amber-400/40 text-amber-700 dark:text-amber-300",
      btnStyle:
        "bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-950 hover:bg-blue-700 dark:hover:bg-yellow-300",
    },
    {
      label: "02",
      tag: "TERBAIK II",
      cardStyle:
        "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90",
      badgeStyle:
        "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
      avatarRing: "ring-1 ring-slate-300 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
      barColor: "bg-blue-600 dark:bg-blue-400",
      scoreBox:
        "bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200",
      btnStyle:
        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600",
    },
    {
      label: "03",
      tag: "TERBAIK III",
      cardStyle:
        "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90",
      badgeStyle:
        "bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300",
      avatarRing: "ring-1 ring-orange-300 dark:ring-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300",
      barColor: "bg-orange-500 dark:bg-orange-400",
      scoreBox:
        "bg-orange-50/70 dark:bg-orange-950/30 border-orange-200/70 dark:border-orange-800/50 text-orange-800 dark:text-orange-300",
      btnStyle:
        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600",
    },
  ][index] || {
    label: `0${index + 1}`,
    tag: `PERINGKAT ${index + 1}`,
    cardStyle: "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
    badgeStyle: "bg-slate-100 text-slate-700",
    avatarRing: "ring-1 ring-slate-200 bg-slate-100 text-slate-700",
    barColor: "bg-blue-600",
    scoreBox: "bg-slate-100 border-slate-200 text-slate-800",
    btnStyle: "bg-slate-100 text-slate-700",
  };

  const progressPercent = Math.max(
    18,
    Math.min(100, Math.round(((data.jumlahPrestasi || 1) / Math.max(1, maxScore)) * 100))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={`group relative rounded-2xl border p-3.5 sm:p-4 transition-all duration-300 hover:border-blue-500/60 dark:hover:border-yellow-400/50 hover:shadow-md ${rankMeta.cardStyle}`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Foto Profil dengan Fallback Anti-Broken-Alt */}
        <div className="relative shrink-0">
          <div
            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center font-black text-sm sm:text-base select-none ${rankMeta.avatarRing}`}
          >
            {data.foto && !imgError ? (
              <Image
                src={data.foto}
                alt={data.nama}
                fill
                onError={() => setImgError(true)}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="64px"
              />
            ) : (
              <span>{getInitials(data.nama)}</span>
            )}
          </div>

          {/* Lencana Nomor Urut di Pojok Avatar */}
          <div
            className={`absolute -top-2 -left-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black tracking-tight flex items-center gap-0.5 ${rankMeta.badgeStyle}`}
          >
            {isFirst ? (
              <Trophy className="w-2.5 h-2.5 shrink-0" />
            ) : (
              <Award className="w-2.5 h-2.5 shrink-0" />
            )}
            <span>#{rankMeta.label}</span>
          </div>
        </div>

        {/* Info Nama, Rayon & Progress Bar */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {rankMeta.tag}
            </span>
          </div>

          <h4
            className="text-slate-900 dark:text-slate-100 font-bold text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors"
            title={data.nama}
          >
            {data.nama}
          </h4>

          <p
            className="text-slate-500 dark:text-slate-400 text-xs font-medium line-clamp-1 mt-0.5"
            title={data.asalRayon || "Kader PMII"}
          >
            {data.asalRayon || "Kader PMII"}
          </p>

          {/* Bar Visual Proporsi Prestasi */}
          <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${rankMeta.barColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Kanan: Kotak Skor + Tombol Profil */}
        <div className="flex flex-col items-end justify-between gap-2 shrink-0 pl-1">
          <div
            className={`px-2.5 py-1 rounded-lg border text-right flex items-baseline gap-1 ${rankMeta.scoreBox}`}
          >
            <span className="text-base sm:text-lg font-black tabular-nums leading-none">
              {data.jumlahPrestasi || 0}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tight">
              Prestasi
            </span>
          </div>

          <Link
            href={`/apresiasi?kader=${encodeURIComponent(data.nama)}`}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs inline-flex items-center gap-1 transition-all whitespace-nowrap ${rankMeta.btnStyle}`}
          >
            <span>Profil</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// ================= DATA TAHAPAN KADERISASI INTERAKTIF =================
const KADERISASI_STEPS = [
  {
    code: "01",
    short: "MAPABA",
    title: "Masa Penerimaan Anggota Baru",
    statusKader: "Kader Mu'taqid",
    desc: "Gerbang awal pengenalan nilai-nilai ke-PMII-an, sejarah pergerakan, serta penanaman keyakinan terhadap Ahlussunnah Wal Jama'ah sebagai manhajul fikr.",
    fokus: [
      "Pengenalan Organisasi & Aswaja",
      "Nilai Dasar Pergerakan (NDP)",
      "Kemandirian & Solidaritas Mahasiswa",
    ],
  },
  {
    code: "02",
    short: "PKD",
    title: "Pelatihan Kader Dasar",
    statusKader: "Kader Mujahid",
    desc: "Fase pembentukan militansi ideologis, analisis sosial kritis, serta kesiapan menggerakkan roda organisasi di tingkat rayon dan komisariat.",
    fokus: [
      "Analisis Sosial & Rekayasa Sosial",
      "Paradigma Kritis Transformatif",
      "Manajemen Aksi & Advokasi",
    ],
  },
  {
    code: "03",
    short: "SIG",
    title: "Sekolah Islam dan Gender",
    statusKader: "Kader Berperspektif Adil Gender",
    desc: "Ruang kaderisasi KOPRI untuk membangun kesadaran kritis tentang relasi keislaman, keadilan gender, serta penguatan kapasitas intelektual kader dalam mengawal isu-isu perempuan dan kemanusiaan.",
    fokus: [
      "Konsep Keadilan & Kesetaraan Gender dalam Islam",
      "Fiqih Perempuan & Tafsir Kemanusiaan",
      "Analisis Gender & Penguatan Kelembagaan KOPRI",
    ],
  },
  {
    code: "04",
    short: "SKP",
    title: "Sekolah Kader Putri",
    statusKader: "Kader Putri Penggerak (Malang)",
    desc: "Jenjang kaderisasi putri khas di ranah PMII Kota Malang yang difokuskan pada pematangan ideologi pergerakan perempuan, kepemimpinan strategis KOPRI, dan advokasi sosial-kemasyarakatan.",
    fokus: [
      "Ideologi Gerakan Perempuan PMII Kota Malang",
      "Kepemimpinan Strategis & Advokasi Kebijakan",
      "Pengorganisasian Basis & Pemberdayaan Kader Putri",
    ],
  },
];

export default function Home() {
  const [config, setConfig] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [latestNews, setLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // STATE SLIDER HERO
  const [currentSlide, setCurrentSlide] = useState(0);

  // STATE STATISTIK & DATA INTERAKTIF
  const [stats, setStats] = useState({
    kader: 0,
    rayon: 0,
    proker: 0,
    alumni: 0,
  });
  const [allAnggota, setAllAnggota] = useState([]);
  const [allRayon, setAllRayon] = useState([]);
  const [allProker, setAllProker] = useState([]);

  // STATE APRESIASI KADER
  const [topAkademik, setTopAkademik] = useState([]);
  const [topNonAkademik, setTopNonAkademik] = useState([]);

  // STATE FITUR INTERAKTIF BERANDA
  const [quickSearch, setQuickSearch] = useState("");
  const [activeExplorerTab, setActiveExplorerTab] = useState("rayon");
  const [activeKaderisasiIdx, setActiveKaderisasiIdx] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const cachedGlobal = localStorage.getItem("pmii_global_config");
        if (cachedGlobal) setGlobalConfig(JSON.parse(cachedGlobal));

        const [
          berandaSnap,
          globalSnap,
          anggotaSnap,
          rayonSnap,
          adminSnap,
          alumniSnap,
          apresiasiSnap,
        ] = await Promise.all([
          getDoc(doc(db, "website_config", "settings")),
          getDoc(doc(db, "website_config", "global")),
          getDoc(doc(db, "website_config", "database_anggota")),
          getDoc(doc(db, "website_config", "database_rayon")),
          getDoc(doc(db, "website_config", "database_administrasi")),
          getDoc(doc(db, "website_config", "database_alumni")),
          getDoc(doc(db, "website_config", "database_apresiasi")),
        ]);

        if (berandaSnap.exists()) setConfig(berandaSnap.data());
        if (globalSnap.exists()) {
          const gData = globalSnap.data();
          setGlobalConfig(gData);
          localStorage.setItem("pmii_global_config", JSON.stringify(gData));
        }

        if (apresiasiSnap.exists()) {
          const listApresiasi = apresiasiSnap.data().listApresiasi || [];
          const scores = [];

          listApresiasi.forEach((kader) => {
            if (!kader.prestasi || !Array.isArray(kader.prestasi)) return;
            let countAkad = 0;
            let countNonAkad = 0;

            kader.prestasi.forEach((p) => {
              const kat = (p.tipe || p.kategori || "").toLowerCase();
              if (
                (kat.includes("akad") && !kat.includes("non")) ||
                kat.includes("kaderisasi") ||
                kat.includes("jurnal") ||
                kat.includes("sertifikasi")
              ) {
                countAkad += 1;
              } else if (
                kat.includes("non") ||
                kat.includes("lomba") ||
                kat.includes("minat") ||
                kat.includes("bakat")
              ) {
                countNonAkad += 1;
              }
            });

            scores.push({
              nama:
                kader.namaLengkap ||
                kader.namaKader ||
                kader.nama ||
                "Tanpa Nama",
              foto: kader.fotoKader || kader.foto || "",
              asalRayon: kader.asalRayon || kader.rayon || "",
              akademik: countAkad,
              nonAkademik: countNonAkad,
            });
          });

          const akademikRanks = scores
            .filter((x) => x.akademik > 0)
            .map((x) => ({ ...x, jumlahPrestasi: x.akademik }))
            .sort((a, b) => b.akademik - a.akademik)
            .slice(0, 3);
          const nonAkademikRanks = scores
            .filter((x) => x.nonAkademik > 0)
            .map((x) => ({ ...x, jumlahPrestasi: x.nonAkademik }))
            .sort((a, b) => b.nonAkademik - a.nonAkademik)
            .slice(0, 3);

          setTopAkademik(akademikRanks);
          setTopNonAkademik(nonAkademikRanks);
        }

        if (anggotaSnap.exists()) {
          const listAnggota = anggotaSnap.data().listAnggota || [];
          setAllAnggota(listAnggota);
          setStats((prev) => ({ ...prev, kader: listAnggota.length }));
        }
        if (rayonSnap.exists()) {
          const listRayon = rayonSnap.data().listRayon || [];
          setAllRayon(listRayon);
          setStats((prev) => ({ ...prev, rayon: listRayon.length }));
        }
        if (adminSnap.exists()) {
          const listProker = adminSnap.data().listProker || [];
          setAllProker(listProker);
          setStats((prev) => ({ ...prev, proker: listProker.length }));
        }
        if (alumniSnap.exists()) {
          setStats((prev) => ({
            ...prev,
            alumni: (alumniSnap.data().listAlumni || []).length,
          }));
        }

        const newsRef = collection(db, "berita");
        const q = query(newsRef, orderBy("createdAt", "desc"), limit(3));
        const newsSnap = await getDocs(q);
        setLatestNews(
          newsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getCurrentMonth = () => {
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(new Date());
  };

  const formatNewsDate = (timestamp) => {
    if (!timestamp?.toDate) return { day: "--", month: "---", full: "Terbaru" };
    const date = timestamp.toDate();
    return {
      day: new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(date),
      month: new Intl.DateTimeFormat("id-ID", { month: "short" })
        .format(date)
        .toUpperCase(),
      full: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date),
    };
  };

  // ================= DATA SLIDER HERO (TERHUBUNG KE FIREBASE ADMIN) =================
  const HERO_SLIDES =
    config?.heroSlides && config.heroSlides.length > 0
      ? config.heroSlides
      : [
          {
            id: "default-1",
            badge: "Tumbuh, Bergerak, Berdampak",
            title: config?.heroTitle || "Kaderisasi \nTanpa Batas.",
            subtitle:
              config?.heroSubtitle ||
              "Wadah pergerakan mahasiswa Islam berlandaskan Ahlussunnah Wal Jama'ah.",
            button1Text: "Gabung PMII",
            button1Link: "/pendaftaran",
            button2Text: "Kenali Pengurus",
            button2Link: "/struktur",
            image: config?.heroImage || "",
            bgColor: "from-[#0f172a] to-[#1e293b]",
          },
        ];

  // Efek Slider Otomatis tiap 5 Detik
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [HERO_SLIDES.length]);

  const handlePrevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
    );
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  // ================= LOGIKA PENCARIAN PINTAR BERANDA =================
  const trimmedSearch = quickSearch.trim().toLowerCase();
  const matchedAnggota = trimmedSearch
    ? allAnggota
        .filter(
          (k) =>
            (k.nama || "").toLowerCase().includes(trimmedSearch) ||
            (k.nim || "").toLowerCase().includes(trimmedSearch) ||
            (k.rayon || "").toLowerCase().includes(trimmedSearch)
        )
        .slice(0, 4)
    : [];

  const matchedRayon = trimmedSearch
    ? allRayon
        .filter(
          (r) =>
            (r.nama || "").toLowerCase().includes(trimmedSearch) ||
            (r.fakultas || "").toLowerCase().includes(trimmedSearch)
        )
        .slice(0, 3)
    : [];

  const matchedProker = trimmedSearch
    ? allProker
        .filter(
          (p) =>
            (p.namaProker || "").toLowerCase().includes(trimmedSearch) ||
            (p.pelaksanaProker || "").toLowerCase().includes(trimmedSearch)
        )
        .slice(0, 3)
    : [];

  const matchedNews = trimmedSearch
    ? latestNews
        .filter((n) => (n.title || "").toLowerCase().includes(trimmedSearch))
        .slice(0, 2)
    : [];

  const totalQuickMatches =
    matchedAnggota.length +
    matchedRayon.length +
    matchedProker.length +
    matchedNews.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div
            className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mb-6 relative ${
              globalConfig?.logoUrl
                ? ""
                : "bg-blue-700 rounded-2xl border border-blue-500/40"
            }`}
          >
            {globalConfig?.logoUrl ? (
              <Image
                src={globalConfig.logoUrl}
                alt="Logo"
                fill
                className="object-contain"
                sizes="96px"
              />
            ) : (
              <span className="text-yellow-400 font-black text-2xl tracking-widest">
                {globalConfig?.logoText || "PMII"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            <span className="text-slate-400 font-mono text-xs tracking-[0.25em] uppercase">
              Memuat Portal Komisariat
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeSlide = HERO_SLIDES[currentSlide] || HERO_SLIDES[0];
  const maxAkademikScore = topAkademik[0]?.jumlahPrestasi || 1;
  const maxNonAkademikScore = topNonAkademik[0]?.jumlahPrestasi || 1;
  const activeStep = KADERISASI_STEPS[activeKaderisasiIdx];

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070d19] font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden w-full transition-colors duration-300 pb-16 xl:pb-0">
      <Navbar />

      {/* ================= HERO SLIDER SECTION ================= */}
      <section
        className={`relative pt-20 md:pt-24 pb-16 md:pb-24 bg-gradient-to-br ${
          activeSlide?.bgColor || "from-[#091122] to-[#132347]"
        } overflow-hidden w-full transition-colors duration-700 border-b border-white/10`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:56px_56px] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Top Editorial Bar */}
          <div className="flex items-center justify-between py-3 mb-6 md:mb-10 border-b border-white/10 text-[11px] font-mono text-slate-300/80">
            <div className="flex items-center gap-2 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
              <span className="tracking-wider uppercase truncate">
                PK. PMII {globalConfig?.komisariatName || "SUNAN AMPEL MALANG"}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-slate-400 shrink-0">
              <span>DZIKIR • FIKIR • AMAL SHOLEH</span>
              <span className="text-white/20">|</span>
              <span className="text-yellow-400 font-semibold">
                SLIDE 0{currentSlide + 1} / 0{HERO_SLIDES.length}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center"
            >
              {/* Kolom Kiri: Tipografi Editorial */}
              <div className="lg:col-span-7 flex flex-col items-start text-left z-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-mono uppercase tracking-wider mb-4 sm:mb-6">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  {activeSlide?.badge}
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-tight whitespace-pre-line">
                  {activeSlide?.title}
                </h1>

                <p className="text-sm sm:text-base lg:text-lg text-slate-300/90 mb-7 sm:mb-9 leading-relaxed max-w-2xl font-normal">
                  {activeSlide?.subtitle}
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <Link
                    href={activeSlide?.button1Link || "/pendaftaran"}
                    className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm shadow-lg shadow-yellow-400/10 active:scale-[0.99]"
                  >
                    <span>{activeSlide?.button1Text || "Gabung PMII"}</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href={activeSlide?.button2Link || "/struktur"}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/20 font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <span>{activeSlide?.button2Text || "Kenali Pengurus"}</span>
                  </Link>
                </div>
              </div>

              {/* Kolom Kanan: Frame Visual / Maskot */}
              <div className="lg:col-span-5 relative w-full flex justify-center items-end">
                <div className="relative w-full h-[250px] sm:h-[340px] lg:h-[420px] rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xs overflow-hidden flex items-end justify-center p-4">
                  <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60 pointer-events-none" />
                  <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-yellow-400/60 pointer-events-none" />
                  <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-yellow-400/60 pointer-events-none" />
                  <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60 pointer-events-none" />

                  {activeSlide?.image ? (
                    <Image
                      src={activeSlide.image}
                      alt={activeSlide?.title || "Hero Image"}
                      fill
                      className="object-contain object-bottom p-2 drop-shadow-[0_16px_32px_rgba(0,0,0,0.5)] z-10"
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30 gap-2">
                      <ImageIcon size={48} strokeWidth={1.5} />
                      <span className="text-[11px] font-mono uppercase tracking-widest">
                        Visual Komisariat
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigasi Slider Bawah */}
          {HERO_SLIDES.length > 1 && (
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/10 z-20 relative">
              <div className="flex items-center gap-2">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentSlide
                        ? "w-10 bg-yellow-400"
                        : "w-3 bg-white/25 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevSlide}
                  aria-label="Slide Sebelumnya"
                  className="p-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextSlide}
                  aria-label="Slide Selanjutnya"
                  className="p-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= STATS LEDGER + FITUR PENCARIAN PINTAR TERPADU ================= */}
      <section className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 mb-12 sm:mb-16 w-full space-y-4">
        {/* Baris 1: 4 Statistik Utama */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-[#0d1526] rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/90 dark:border-slate-800 overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200/80 dark:divide-slate-800"
        >
          {[
            {
              code: "01",
              label: "Total Kader",
              sub: "Anggota Terdata",
              value: stats.kader,
              icon: Users,
              href: "/anggota",
            },
            {
              code: "02",
              label: "Total Rayon",
              sub: "Basis Komisariat",
              value: stats.rayon,
              icon: Compass,
              href: "/rayon",
            },
            {
              code: "03",
              label: "Program Kerja",
              sub: "Agenda Komisariat",
              value: stats.proker,
              icon: BookOpen,
              href: "/administrasi",
            },
            {
              code: "04",
              label: "Jaringan Alumni",
              sub: "Ikatan Alumni",
              value: stats.alumni,
              icon: GraduationCap,
              href: "/alumni",
            },
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className="group p-5 sm:p-7 flex flex-col justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-yellow-400 tracking-wider">
                    /{item.code}
                  </span>
                  <IconComponent className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors" />
                </div>
                <div>
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                    <AnimatedCounter value={item.value} />
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
                    {item.sub}
                  </p>
                </div>
              </Link>
            );
          })}
        </motion.div>

        {/* Baris 2: FITUR BARU — Pencarian Pintar & Pintasan Layanan Komisariat */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-[#0d1526] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-md"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-3.5 justify-between">
            {/* Input Pencarian Cepat */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Cari cepat kader, NIM, rayon, program kerja, atau berita..."
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-yellow-400 transition-colors"
              />
              {quickSearch && (
                <button
                  onClick={() => setQuickSearch("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Pintasan Layanan Digital */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar shrink-0">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:inline mr-1">
                Akses Cepat:
              </span>
              <Link
                href="/administrasi?tab=pengajuan_sk"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <FileSignature className="w-3.5 h-3.5" />
                <span>Ajukan SK / RTAR</span>
              </Link>
              <Link
                href="/administrasi?tab=produk_hukum"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-blue-500 dark:hover:border-yellow-400 transition-colors whitespace-nowrap shrink-0"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Produk Hukum</span>
              </Link>
              <a
                href="https://siakad.pmii-uinmalang.or.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>Portal SIAKAD</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Panel Hasil Pencarian Instan */}
          <AnimatePresence>
            {trimmedSearch.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  {totalQuickMatches === 0 ? (
                    <div className="py-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Tidak ditemukan hasil untuk{" "}
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        &ldquo;{quickSearch}&rdquo;
                      </span>
                      .
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Hasil Kader */}
                      {matchedAnggota.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-mono font-bold uppercase text-blue-600 dark:text-yellow-400">
                              Kader Terdata ({matchedAnggota.length})
                            </span>
                            <Link
                              href="/anggota"
                              className="text-[11px] font-semibold text-slate-500 hover:underline"
                            >
                              Direktori →
                            </Link>
                          </div>
                          <div className="space-y-2">
                            {matchedAnggota.map((k, i) => (
                              <Link
                                key={i}
                                href="/anggota"
                                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-500 transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {k.nama}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {k.rayon || "PMII"} • {k.angkatan || "-"}
                                  </p>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hasil Rayon */}
                      {matchedRayon.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-mono font-bold uppercase text-blue-600 dark:text-yellow-400">
                              Basis Rayon ({matchedRayon.length})
                            </span>
                            <Link
                              href="/rayon"
                              className="text-[11px] font-semibold text-slate-500 hover:underline"
                            >
                              Semua Rayon →
                            </Link>
                          </div>
                          <div className="space-y-2">
                            {matchedRayon.map((r, i) => {
                              const slug = encodeURIComponent(
                                (r.nama || "").toLowerCase().replace(/\s+/g, "-")
                              );
                              return (
                                <Link
                                  key={i}
                                  href={`/rayon/${slug}`}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-500 transition-colors"
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                      {r.nama}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                      {r.fakultas || "Fakultas"}
                                    </p>
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Hasil Proker & Berita */}
                      {(matchedProker.length > 0 || matchedNews.length > 0) && (
                        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-mono font-bold uppercase text-blue-600 dark:text-yellow-400">
                              Proker & Publikasi
                            </span>
                            <Link
                              href="/administrasi?tab=proker"
                              className="text-[11px] font-semibold text-slate-500 hover:underline"
                            >
                              Detail →
                            </Link>
                          </div>
                          <div className="space-y-2">
                            {matchedProker.map((p, i) => (
                              <Link
                                key={`p-${i}`}
                                href="/administrasi?tab=proker"
                                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-500 transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {p.namaProker}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {p.pelaksanaProker || "Komisariat"}
                                  </p>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </Link>
                            ))}
                            {matchedNews.map((n) => (
                              <Link
                                key={n.id}
                                href={`/berita/${n.id}`}
                                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-500 transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {n.title}
                                  </p>
                                  <p className="text-[11px] text-blue-600 dark:text-yellow-400 truncate">
                                    Artikel Berita
                                  </p>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ================= APRESIASI KADER SECTION (SUDAH ANTI-NABRAK) ================= */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-yellow-400 mb-2">
              <span className="w-2 h-2 bg-blue-600 dark:bg-yellow-400 rounded-xs" />
              <span>Papan Apresiasi Kader</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Kader Berprestasi Bulan Ini
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" />
              <span>Periode: {getCurrentMonth()}</span>
            </div>
            <Link
              href="/apresiasi"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-yellow-400 hover:underline"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* KATEGORI AKADEMIK (Stack Vertikal Lebar Penuh agar Tidak Nabrak) */}
          <div className="bg-white/80 dark:bg-[#0d1526]/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 border border-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    Kategori Akademik
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Karya ilmiah, jurnal, kaderisasi & sertifikasi
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                TOP 3
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {topAkademik.length > 0 ? (
                topAkademik.map((kader, i) => (
                  <AppreciationCard
                    key={kader.id || i}
                    data={kader}
                    index={i}
                    maxScore={maxAkademikScore}
                  />
                ))
              ) : (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
                  Belum ada data capaian akademik pada periode ini.
                </div>
              )}
            </div>
          </div>

          {/* KATEGORI NON-AKADEMIK (Stack Vertikal Lebar Penuh agar Tidak Nabrak) */}
          <div className="bg-white/80 dark:bg-[#0d1526]/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    Minat, Bakat & Kejuaraan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kompetisi olahraga, seni, organisasi & delegasi
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                TOP 3
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {topNonAkademik.length > 0 ? (
                topNonAkademik.map((kader, i) => (
                  <AppreciationCard
                    key={kader.id || i}
                    data={kader}
                    index={i}
                    maxScore={maxNonAkademikScore}
                  />
                ))
              ) : (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
                  Belum ada data capaian minat & bakat pada periode ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FITUR INTERAKTIF BARU: EKSPLORASI BASIS RAYON & AGENDA PROKER ================= */}
      {(allRayon.length > 0 || allProker.length > 0) && (
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="bg-white dark:bg-[#0d1526] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 lg:p-10 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-yellow-400 mb-2">
                  <span className="w-2 h-2 bg-blue-600 dark:bg-yellow-400 rounded-xs" />
                  <span>Ekosistem Komisariat</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Jelajahi Basis Rayon & Agenda Gerakan
                </h2>
              </div>

              {/* Tab Switcher Interaktif */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start md:self-auto">
                <button
                  onClick={() => setActiveExplorerTab("rayon")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    activeExplorerTab === "rayon"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-yellow-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Basis Rayon ({allRayon.length})</span>
                </button>
                <button
                  onClick={() => setActiveExplorerTab("proker")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    activeExplorerTab === "proker"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-yellow-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Program Kerja ({allProker.length})</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeExplorerTab === "rayon" ? (
                <motion.div
                  key="tab-rayon"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {allRayon.slice(0, 6).map((rayon, idx) => {
                      const rayonSlug = encodeURIComponent(
                        (rayon.nama || "").toLowerCase().replace(/\s+/g, "-")
                      );
                      return (
                        <Link
                          key={idx}
                          href={`/rayon/${rayonSlug}`}
                          className="group flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800/80 hover:border-blue-500/60 dark:hover:border-yellow-400/50 transition-all"
                        >
                          <div className="relative w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                            {rayon.logoUrl ? (
                              <Image
                                src={rayon.logoUrl}
                                alt={rayon.nama}
                                fill
                                className="object-contain p-1.5"
                                sizes="48px"
                              />
                            ) : (
                              <Compass className="w-5 h-5 text-blue-600 dark:text-yellow-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-yellow-400 block truncate">
                              {rayon.fakultas || "Tingkat Fakultas"}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors">
                              {rayon.nama}
                            </h4>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-yellow-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Link
                      href="/rayon"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-yellow-400 hover:underline"
                    >
                      <span>Lihat Seluruh Rayon ({allRayon.length})</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="tab-proker"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allProker.slice(0, 6).map((proker, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-600/10 dark:bg-yellow-400/10 text-blue-700 dark:text-yellow-400 text-[10px] font-mono font-bold uppercase truncate">
                              {proker.pelaksanaProker || "Komisariat"}
                            </span>
                            {proker.waktuPelaksanaan && (
                              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                {proker.waktuPelaksanaan}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {proker.namaProker}
                          </h4>
                          {proker.tujuan && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                              {proker.tujuan}
                            </p>
                          )}
                        </div>
                        {proker.penanggungJawab && (
                          <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>PJ Kegiatan:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                              {proker.penanggungJawab}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Link
                      href="/administrasi?tab=proker"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-yellow-400 hover:underline"
                    >
                      <span>Buka Portal Administrasi & Proker</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ================= SEJARAH / JEJAK PERGERAKAN SECTION ================= */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white dark:bg-[#0d1526] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 lg:p-14 shadow-xs">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5 order-2 lg:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                <div className="relative h-64 sm:h-80 lg:h-[380px] w-full">
                  {config?.sejarahImage ? (
                    <Image
                      src={config.sejarahImage}
                      alt="Sejarah Pergerakan"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon size={40} strokeWidth={1.5} />
                      <span className="text-xs font-mono uppercase">
                        Dokumentasi Sejarah
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-t border-white/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                      Tonggak Berdiri
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">
                      Pergerakan Mahasiswa Islam Indonesia
                    </span>
                  </div>
                  <div className="text-right pl-4 border-l border-white/15">
                    <span className="text-xl sm:text-2xl font-black text-yellow-400 tabular-nums leading-none">
                      {config?.sejarahTahun || "1960"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-7 order-1 lg:order-2"
            >
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-yellow-400 mb-3">
                <span className="w-2 h-2 bg-blue-600 dark:bg-yellow-400 rounded-xs" />
                <span>Jejak Historis & Khittah</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white mb-5 leading-[1.15] tracking-tight">
                {config?.sejarahTitle ||
                  "Menyatukan Keislaman, Keilmuan & Kebangsaan"}
              </h2>

              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-7">
                {config?.sejarahDesc ||
                  "Pergerakan Mahasiswa Islam Indonesia (PMII) lahir sebagai wadah perjuangan mahasiswa berlandaskan Islam Ahlussunnah Wal Jama'ah."}
              </p>

              <div className="relative pl-5 sm:pl-6 py-4 pr-5 bg-slate-50 dark:bg-slate-900/90 border-l-4 border-blue-600 dark:border-yellow-400 rounded-r-xl">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-yellow-400 block mb-1">
                  Tri Motto Pergerakan
                </span>
                <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base font-medium leading-relaxed italic">
                  &ldquo;
                  {config?.sejarahQuote ||
                    "Menjadikan Dzikir, Fikir, dan Amal Sholeh sebagai pedoman gerak kader."}
                  &rdquo;
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= NILAI DASAR & ALUR KADERISASI INTERAKTIF SECTION ================= */}
      <section className="bg-[#091122] py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden w-full border-y border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-16 md:space-y-20">
          {/* Bagian A: Nilai Dasar Pergerakan */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-yellow-400 mb-3">
                <span className="w-2 h-2 bg-yellow-400 rounded-xs" />
                <span>Fondasi Kaderisasi</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-4">
                {config?.nilaiTitle || "Nilai Dasar"}{" "}
                <span className="text-yellow-400">
                  {config?.nilaiHighlight || "Pergerakan"}
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300/80 leading-relaxed mb-6">
                {config?.nilaiSubtitle ||
                  "Arah pembentukan kader dan orientasi perjuangan organisasi."}
              </p>

              <div className="hidden lg:flex flex-col gap-2 pt-6 border-t border-white/10 text-xs font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span>LANDASAN</span>
                  <span className="text-white">ASWAJA AN-NAHDLIYAH</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ORIENTASI</span>
                  <span className="text-yellow-400">ULUL ALBAB</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {[
                {
                  num: "01",
                  icon: <Target className="w-5 h-5" />,
                  title: config?.nilai1Title || "Intelektualitas",
                  desc:
                    config?.nilai1Desc ||
                    "Fokus pada kajian ilmiah dan penguasaan ilmu pengetahuan.",
                },
                {
                  num: "02",
                  icon: <ShieldCheck className="w-5 h-5" />,
                  title: config?.nilai2Title || "Ketakwaan",
                  desc:
                    config?.nilai2Desc ||
                    "Berlandaskan iman dan kedekatan kepada Allah SWT.",
                },
                {
                  num: "03",
                  icon: <Handshake className="w-5 h-5" />,
                  title: config?.nilai3Title || "Pengabdian",
                  desc:
                    config?.nilai3Desc ||
                    "Turun langsung melakukan advokasi isu-isu kemasyarakatan.",
                },
                {
                  num: "04",
                  icon: <Landmark className="w-5 h-5" />,
                  title: config?.nilai4Title || "Kebangsaan",
                  desc:
                    config?.nilai4Desc ||
                    "Menjaga cita-cita kemerdekaan dan merawat kebhinekaan.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-yellow-400/50 rounded-2xl p-6 sm:p-7 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 group-hover:bg-yellow-400 group-hover:text-slate-950 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-2xl font-mono font-black text-white/15 group-hover:text-yellow-400/40 transition-colors">
                      {item.num}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-slate-300/80 text-xs sm:text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bagian B: FITUR INTERAKTIF BARU — Peta Jalan Kaderisasi PMII */}
          <div className="pt-12 border-t border-white/10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-yellow-400 mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kurikulum Pergerakan</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Alur & Jenjang Kaderisasi PMII
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                Pilih tahapan di bawah untuk melihat fokus pembentukan dan
                kompetensi kader di setiap jenjang.
              </p>
            </div>

            {/* Pemilih Tahap (4 Step Selector) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
              {KADERISASI_STEPS.map((step, idx) => {
                const isSelected = idx === activeKaderisasiIdx;
                return (
                  <button
                    key={step.code}
                    onClick={() => setActiveKaderisasiIdx(idx)}
                    className={`text-left p-3.5 sm:p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-yellow-400 text-slate-950 border-yellow-400 shadow-lg shadow-yellow-400/10"
                        : "bg-white/[0.03] text-white border-white/10 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[11px] font-mono font-black ${
                          isSelected ? "text-slate-900" : "text-yellow-400"
                        }`}
                      >
                        TAHAP /{step.code}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isSelected
                            ? "bg-slate-950/15 text-slate-950 font-bold"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {step.short}
                      </span>
                    </div>
                    <p
                      className={`text-xs sm:text-sm font-bold line-clamp-1 ${
                        isSelected ? "text-slate-950" : "text-white"
                      }`}
                    >
                      {step.title}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Detail Tahap Aktif */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep.code}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="bg-white/[0.04] border border-white/15 rounded-2xl p-5 sm:p-8 grid lg:grid-cols-12 gap-6 items-center"
              >
                <div className="lg:col-span-7 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-mono font-bold">
                    <span>Output Jenjang: {activeStep.statusKader}</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    {activeStep.short} — {activeStep.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeStep.desc}
                  </p>
                </div>

                <div className="lg:col-span-5 bg-slate-950/60 border border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Fokus Materi & Penguatan:
                  </span>
                  <ul className="space-y-2">
                    {activeStep.fokus.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/pendaftaran"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:underline"
                    >
                      <span>Ikuti Pendaftaran Kaderisasi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ================= BERITA TERBARU SECTION ================= */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 mb-10 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-yellow-400 mb-2">
              <span className="w-2 h-2 bg-blue-600 dark:bg-yellow-400 rounded-xs" />
              <span>Jurnal & Publikasi</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Kabar Pergerakan Terbaru
            </h2>
          </div>
          <Link
            href="/berita"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl transition-colors"
          >
            <span>Indeks Berita</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {latestNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.map((berita) => {
              const dateObj = formatNewsDate(berita.createdAt);
              return (
                <article
                  key={berita.id}
                  className="bg-white dark:bg-[#0d1526] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-yellow-400/50 transition-all group flex flex-col h-full shadow-xs hover:shadow-xl"
                >
                  <Link
                    href={`/berita/${berita.id}`}
                    className="relative h-48 sm:h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden block"
                  >
                    {berita.imageUrl ? (
                      <Image
                        src={berita.imageUrl}
                        alt={berita.title || "Berita"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                        <Newspaper size={36} strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md text-white rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider border border-white/10">
                      {berita.kategori || "Kabar"}
                    </div>
                  </Link>

                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 dark:text-slate-500 mb-2.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateObj.full}</span>
                    </div>

                    <Link href={`/berita/${berita.id}`}>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg sm:text-xl mb-2.5 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors">
                        {berita.title}
                      </h3>
                    </Link>

                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm line-clamp-2 mb-5 leading-relaxed flex-1">
                      {berita.excerpt}
                    </p>

                    <Link
                      href={`/berita/${berita.id}`}
                      className="inline-flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors pt-4 border-t border-slate-100 dark:border-slate-800"
                    >
                      <span>BACA SELENGKAPNYA</span>
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            Belum ada berita terbaru yang dipublikasikan.
          </div>
        )}
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#091122] rounded-2xl sm:rounded-3xl p-6 sm:p-12 lg:p-16 relative overflow-hidden border border-slate-800 shadow-2xl"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <div className="absolute top-0 left-0 w-2 h-full bg-yellow-400" />

          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-yellow-400 mb-3">
                <span>Penerimaan & Database Kader</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 leading-tight tracking-tight">
                {config?.ctaTitle || "Mari Melangkah Bersama PMII."}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
                {config?.ctaSubtitle ||
                  "Daftarkan diri Anda dan jadilah bagian dari agen perubahan yang progresif untuk masa depan Indonesia."}
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 w-full">
              <Link
                href="/pendaftaran"
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-3.5 sm:py-4 px-6 rounded-xl transition flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg"
              >
                <span>DAFTAR SEKARANG</span>
                <ArrowRight size={16} className="shrink-0" />
              </Link>
              <Link
                href="/anggota"
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 font-bold py-3.5 sm:py-4 px-6 rounded-xl transition flex items-center justify-center text-xs sm:text-sm"
              >
                <span>CARI DATA KADER</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
