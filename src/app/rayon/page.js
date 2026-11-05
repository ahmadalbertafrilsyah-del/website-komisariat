"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import GridSkeleton from "@/components/GridSkeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  MapPin,
  BookOpen,
  ExternalLink,
  Shield,
  ArrowRight,
  ArrowUpRight,
  Compass,
  Map,
  Search,
  Users,
  GraduationCap,
  X,
  MessageCircle,
  FileText,
  Wallet,
  Target,
  LayoutGrid,
  ListFilter,
  Building2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// Komponen Logo Rayon Aman (Anti-Broken-Image)
const SafeRayonLogo = ({ src, alt, sizeClass = "w-8 h-8" }) => {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={alt || "Logo Rayon"}
        fill
        onError={() => setImgError(true)}
        className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 768px) 120px, 160px"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-blue-600 dark:text-yellow-400">
      <Compass className={sizeClass} strokeWidth={1.75} />
    </div>
  );
};

export default function RayonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rayonData, setRayonData] = useState([]);
  const [anggotaList, setAnggotaList] = useState([]);
  const [alumniList, setAlumniList] = useState([]);

  // State Interaktif & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFakultas, setSelectedFakultas] = useState("SEMUA");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [previewRayon, setPreviewRayon] = useState(null); // Modal Quick Preview BPH & Statistik Rayon

  useEffect(() => {
    async function fetchAllRayonEcosystem() {
      try {
        const [rayonSnap, anggotaSnap, alumniSnap] = await Promise.all([
          getDoc(doc(db, "website_config", "database_rayon")),
          getDoc(doc(db, "website_config", "database_anggota")),
          getDoc(doc(db, "website_config", "database_alumni")),
        ]);

        if (rayonSnap.exists() && rayonSnap.data().listRayon) {
          setRayonData(rayonSnap.data().listRayon);
        }
        if (anggotaSnap.exists() && anggotaSnap.data().listAnggota) {
          setAnggotaList(anggotaSnap.data().listAnggota);
        }
        if (alumniSnap.exists() && alumniSnap.data().listAlumni) {
          setAlumniList(alumniSnap.data().listAlumni);
        }
      } catch (error) {
        console.error("Gagal menarik data ekosistem rayon:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllRayonEcosystem();
  }, []);

  // Hitung statistik kader & alumni per rayon secara otomatis
  const enrichedRayonList = useMemo(() => {
    return rayonData.map((r, idx) => {
      const rNameLower = (r.nama || "").toLowerCase().trim();

      const matchedKader = anggotaList.filter(
        (k) => (k.rayon || "").toLowerCase().trim() === rNameLower
      );
      const matchedAlumni = alumniList.filter(
        (a) => (a.asalRayon || "").toLowerCase().trim() === rNameLower
      );

      // Hitung jumlah pengurus inti yang sudah terisi
      const bphList = [
        { role: "Ketua Rayon", nama: r.ketua, wa: r.waKetua, icon: Shield },
        {
          role: "Sekretaris",
          nama: r.sekretaris,
          wa: r.waSekret,
          icon: FileText,
        },
        { role: "Bendahara", nama: r.bendahara, wa: r.waBendum, icon: Wallet },
        {
          role: "CO Kaderisasi",
          nama: r.coKaderisasi,
          wa: r.waKaderisasi,
          icon: Target,
        },
        {
          role: "CO Gerakan",
          nama: r.coGerakan,
          wa: r.waGerakan,
          icon: Compass,
        },
      ];

      const slug = encodeURIComponent(
        (r.nama || "").toLowerCase().replace(/\s+/g, "-")
      );

      return {
        ...r,
        _idx: idx,
        _slug: slug,
        _kaderCount: matchedKader.length,
        _alumniCount: matchedAlumni.length,
        _bphList: bphList,
      };
    });
  }, [rayonData, anggotaList, alumniList]);

  const uniqueFakultas = useMemo(() => {
    const setFak = new Set(
      rayonData.map((r) => (r.fakultas || "").trim()).filter(Boolean)
    );
    return ["SEMUA", ...Array.from(setFak)];
  }, [rayonData]);

  const filteredRayon = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedRayonList.filter((r) => {
      const matchFak =
        selectedFakultas === "SEMUA" ||
        (r.fakultas || "").trim() === selectedFakultas;
      const matchSearch =
        !q ||
        (r.nama || "").toLowerCase().includes(q) ||
        (r.fakultas || "").toLowerCase().includes(q) ||
        (r.ketua || "").toLowerCase().includes(q) ||
        (r.alamat || "").toLowerCase().includes(q) ||
        (r.deskripsi || "").toLowerCase().includes(q);
      return matchFak && matchSearch;
    });
  }, [enrichedRayonList, selectedFakultas, searchQuery]);

  const totalKaderInRayon = useMemo(
    () => enrichedRayonList.reduce((acc, r) => acc + r._kaderCount, 0),
    [enrichedRayonList]
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070d19] font-sans text-slate-900 dark:text-slate-100 w-full overflow-x-hidden flex flex-col pb-16 xl:pb-0 transition-colors duration-300">
      <Navbar />

      {/* ================= 1. ARCHITECTURAL HEADER ================= */}
      <section className="relative pt-24 md:pt-28 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8 bg-[#091122] text-white border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:56px_56px] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto">

          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-mono uppercase tracking-wider mb-4">
                <Compass className="w-3.5 h-3.5" />
                <span>Ujung Tombak Kaderisasi</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-4">
                Database <span className="text-yellow-400">Rayon</span>
              </h1>
              <p className="text-slate-300/90 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
                Kenali lebih dekat ruang dialektika, sekretariat, pengurus inti
                (BPH), serta sebaran kader di masing-masing rayon tingkat
                fakultas.
              </p>
            </div>

            {/* Telemetri Rayon */}
            <div className="lg:col-span-5 grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 sm:p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block mb-1">
                  /01 RAYON
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
                  {rayonData.length}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block truncate">
                  Rayon Aktif
                </span>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 sm:p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block mb-1">
                  /02 FAKULTAS
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
                  {Math.max(0, uniqueFakultas.length - 1)}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block truncate">
                  Rumpun Ilmu
                </span>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 sm:p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block mb-1">
                  /03 KADER
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
                  {totalKaderInRayon || anggotaList.length}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block truncate">
                  Terintegrasi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. STICKY SEARCH & FACULTY FILTER BAR ================= */}
      <section className="sticky top-16 md:top-20 z-30 bg-white/95 dark:bg-[#0b1324]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Input Pencarian Rayon */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama rayon, fakultas, ketua rayon, atau alamat basecamp..."
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

            {/* Switcher Mode Kartu vs Tabel Perbandingan */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-end sm:self-auto w-full sm:w-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-yellow-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu Rayon</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-yellow-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Matriks Basis</span>
              </button>
            </div>
          </div>

          {/* Filter Tab Fakultas */}
          {uniqueFakultas.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {uniqueFakultas.map((fak) => {
                const isSelected = selectedFakultas === fak;
                return (
                  <button
                    key={fak}
                    onClick={() => setSelectedFakultas(fak)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                      isSelected
                        ? "bg-blue-600 dark:bg-yellow-400 text-white dark:text-slate-950 border-blue-600 dark:border-yellow-400"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400"
                    }`}
                  >
                    {fak === "SEMUA" ? "SEMUA FAKULTAS" : fak}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= 3. DAFTAR BASIS RAYON ================= */}
      <section className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow">
        {loading ? (
          <GridSkeleton />
        ) : filteredRayon.length === 0 ? (
          <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center max-w-xl mx-auto">
            <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">
              Data Rayon Tidak Ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
              Tidak ada basis rayon yang cocok dengan kata kunci atau filter
              fakultas yang dipilih.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedFakultas("SEMUA");
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full">
            {filteredRayon.map((rayon, index) => (
              <motion.article
                key={`${rayon.nama}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.25) }}
                className="group bg-white dark:bg-[#0d1526] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-yellow-400/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Header Kartu: Logo + Fakultas + Nomor Basis */}
                  <div
                    onClick={() => router.push(`/rayon/${rayon._slug}`)}
                    className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 flex items-center gap-4 cursor-pointer"
                  >
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden shadow-2xs">
                      <SafeRayonLogo src={rayon.logoUrl} alt={rayon.nama} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600/10 dark:bg-yellow-400/15 text-blue-700 dark:text-yellow-400 text-[10px] font-mono font-bold uppercase tracking-wider truncate">
                          <BookOpen className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {rayon.fakultas || "Fakultas"}
                          </span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                          #0{rayon._idx + 1}
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors">
                        {rayon.nama}
                      </h2>
                    </div>
                  </div>

                  {/* Isi Tengah: Deskripsi, Ketua, Alamat, & Statistik Kader/Alumni */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[38px]">
                      {rayon.deskripsi ||
                        "Basis pergerakan dan kaderisasi mahasiswa Islam tingkat fakultas di lingkungan PK. PMII Sunan Ampel Malang."}
                    </p>

                    {/* Statistik Real-Time Kader & Alumni di Rayon Ini */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <Link
                        href={`/rayon/${rayon._slug}`}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Kader Aktif
                          </span>
                          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                            {rayon._kaderCount}
                          </span>
                        </div>
                        <Users className="w-4 h-4 text-blue-600 dark:text-yellow-400" />
                      </Link>

                      <Link
                        href="/alumni"
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Jejaring Alumni
                          </span>
                          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                            {rayon._alumniCount}
                          </span>
                        </div>
                        <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </Link>
                    </div>

                    {/* Ketua Rayon & Basecamp */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                          <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" />
                          <span>Ketua Rayon:</span>
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {rayon.ketua || "Belum ditentukan"}
                        </span>
                      </div>

                      {rayon.alamat && (
                        <div className="flex items-start gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{rayon.alamat}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Aksi Kartu Rayon (Responsif di HP) */}
                <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewRayon(rayon)}
                      className="col-span-1 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      title="Lihat BPH & Kontak Rayon"
                    >
                      <Users size={13} />
                      <span>BPH</span>
                    </button>

                    {rayon.igUrl ? (
                      <a
                        href={rayon.igUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-1 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ExternalLink size={13} />
                        <span>IG</span>
                      </a>
                    ) : (
                      <span className="col-span-1 py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed">
                        <ExternalLink size={13} />
                        <span>IG</span>
                      </span>
                    )}

                    {rayon.mapUrl ? (
                      <a
                        href={rayon.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-1 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Map size={13} />
                        <span>Peta</span>
                      </a>
                    ) : (
                      <span className="col-span-1 py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed">
                        <Map size={13} />
                        <span>Peta</span>
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/rayon/${rayon._slug}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-yellow-400 hover:bg-blue-600 dark:hover:bg-yellow-300 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span>Eksplorasi Profil & Kader Rayon</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          /* MODE TABEL MATRIKS PERBANDINGAN RAYON */
          <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4 w-12">#</th>
                    <th className="py-3.5 px-4">Basis Rayon & Fakultas</th>
                    <th className="py-3.5 px-4">Ketua Rayon</th>
                    <th className="py-3.5 px-4 text-center">Kader Aktif</th>
                    <th className="py-3.5 px-4 hidden md:table-cell text-center">
                      Alumni
                    </th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs sm:text-sm">
                  {filteredRayon.map((rayon, idx) => (
                    <tr
                      key={`tbl-rayon-${idx}`}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        0{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/rayon/${rayon._slug}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden">
                            <SafeRayonLogo
                              src={rayon.logoUrl}
                              alt={rayon.nama}
                              sizeClass="w-4 h-4"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors">
                              {rayon.nama}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {rayon.fakultas || "-"}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {rayon.ketua || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-yellow-400 font-mono font-bold text-xs">
                          {rayon._kaderCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                        {rayon._alumniCount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewRayon(rayon)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                          >
                            BPH
                          </button>
                          <Link
                            href={`/rayon/${rayon._slug}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-950 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <span>Profil</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ================= 4. MODAL PRATINJAU CEPAT BPH & KONTAK RAYON ================= */}
      <AnimatePresence>
        {previewRayon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewRayon(null)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-white dark:bg-[#0b1324] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="bg-[#091122] text-white px-5 py-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 size={16} className="text-yellow-400 shrink-0" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider truncate">
                    STRUKTUR INTI (BPH) & SEKRETARIAT RAYON
                  </span>
                </div>
                <button
                  onClick={() => setPreviewRayon(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
                {/* Identitas Rayon */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="relative w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden">
                    <SafeRayonLogo
                      src={previewRayon.logoUrl}
                      alt={previewRayon.nama}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-yellow-400 block">
                      {previewRayon.fakultas || "Fakultas"}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                      {previewRayon.nama}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {previewRayon._kaderCount} Kader Aktif •{" "}
                      {previewRayon._alumniCount} Alumni Terdata
                    </p>
                  </div>
                </div>

                {/* Daftar 5 Pengurus Inti Rayon + Tombol WA */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Jajaran Pengurus Inti Rayon:
                  </span>
                  {previewRayon._bphList.map((bph, i) => {
                    const IconComp = bph.icon;
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-yellow-400 shrink-0">
                            <IconComp size={16} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                              {bph.role}
                            </span>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {bph.nama || "Belum diisi"}
                            </p>
                          </div>
                        </div>

                        {bph.wa && (
                          <a
                            href={`https://wa.me/${bph.wa.replace(
                              /[^0-9]/g,
                              ""
                            )}?text=Assalamualaikum%20Sahabat/i%20${encodeURIComponent(
                              bph.nama || bph.role
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                          >
                            <MessageCircle size={13} />
                            <span>Chat</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tombol Menuju Halaman Penuh Rayon */}
                <div className="pt-2">
                  <Link
                    href={`/rayon/${previewRayon._slug}`}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <span>Buka Halaman Penuh & Direktori Kader Rayon</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
