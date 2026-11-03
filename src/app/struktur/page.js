"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import GridSkeleton from "@/components/GridSkeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquare,
  Hash,
  MapPin,
  Calendar,
  Award,
  Shield,
  Users,
  Briefcase,
  Search,
  LayoutGrid,
  GitFork,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Copy,
  Check,
  Sparkles,
  Building2,
  UserCheck,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Helper inisial nama untuk fallback foto
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PK";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Deteksi apakah jabatan termasuk unsur pimpinan/koordinator dalam biro/BPH
const isLeaderRole = (jabatan = "", indexInGroup = 0, kategori = "") => {
  const j = jabatan.toLowerCase();
  const k = kategori.toLowerCase();
  if (
    j.includes("ketua") ||
    j.includes("sekretaris") ||
    j.includes("bendahara") ||
    j.includes("koordinator") ||
    j.includes("direktur") ||
    j.includes("kepala") ||
    j.includes("komandan")
  ) {
    return true;
  }
  if ((k.includes("bph") || k.includes("harian")) && indexInGroup === 0) {
    return true;
  }
  return false;
};

// Komponen Avatar Aman (Anti-Broken-Alt)
const SafeAvatar = ({ src, alt, className = "", textClass = "text-lg", sizes = "200px" }) => {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={alt || "Foto Pengurus"}
        fill
        onError={() => setImgError(true)}
        className={className}
        sizes={sizes}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-yellow-400 font-black select-none">
      <span className={textClass}>{getInitials(alt)}</span>
    </div>
  );
};

