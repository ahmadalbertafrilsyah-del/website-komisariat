"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import GridSkeleton from "@/components/GridSkeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  Filter,
  Users,
  MapPin,
  Hash,
  GraduationCap,
  ChevronDown,
  X,
  Award,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  LayoutGrid,
  ListFilter,
  Sparkles,
  Layers,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const JENJANG_KEYS = [
  {
    key: "MAPABA",
    label: "MAPABA",
    full: "Masa Penerimaan Anggota Baru",
    badgeClass:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  },
  {
    key: "PKD",
    label: "PKD",
    full: "Pelatihan Kader Dasar",
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  },
  {
    key: "PKL",
    label: "PKL",
    full: "Pelatihan Kader Lanjut",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
  {
    key: "SIG",
    label: "SIG",
    full: "Sekolah Islam & Gender",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
  {
    key: "SKP",
    label: "SKP",
    full: "Sekolah Kader Putri",
    badgeClass:
      "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/25",
  },
  {
    key: "SKK",
    label: "SKK",
    full: "Sekolah Kader Komisariat",
    badgeClass:
      "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25",
  },
];

// Helper inisial nama
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KD";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Helper normalisasi daftar Bidang Keahlian
const parseBidangList = (kader) => {
  const raw = kader?.bidang ?? kader?.keahlian ?? [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// Helper normalisasi Jenjang Kaderisasi beserta Tahunnya
const parseJenjangMap = (kader) => {
  const rawJenjang =
    typeof kader?.jenjang === "object" && kader?.jenjang !== null
      ? kader.jenjang
      : {};

  const map = {
    MAPABA: String(
      rawJenjang.MAPABA ?? kader?.tahunMapaba ?? kader?.angkatan ?? ""
    ).trim(),
    PKD: String(rawJenjang.PKD ?? kader?.tahunPKD ?? "").trim(),
    PKL: String(rawJenjang.PKL ?? kader?.tahunPKL ?? "").trim(),
    SIG: String(rawJenjang.SIG ?? kader?.tahunSIG ?? "").trim(),
    SKP: String(rawJenjang.SKP ?? kader?.tahunSKP ?? "").trim(),
    SKK: String(rawJenjang.SKK ?? kader?.tahunSKK ?? "").trim(),
  };

  return map;
};

// Daftar jenjang aktif yang sudah dilalui kader
const getCompletedJenjang = (kader) => {
  const map = parseJenjangMap(kader);
  return JENJANG_KEYS.filter((j) => map[j.key] && map[j.key] !== "-").map(
    (j) => ({
      ...j,
      tahun: map[j.key],
    })
  );
};

// Komponen Avatar Aman
const SafeAvatar = ({
  src,
  alt,
  className = "",
  textClass = "text-lg",
  sizes = "96px",
}) => {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={alt || "Foto Kader"}
        fill
        onError={() => setImgError(true)}
        className={className}
        sizes={sizes}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-yellow-400 font-black select-none">
      <span className={textClass}>{getInitials(alt)}</span>
    </div>
  );
};

export default function AnggotaPage() {
  const [loading, setLoading] = useState(true);
  const [anggotaData, setAnggotaData] = useState([]);

  // State Filter & Tampilan
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRayon, setFilterRayon] = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");
  const [filterJenjang, setFilterJenjang] = useState("Semua");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [visibleCount, setVisibleCount] = useState(16);

  // State Modal Detail Kader
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    async function fetchAnggota() {
      try {
        const docRef = doc(db, "website_config", "database_anggota");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAnggota) {
          const seenIds = new Set();
          const normalized = docSnap.data().listAnggota.map((item, idx) => {
            let uniqueId = item.id;
            if (!uniqueId || seenIds.has(uniqueId)) {
              uniqueId = `kdr-${idx}-${item.nim || item.nama || idx}`;
            }
            seenIds.add(uniqueId);
            return { ...item, id: uniqueId };
          });
          setAnggotaData(normalized);
        }
      } catch (error) {
        console.error("Gagal menarik data anggota:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnggota();
  }, []);

  const uniqueRayon = useMemo(
    () => [
      "Semua",
      ...new Set(
        anggotaData
          .map((item) => (item.rayon || "").trim())
          .filter((r) => r !== "")
      ),
    ],
    [anggotaData]
  );

  const uniqueAngkatan = useMemo(
    () => [
      "Semua",
      ...new Set(
        anggotaData
          .map((item) => (item.angkatan || "").trim())
          .filter((a) => a !== "")
      ),
    ].sort(),
    [anggotaData]
  );

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return anggotaData.filter((item) => {
      const bidangList = parseBidangList(item);
      const completedJenjang = getCompletedJenjang(item);

      const matchSearch =
        !q ||
        (item.nama || "").toLowerCase().includes(q) ||
        (item.nim || "").toLowerCase().includes(q) ||
        (item.nia || "").toLowerCase().includes(q) ||
        (item.rayon || "").toLowerCase().includes(q) ||
        bidangList.some((b) => b.toLowerCase().includes(q));

      const matchRayon =
        filterRayon === "Semua" || (item.rayon || "").trim() === filterRayon;
      const matchAngkatan =
        filterAngkatan === "Semua" ||
        (item.angkatan || "").trim() === filterAngkatan;
      const matchJenjang =
        filterJenjang === "Semua" ||
        completedJenjang.some((j) => j.key === filterJenjang);

      return matchSearch && matchRayon && matchAngkatan && matchJenjang;
    });
  }, [anggotaData, searchQuery, filterRayon, filterAngkatan, filterJenjang]);

  const selectedKader =
    selectedIndex !== null && filteredData[selectedIndex]
      ? filteredData[selectedIndex]
      : null;

  const handlePrevKader = useCallback(() => {
    if (filteredData.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null
        ? 0
        : (prev - 1 + filteredData.length) % filteredData.length
    );
  }, [filteredData.length]);

  const handleNextKader = useCallback(() => {
    if (filteredData.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null ? 0 : (prev + 1) % filteredData.length
    );
  }, [filteredData.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft") handlePrevKader();
      if (e.key === "ArrowRight") handleNextKader();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handlePrevKader, handleNextKader]);

  const handleCopyText = (text, label) => {
    if (!text || text === "-") return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070d19] font-sans text-slate-900 dark:text-slate-100 w-full overflow-x-hidden flex flex-col pb-16 xl:pb-0 transition-colors duration-300">
      <Navbar />

      {/* ================= 1. ARCHITECTURAL HEADER ================= */}
      <section className="relative pt-24 md:pt-28 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8 bg-[#091122] text-white border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:56px_56px] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between py-2.5 mb-6 md:mb-8 border-b border-white/10 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="uppercase tracking-widest text-slate-200">
                PANGKALAN DATA ANGGOTA & KADERISASI
              </span>
            </div>
            <span className="hidden sm:inline text-yellow-400 font-semibold">
              PK. PMII SUNAN AMPEL MALANG
            </span>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-mono uppercase tracking-wider mb-4">
                <Users className="w-3.5 h-3.5" />
                <span>Direktori Kader Terpadu</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-4">
                Database <span className="text-yellow-400">Anggota.</span>
              </h1>
              <p className="text-slate-300/90 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
                Telusuri profil kader, pemetaan bidang keahlian, serta rekam
                jejak jenjang kaderisasi (MAPABA, PKD, PKL, SIG, SKP, SKK)
                secara transparan dan terstruktur.
              </p>
            </div>

            {/* Ringkasan Statistik Anggota */}
            <div className="lg:col-span-5 grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 sm:p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block mb-1">
                  /01 KADER
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
                  {anggotaData.length}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block truncate">
                  Terdata Aktif
                </span>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 sm:p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block mb-1">
                  /02 RAYON
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
                  {Math.max(0, uniqueRayon.length - 1)}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block truncate">
                  Basis Fakultas
                </span>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 sm:p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block mb-1">
                  /03 JENJANG
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
                  6
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block truncate">
                  Tingkat Kaderisasi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. STICKY SEARCH & MULTI-FILTER BAR ================= */}
      <section className="sticky top-16 md:top-20 z-30 bg-white/95 dark:bg-[#0b1324]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            {/* Input Pencarian */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(16);
                }}
                placeholder="Cari nama, NIM, NIA, rayon, atau bidang keahlian..."
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-yellow-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Rayon */}
            <div className="md:col-span-3 relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterRayon}
                onChange={(e) => {
                  setFilterRayon(e.target.value);
                  setVisibleCount(16);
                }}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 appearance-none cursor-pointer focus:outline-none focus:border-blue-600"
              >
                {uniqueRayon.map((r, i) => (
                  <option key={i} value={r}>
                    {r === "Semua" ? "Semua Basis Rayon" : r}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Angkatan */}
            <div className="md:col-span-2 relative">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterAngkatan}
                onChange={(e) => {
                  setFilterAngkatan(e.target.value);
                  setVisibleCount(16);
                }}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 appearance-none cursor-pointer focus:outline-none focus:border-blue-600"
              >
                {uniqueAngkatan.map((a, i) => (
                  <option key={i} value={a}>
                    {a === "Semua" ? "Semua Angkatan" : `Angkatan ${a}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Switcher Mode Kartu vs Tabel */}
            <div className="md:col-span-2 flex justify-end">
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full justify-center">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-yellow-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-yellow-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Cepat Berdasarkan Jenjang Kaderisasi */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Jenjang:
            </span>
            {["Semua", ...JENJANG_KEYS.map((j) => j.key)].map((jKey) => {
              const isSelected = filterJenjang === jKey;
              return (
                <button
                  key={jKey}
                  onClick={() => {
                    setFilterJenjang(jKey);
                    setVisibleCount(16);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? "bg-blue-600 dark:bg-yellow-400 text-white dark:text-slate-950 border-blue-600 dark:border-yellow-400"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-400"
                  }`}
                >
                  {jKey === "Semua" ? "SEMUA JENJANG" : jKey}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 3. DAFTAR ANGGOTA (KLIK UNTUK MODAL DETAIL) ================= */}
      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow">
        {loading ? (
          <GridSkeleton />
        ) : filteredData.length === 0 ? (
          <div className="text-center max-w-md mx-auto my-12 bg-white dark:bg-[#0d1526] p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              Data Kader Tidak Ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Coba sesuaikan kata kunci pencarian, rayon, angkatan, atau filter
              jenjang kaderisasi di atas.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterRayon("Semua");
                setFilterAngkatan("Semua");
                setFilterJenjang("Semua");
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <>
            {/* Info Bar Hasil Filter */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                Menampilkan{" "}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {Math.min(visibleCount, filteredData.length)}
                </strong>{" "}
                dari{" "}
                <strong className="text-blue-600 dark:text-yellow-400 font-mono">
                  {filteredData.length}
                </strong>{" "}
                kader terdata
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Klik kartu/baris kader untuk melihat rincian jenjang & keahlian →
              </span>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full">
                {filteredData.slice(0, visibleCount).map((kader, index) => {
                  const bidangList = parseBidangList(kader);
                  const completedJenjang = getCompletedJenjang(kader);

                  return (
                    <motion.div
                      key={`${kader.id || "kdr"}-${index}`}
                      onClick={() => setSelectedIndex(index)}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min((index % 12) * 0.03, 0.25),
                      }}
                      className="group bg-white dark:bg-[#0d1526] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-yellow-400/60 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Kartu: Avatar + Nama + Rayon */}
                        <div className="flex items-start gap-3.5 mb-4">
                          <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                            <SafeAvatar
                              src={kader.foto}
                              alt={kader.nama}
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              textClass="text-sm sm:text-base"
                              sizes="56px"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-yellow-400">
                                {kader.angkatan
                                  ? `ANGKATAN ${kader.angkatan}`
                                  : "KADER PMII"}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-yellow-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                            <h3
                              className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors"
                              title={kader.nama}
                            >
                              {kader.nama}
                            </h3>
                            <p
                              className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1"
                              title={kader.rayon}
                            >
                              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">
                                {kader.rayon || "PK. PMII Sunan Ampel"}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Jenjang Kaderisasi yang Sudah Dilalui + Tahun */}
                        <div className="mb-3.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                            Jenjang Kaderisasi:
                          </span>
                          {completedJenjang.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {completedJenjang.map((j) => (
                                <span
                                  key={j.key}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${j.badgeClass}`}
                                >
                                  <span>{j.label}</span>
                                  <span className="opacity-75">
                                    • {j.tahun}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Belum tercatat
                            </span>
                          )}
                        </div>

                        {/* Bidang Keahlian */}
                        <div className="mb-4">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                            Bidang Keahlian:
                          </span>
                          {bidangList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {bidangList.slice(0, 3).map((b, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200/70 dark:border-slate-700 truncate max-w-[140px]"
                                >
                                  {b}
                                </span>
                              ))}
                              {bidangList.length > 3 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono font-bold">
                                  +{bidangList.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              Klik untuk lihat profil
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Kartu: NIM & NIA */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="truncate">
                          NIM: {kader.nim || "-"}
                        </span>
                        <span className="font-bold text-blue-600 dark:text-yellow-400">
                          Buka Profil →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* MODE TABEL MATRIKS */
              <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4 w-12">#</th>
                        <th className="py-3 px-4">Nama & Rayon</th>
                        <th className="py-3 px-4 hidden md:table-cell">
                          NIM / NIA
                        </th>
                        <th className="py-3 px-4">Jenjang Kaderisasi</th>
                        <th className="py-3 px-4 hidden lg:table-cell">
                          Bidang Keahlian
                        </th>
                        <th className="py-3 px-4 text-right">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs sm:text-sm">
                      {filteredData
                        .slice(0, visibleCount)
                        .map((kader, index) => {
                          const bidangList = parseBidangList(kader);
                          const completedJenjang = getCompletedJenjang(kader);
                          return (
                            <tr
                              key={`${kader.id || "tbl"}-${index}`}
                              onClick={() => setSelectedIndex(index)}
                              className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                            >
                              <td className="py-3 px-4 font-mono text-xs text-slate-400">
                                {index + 1}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                    <SafeAvatar
                                      src={kader.foto}
                                      alt={kader.nama}
                                      className="object-cover"
                                      textClass="text-[11px]"
                                      sizes="36px"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors truncate max-w-[180px] sm:max-w-xs">
                                      {kader.nama}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                      {kader.rayon || "-"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell font-mono text-xs text-slate-600 dark:text-slate-300">
                                <div>{kader.nim || "-"}</div>
                                {kader.nia && (
                                  <div className="text-[10px] text-blue-600 dark:text-yellow-400">
                                    {kader.nia}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {completedJenjang.length > 0 ? (
                                    completedJenjang.map((j) => (
                                      <span
                                        key={j.key}
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${j.badgeClass}`}
                                      >
                                        {j.label} &apos;
                                        {String(j.tahun).slice(-2)}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      -
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden lg:table-cell">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {bidangList.length > 0 ? (
                                    bidangList.slice(0, 3).map((b, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                                      >
                                        {b}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      -
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-yellow-400">
                                  <span>Profil</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tombol Muat Lebih Banyak */}
            {filteredData.length > visibleCount && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 16)}
                  className="bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-500 dark:hover:border-yellow-400 font-bold py-3 px-8 rounded-xl transition shadow-xs text-xs sm:text-sm"
                >
                  Tampilkan Lebih Banyak ({filteredData.length - visibleCount}{" "}
                  tersisa)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ================= 4. POPUP MODAL DOSSIER ANGGOTA ================= */}
      <AnimatePresence>
        {selectedKader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIndex(null)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#0b1324] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Top Dossier Header */}
              <div className="bg-[#091122] text-white px-4 sm:px-5 py-3.5 flex justify-between items-center border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Award size={16} className="text-yellow-400 shrink-0" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-200 truncate">
                    DOSSIER KADER // {selectedIndex + 1} DARI{" "}
                    {filteredData.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handlePrevKader}
                    title="Sebelumnya"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={handleNextKader}
                    title="Selanjutnya"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition"
                  >
                    <ChevronRight size={15} />
                  </button>
                  <button
                    onClick={() => setSelectedIndex(null)}
                    title="Tutup"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 transition ml-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Isi Detail Kader */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
                {/* Identitas Utama */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 text-center sm:text-left">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-md shrink-0">
                    <SafeAvatar
                      src={selectedKader.foto}
                      alt={selectedKader.nama}
                      className="object-cover"
                      textClass="text-2xl"
                      sizes="96px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600/10 dark:bg-yellow-400/15 text-blue-700 dark:text-yellow-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
                      <span>
                        {selectedKader.angkatan
                          ? `Angkatan ${selectedKader.angkatan}`
                          : "Anggota Aktif"}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                      {selectedKader.nama}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400 shrink-0" />
                      <span>{selectedKader.rayon || "PK. PMII Sunan Ampel Malang"}</span>
                    </p>
                  </div>
                </div>

                {/* NIM & NIA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                        NIM Mahasiswa
                      </span>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                        {selectedKader.nim || "-"}
                      </p>
                    </div>
                    {selectedKader.nim && selectedKader.nim !== "-" && (
                      <button
                        onClick={() =>
                          handleCopyText(selectedKader.nim, "nim")
                        }
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 shrink-0"
                        title="Salin NIM"
                      >
                        {copiedField === "nim" ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                        NIA Kader
                      </span>
                      <p className="font-mono font-bold text-blue-600 dark:text-yellow-400 mt-0.5 truncate">
                        {selectedKader.nia || "-"}
                      </p>
                    </div>
                    {selectedKader.nia && selectedKader.nia !== "-" && (
                      <button
                        onClick={() =>
                          handleCopyText(selectedKader.nia, "nia")
                        }
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 shrink-0"
                        title="Salin NIA"
                      >
                        {copiedField === "nia" ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Matriks Rekam Jejak Jenjang Kaderisasi (MAPABA, PKD, PKL, SIG, SKP, SKK) */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" />
                      <span>Riwayat Jenjang Kaderisasi</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {getCompletedJenjang(selectedKader).length} / 6 Jenjang
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(() => {
                      const map = parseJenjangMap(selectedKader);
                      return JENJANG_KEYS.map((j) => {
                        const tahun = map[j.key];
                        const isPassed = Boolean(tahun && tahun !== "-");
                        return (
                          <div
                            key={j.key}
                            className={`p-3 rounded-xl border transition-colors ${
                              isPassed
                                ? "bg-blue-50/50 dark:bg-blue-950/25 border-blue-300 dark:border-yellow-400/50"
                                : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                                {j.label}
                              </span>
                              {isPassed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400">
                                  -
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-1">
                              {j.full}
                            </p>
                            <span
                              className={`inline-block text-[11px] font-mono font-bold ${
                                isPassed
                                  ? "text-blue-600 dark:text-yellow-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {isPassed ? `Tahun ${tahun}` : "Belum tercatat"}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Bidang Keahlian Kader */}
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" />
                    <span>Bidang Keahlian & Kompetensi</span>
                  </span>

                  {parseBidangList(selectedKader).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parseBidangList(selectedKader).map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                      Bidang keahlian spesifik belum dicantumkan pada profil ini.
                    </div>
                  )}
                </div>

                {/* Tombol WhatsApp (Jika Tersedia) */}
                {selectedKader.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedKader.whatsapp.replace(
                      /[^0-9]/g,
                      ""
                    )}?text=Assalamualaikum%20Sahabat%20${encodeURIComponent(
                      selectedKader.nama
                    )}...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
                  >
                    <MessageSquare size={16} />
                    <span>Hubungi Kader via WhatsApp</span>
                  </a>
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