export default function StrukturPage() {
  const [strukturData, setStrukturData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Interaktif & Inovasi Tampilan
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("SEMUA");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "chart" | "table"
  const [selectedIndex, setSelectedIndex] = useState(null); // index di dalam flatFilteredMembers
  const [copiedField, setCopiedField] = useState(null);

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
  const renderIkonBiro = (namaBiro = "") => {
    const lowerStr = namaBiro.toLowerCase();
    if (
      lowerStr.includes("bph") ||
      lowerStr.includes("harian") ||
      lowerStr.includes("inti")
    ) {
      return <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />;
    } else if (
      lowerStr.includes("kaderisasi") ||
      lowerStr.includes("anggota") ||
      lowerStr.includes("psdm")
    ) {
      return <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-yellow-400" />;
    } else if (lowerStr.includes("kopri") || lowerStr.includes("putri")) {
      return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-yellow-400" />;
    }
    return <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-yellow-400" />;
  };

  // Statistik Otomatis
  const statsSummary = useMemo(() => {
    let totalPersonil = 0;
    const rayonSet = new Set();

    strukturData.forEach((div) => {
      (div.anggota || []).forEach((m) => {
        totalPersonil += 1;
        if (m.rayon && m.rayon.trim() !== "" && m.rayon.trim() !== "-") {
          rayonSet.add(m.rayon.trim().toLowerCase());
        }
      });
    });

    return {
      totalUnit: strukturData.length,
      totalPersonil,
      totalRayon: rayonSet.size,
    };
  }, [strukturData]);

  // Filter Data Berdasarkan Kategori & Pencarian
  const filteredStruktur = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return strukturData
      .map((divisi, divIdx) => {
        if (activeCategory !== "SEMUA" && divisi.kategori !== activeCategory) {
          return null;
        }

        const filteredAnggota = (divisi.anggota || [])
          .map((item, memIdx) => ({
            ...item,
            _kategori: divisi.kategori,
            _divIdx: divIdx,
            _memIdx: memIdx,
            _isLeader: isLeaderRole(item.jabatan, memIdx, divisi.kategori),
          }))
          .filter((item) => {
            if (!q) return true;
            return (
              (item.nama || "").toLowerCase().includes(q) ||
              (item.jabatan || "").toLowerCase().includes(q) ||
              (item.rayon || "").toLowerCase().includes(q) ||
              (item.nim || "").toLowerCase().includes(q) ||
              (item.nia || "").toLowerCase().includes(q) ||
              (divisi.kategori || "").toLowerCase().includes(q)
            );
          });

        if (filteredAnggota.length === 0) return null;

        return {
          ...divisi,
          _divIdx: divIdx,
          anggota: filteredAnggota,
        };
      })
      .filter(Boolean);
  }, [strukturData, activeCategory, searchQuery]);

  // Daftar Flat untuk Navigasi Next/Prev di dalam Modal Dossier
  const flatFilteredMembers = useMemo(() => {
    const list = [];
    filteredStruktur.forEach((div) => {
      div.anggota.forEach((m) => list.push(m));
    });
    return list;
  }, [filteredStruktur]);

  const selectedPengurus =
    selectedIndex !== null && flatFilteredMembers[selectedIndex]
      ? flatFilteredMembers[selectedIndex]
      : null;

  const openMemberModal = (member) => {
    const idx = flatFilteredMembers.findIndex(
      (m) => m._divIdx === member._divIdx && m._memIdx === member._memIdx
    );
    setSelectedIndex(idx !== -1 ? idx : 0);
  };

  const handlePrevMember = useCallback(() => {
    if (flatFilteredMembers.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null
        ? 0
        : (prev - 1 + flatFilteredMembers.length) % flatFilteredMembers.length
    );
  }, [flatFilteredMembers.length]);

  const handleNextMember = useCallback(() => {
    if (flatFilteredMembers.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null ? 0 : (prev + 1) % flatFilteredMembers.length
    );
  }, [flatFilteredMembers.length]);

  // Navigasi Keyboard untuk Modal
  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft") handlePrevMember();
      if (e.key === "ArrowRight") handleNextMember();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handlePrevMember, handleNextMember]);

  const handleCopyText = (text, label) => {
    if (!text || text === "-") return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070d19] font-sans text-slate-900 dark:text-slate-100 w-full overflow-x-hidden pb-16 xl:pb-0 transition-colors duration-300">
      <Navbar />

      {/* ================= 1. ARCHITECTURAL HEADER & TELEMETRY ================= */}
      <section className="relative pt-24 md:pt-28 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8 bg-[#091122] text-white border-b border-white/10 overflow-hidden">
        {/* Garis Kisi Arsitektural */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:56px_56px] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Top Metadata Strip */}
          <div className="flex items-center justify-between py-2.5 mb-6 md:mb-8 border-b border-white/10 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="uppercase tracking-widest text-slate-200">
                DIREKTORI & BAGAN ORGANISASI
              </span>
            </div>
            <span className="hidden sm:inline text-yellow-400 font-semibold">
              MASA KHIDMAT BERJALAN
            </span>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-mono uppercase tracking-wider mb-4">
                <Building2 className="w-3.5 h-3.5" />
                <span>Nakhoda Pergerakan Komisariat</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-4">
                Struktur{" "}
                <span className="text-yellow-400">Kepengurusan.</span>
              </h1>
              <p className="text-slate-300/90 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
                Sinergi Badan Pengurus Harian (BPH), Biro, dan Lembaga Semi
                Otonom dalam menggerakkan roda kaderisasi, intelektualitas, dan
                pengabdian.
              </p>
            </div>

            {/* Papan Telemetri Struktur */}
            <div className="lg:col-span-5 grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 sm:p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block mb-1">
                  /01 UNIT
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
                  {statsSummary.totalUnit}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block truncate">
                  Biro & Divisi
                </span>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 sm:p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block mb-1">
                  /02 PERSONIL
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
                  {statsSummary.totalPersonil}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block truncate">
                  Pengurus Aktif
                </span>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 sm:p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block mb-1">
                  /03 BASIS
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
                  {statsSummary.totalRayon || "-"}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block truncate">
                  Rayon Terwakili
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. STICKY COMMAND & VIEW CONTROLLER BAR ================= */}
      <section className="sticky top-16 md:top-20 z-30 bg-white/95 dark:bg-[#0b1324]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Input Pencarian Cepat Pengurus */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pengurus, jabatan, biro, rayon, atau NIA..."
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-yellow-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Reset pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Switcher 3 Mode Tampilan Inovatif */}
            <div className="flex items-center justify-between md:justify-end gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden lg:inline mr-1">
                Mode Tampilan:
              </span>
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full md:w-auto">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-yellow-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
                <button
                  onClick={() => setViewMode("chart")}
                  className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    viewMode === "chart"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-yellow-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Bagan Hirarki</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-yellow-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Matriks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Tab Kategori Biro/Divisi (Horizontal Scrollable) */}
          {strukturData.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setActiveCategory("SEMUA")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap shrink-0 border ${
                  activeCategory === "SEMUA"
                    ? "bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-950 border-slate-900 dark:border-yellow-400"
                    : "bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                }`}
              >
                SEMUA UNIT ({statsSummary.totalPersonil})
              </button>

              {strukturData.map((div, idx) => {
                const isSelected = activeCategory === div.kategori;
                const count = div.anggota?.length || 0;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveCategory(div.kategori)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-blue-600 dark:bg-yellow-400 text-white dark:text-slate-950 border-blue-600 dark:border-yellow-400"
                        : "bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-500/50"
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-70">
                      0{idx + 1}
                    </span>
                    <span>{div.kategori}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isSelected
                          ? "bg-black/15 text-current"
                          : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= 3. AREA KONTEN UTAMA (3 MODE INOVATIF) ================= */}
      <section className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[55vh]">
        {loading ? (
          <GridSkeleton />
        ) : strukturData.length === 0 ? (
          <div className="bg-white dark:bg-[#0d1526] rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 max-w-xl mx-auto">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
              Data Struktur Belum Tersedia
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Susunan kepengurusan belum diunggah. Silakan isi data personil
              organisasi melalui Dashboard Admin.
            </p>
          </div>
        ) : filteredStruktur.length === 0 ? (
          <div className="bg-white dark:bg-[#0d1526] rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 max-w-xl mx-auto">
            <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              Pengurus Tidak Ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Tidak ada nama, jabatan, atau rayon yang cocok dengan kata kunci{" "}
              <span className="font-bold text-slate-800 dark:text-white">
                &ldquo;{searchQuery}&rdquo;
              </span>
              .
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("SEMUA");
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="space-y-14 md:space-y-20">
            {filteredStruktur.map((divisi) => {
              const leaders = divisi.anggota.filter((m) => m._isLeader);
              const regularMembers = divisi.anggota.filter((m) => !m._isLeader);

              return (
                <div key={divisi._divIdx} className="space-y-6">
                  {/* Header Editorial Setiap Biro / Divisi */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b-2 border-slate-900 dark:border-slate-800">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                        {renderIkonBiro(divisi.kategori)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-yellow-400">
                            UNIT // 0{divisi._divIdx + 1}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">
                            •
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {divisi.anggota.length} Personil
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {divisi.kategori}
                        </h2>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 self-start sm:self-end">
                      Klik personil untuk membuka ID Dossier →
                    </div>
                  </div>

                  {/* ======= MODE 1: DIREKTORI KARTU EDITORIAL ======= */}
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                      {divisi.anggota.map((item, memberIndex) => (
                        <motion.div
                          key={`${divisi._divIdx}-${item._memIdx}`}
                          onClick={() => openMemberModal(item)}
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-30px" }}
                          transition={{
                            duration: 0.35,
                            delay: Math.min(memberIndex * 0.04, 0.25),
                          }}
                          className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-row sm:flex-col justify-between bg-white dark:bg-[#0d1526] hover:shadow-xl hover:-translate-y-1 ${
                            item._isLeader
                              ? "border-amber-400/80 dark:border-yellow-500/50 ring-1 ring-amber-400/20"
                              : "border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-yellow-400/50"
                          }`}
                        >
                          {/* Area Foto (Kiri di HP, Atas di Tablet/Desktop) */}
                          <div className="relative w-28 sm:w-full h-auto sm:h-60 min-h-[120px] bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                            <SafeAvatar
                              src={item.foto}
                              alt={item.nama}
                              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                              textClass="text-2xl sm:text-4xl"
                              sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 25vw"
                            />

                            {/* Gradient Overlay Halus di Bawah Foto (Desktop) */}
                            <div className="hidden sm:block absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent pointer-events-none" />

                            {/* Lencana Unsur Pimpinan */}
                            {item._isLeader && (
                              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-yellow-400 text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider shadow-xs z-10 flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                <span className="hidden sm:inline">INTI</span>
                              </div>
                            )}

                            {/* Nomor Indeks di Pojok Kanan Atas */}
                            <span className="hidden sm:inline-block absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-slate-950/60 backdrop-blur-xs text-white/90 font-mono text-[10px] border border-white/10">
                              #{String(item._memIdx + 1).padStart(2, "0")}
                            </span>
                          </div>

                          {/* Area Informasi Pengurus */}
                          <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span
                                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded truncate ${
                                    item._isLeader
                                      ? "bg-amber-500/10 text-amber-700 dark:text-yellow-400 border border-amber-400/30"
                                      : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                                  }`}
                                >
                                  {item.jabatan || "Pengurus"}
                                </span>
                              </div>

                              <h3
                                className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors mt-1.5"
                                title={item.nama}
                              >
                                {item.nama || "Nama Kosong"}
                              </h3>

                              {item.rayon && item.rayon !== "-" && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                                  <span className="truncate">{item.rayon}</span>
                                </p>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500">
                              <span className="truncate">
                                {item.angkatan
                                  ? `Angkatan ${item.angkatan}`
                                  : "ID Dossier"}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-slate-700 dark:text-slate-300 font-bold group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors">
                                Detail
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* ======= MODE 2: BAGAN HIRARKI ORGANISASI (ORG CHART TREE) ======= */}
                  {viewMode === "chart" && (
                    <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                      <div className="relative z-10 flex flex-col items-center">
                        {/* Root Node Biro */}
                        <div className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-950 font-mono text-xs sm:text-sm font-black uppercase tracking-wider shadow-md text-center">
                          {divisi.kategori}
                        </div>

                        {/* Garis Vertikal Turun dari Root */}
                        <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />

                        {/* Level 1: Unsur Pimpinan / Koordinator */}
                        {leaders.length > 0 && (
                          <>
                            <div className="w-full max-w-4xl">
                              <div className="text-center mb-3">
                                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-yellow-400 border border-amber-400/30 font-bold">
                                  Unsur Pimpinan / Koordinator
                                </span>
                              </div>
                              <div className="flex flex-wrap justify-center gap-3.5 sm:gap-4">
                                {leaders.map((leader) => (
                                  <div
                                    key={`chart-lead-${leader._memIdx}`}
                                    onClick={() => openMemberModal(leader)}
                                    className="w-full sm:w-72 bg-amber-50/50 dark:bg-slate-900 border-2 border-amber-400/80 dark:border-yellow-400/70 rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer hover:shadow-lg transition-all group"
                                  >
                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 ring-2 ring-amber-400">
                                      <SafeAvatar
                                        src={leader.foto}
                                        alt={leader.nama}
                                        className="object-cover"
                                        textClass="text-sm"
                                        sizes="56px"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span className="text-[10px] font-mono font-black uppercase text-amber-700 dark:text-yellow-400 block truncate">
                                        {leader.jabatan}
                                      </span>
                                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-yellow-400">
                                        {leader.nama}
                                      </h4>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                        {leader.rayon || "PK. PMII"}
                                      </p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {regularMembers.length > 0 && (
                              <div className="flex flex-col items-center w-full my-2">
                                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
                                <div className="w-3/4 max-w-2xl h-0.5 bg-slate-300 dark:bg-slate-700" />
                                <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700" />
                              </div>
                            )}
                          </>
                        )}

                        {/* Level 2: Anggota / Staf Biro */}
                        {regularMembers.length > 0 && (
                          <div className="w-full">
                            {leaders.length > 0 && (
                              <div className="text-center mb-3">
                                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                  Jajaran Pengurus & Staf ({regularMembers.length})
                                </span>
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {regularMembers.map((mem) => (
                                <div
                                  key={`chart-mem-${mem._memIdx}`}
                                  onClick={() => openMemberModal(mem)}
                                  className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-yellow-400/60 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all group"
                                >
                                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                    <SafeAvatar
                                      src={mem.foto}
                                      alt={mem.nama}
                                      className="object-cover"
                                      textClass="text-xs"
                                      sizes="48px"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400 block truncate">
                                      {mem.jabatan || "Pengurus"}
                                    </span>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate group-hover:text-blue-600 dark:group-hover:text-yellow-400">
                                      {mem.nama}
                                    </h4>
                                    {mem.rayon && (
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                        {mem.rayon}
                                      </p>
                                    )}
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ======= MODE 3: MATRIKS TABEL KOMPAK ======= */}
                  {viewMode === "table" && (
                    <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              <th className="py-3 px-4 w-12">#</th>
                              <th className="py-3 px-4">Personil Pengurus</th>
                              <th className="py-3 px-4">Jabatan</th>
                              <th className="py-3 px-4 hidden md:table-cell">
                                Asal Rayon
                              </th>
                              <th className="py-3 px-4 hidden sm:table-cell">
                                Angkatan
                              </th>
                              <th className="py-3 px-4 text-right">Dossier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs sm:text-sm">
                            {divisi.anggota.map((item, idx) => (
                              <tr
                                key={`tbl-${item._memIdx}`}
                                onClick={() => openMemberModal(item)}
                                className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                              >
                                <td className="py-3 px-4 font-mono text-xs text-slate-400">
                                  {String(idx + 1).padStart(2, "0")}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                      <SafeAvatar
                                        src={item.foto}
                                        alt={item.nama}
                                        className="object-cover"
                                        textClass="text-[11px]"
                                        sizes="36px"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors truncate max-w-[180px] sm:max-w-xs">
                                        {item.nama}
                                      </p>
                                      <p className="text-[11px] text-slate-500 md:hidden truncate max-w-[160px]">
                                        {item.rayon || "-"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                                      item._isLeader
                                        ? "bg-amber-500/15 text-amber-700 dark:text-yellow-400"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    {item.jabatan || "Anggota"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 hidden md:table-cell text-slate-600 dark:text-slate-300">
                                  {item.rayon || "-"}
                                </td>
                                <td className="py-3 px-4 hidden sm:table-cell font-mono text-xs text-slate-500">
                                  {item.angkatan || "-"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-yellow-400">
                                    <span>Buka</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= 4. DIGITAL ID DOSSIER MODAL (DENGAN PREV/NEXT & COPY) ================= */}
      <AnimatePresence>
        {selectedPengurus && (
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
              className="bg-white dark:bg-[#0b1324] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Top Dossier Bar */}
              <div className="bg-[#091122] text-white px-4 sm:px-5 py-3.5 flex justify-between items-center border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Award size={16} className="text-yellow-400 shrink-0" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-200 truncate">
                    DOSSIER PENGURUS // {selectedIndex + 1} DARI{" "}
                    {flatFilteredMembers.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handlePrevMember}
                    title="Pengurus Sebelumnya (Panah Kiri)"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={handleNextMember}
                    title="Pengurus Selanjutnya (Panah Kanan)"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition"
                  >
                    <ChevronRight size={15} />
                  </button>
                  <button
                    onClick={() => setSelectedIndex(null)}
                    title="Tutup (Esc)"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 transition ml-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Konten Kartu Identitas */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
                {/* Bagian Atas: Foto + Nama + Jabatan */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 text-center sm:text-left">
                  <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-md shrink-0 bg-slate-900">
                    <SafeAvatar
                      src={selectedPengurus.foto}
                      alt={selectedPengurus.nama}
                      className="object-cover object-top"
                      textClass="text-2xl"
                      sizes="112px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-blue-600/10 dark:bg-yellow-400/15 text-blue-700 dark:text-yellow-400 border border-blue-500/20 dark:border-yellow-400/30 mb-2">
                      {selectedPengurus._kategori || "Pengurus Komisariat"}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                      {selectedPengurus.nama || "Nama Kosong"}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-1">
                      {selectedPengurus.jabatan || "Anggota"}
                    </p>
                  </div>
                </div>

                {/* Matriks Data Kader */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* NIM */}
                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                        NIM Mahasiswa
                      </span>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                        {selectedPengurus.nim || "-"}
                      </p>
                    </div>
                    {selectedPengurus.nim && selectedPengurus.nim !== "-" && (
                      <button
                        onClick={() =>
                          handleCopyText(selectedPengurus.nim, "nim")
                        }
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-yellow-400 shrink-0"
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

                  {/* NIA */}
                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                        NIA Kader
                      </span>
                      <p className="font-mono font-bold text-blue-600 dark:text-yellow-400 mt-0.5 truncate">
                        {selectedPengurus.nia || "-"}
                      </p>
                    </div>
                    {selectedPengurus.nia && selectedPengurus.nia !== "-" && (
                      <button
                        onClick={() =>
                          handleCopyText(selectedPengurus.nia, "nia")
                        }
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-yellow-400 shrink-0"
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

                  {/* Asal Rayon */}
                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                    <MapPin
                      size={16}
                      className="text-blue-600 dark:text-yellow-400 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                        Basis Rayon
                      </span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                        {selectedPengurus.rayon || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Angkatan */}
                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                    <Calendar
                      size={16}
                      className="text-blue-600 dark:text-yellow-400 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                        Tahun Angkatan
                      </span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                        {selectedPengurus.angkatan
                          ? `Angkatan ${selectedPengurus.angkatan}`
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tombol Kontak WhatsApp */}
                {selectedPengurus.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedPengurus.whatsapp.replace(
                      /[^0-9]/g,
                      ""
                    )}?text=Assalamualaikum%20Sahabat%20${encodeURIComponent(
                      selectedPengurus.nama
                    )}...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
                  >
                    <MessageSquare size={16} />
                    <span>Hubungi Pengurus via WhatsApp</span>
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
