"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import GridSkeleton from "@/components/GridSkeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  Trophy,
  Award,
  BookOpen,
  ExternalLink,
  Calendar,
  Medal,
  Share2,
  Sparkles,
  FileText,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Check,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PK";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isAkademikType(p) {
  const tipeLower = String(p?.tipe || p?.kategori || "").toLowerCase();
  return (
    (tipeLower.includes("akad") && !tipeLower.includes("non")) ||
    tipeLower.includes("kaderisasi") ||
    tipeLower.includes("jurnal")
  );
}

function isLikelyImageUrl(url = "") {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return Boolean(
    trimmed.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) ||
      trimmed.includes("res.cloudinary.com") ||
      trimmed.includes("ibb.co") ||
      trimmed.includes("imgbb")
  );
}

function ApresiasiAvatar({ src, name, size = "md", rank = null }) {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = {
    md: "w-14 h-14 sm:w-16 sm:h-16 text-base rounded-2xl",
    lg: "w-20 h-20 sm:w-24 sm:h-24 text-xl rounded-2xl",
  };

  const borderStyle =
    rank === 0
      ? "border-2 border-amber-400 ring-4 ring-amber-400/15"
      : rank === 1
      ? "border-2 border-slate-300 dark:border-slate-500"
      : rank === 2
      ? "border-2 border-amber-600/70"
      : "border border-slate-200 dark:border-slate-700";

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-slate-900 dark:bg-blue-950 text-amber-400 font-black flex items-center justify-center shadow-sm ${
        sizeClasses[size] || sizeClasses.md
      } ${borderStyle}`}
    >
      {src && !imgError ? (
        <Image
          src={src}
          alt={name || "Kader PMII"}
          fill
          className="object-cover"
          sizes={size === "lg" ? "96px" : "64px"}
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

function SafePrestasiMedia({ linkOrFoto, isAkad, judul }) {
  const [imgError, setImgError] = useState(false);
  const showImage = isLikelyImageUrl(linkOrFoto) && !imgError;

  if (showImage) {
    return (
      <a
        href={linkOrFoto}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-full sm:w-36 h-36 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group/img block"
        title="Klik untuk memperbesar dokumentasi"
      >
        <Image
          src={linkOrFoto}
          alt={judul || "Dokumentasi Prestasi"}
          fill
          className="object-cover group-hover/img:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, 144px"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-slate-950/0 group-hover/img:bg-slate-950/30 transition-colors flex items-center justify-center">
          <ExternalLink
            size={16}
            className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow"
          />
        </div>
      </a>
    );
  }

  return (
    <div
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 border ${
        isAkad
          ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/70 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/70 text-amber-600 dark:text-amber-400"
      }`}
    >
      {isAkad ? <BookOpen size={22} /> : <Award size={22} />}
    </div>
  );
}

export default function ApresiasiClient() {
  const [loading, setLoading] = useState(true);
  const [kaderData, setKaderData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRayon, setSelectedRayon] = useState("Semua");
  const [activeTab, setActiveTab] = useState("semua"); // "semua" | "akademik" | "non-akademik"

  const [activeKaderId, setActiveKaderId] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    async function fetchApresiasi() {
      try {
        const docRef = doc(db, "website_config", "database_apresiasi");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listApresiasi) {
          const seenIds = new Set();
          const dataValid = docSnap
            .data()
            .listApresiasi.filter((k) => k.prestasi && k.prestasi.length > 0)
            .map((k, idx) => {
              const rawId = k.id ? String(k.id) : `apr-${idx}`;
              const uniqueId = seenIds.has(rawId) ? `${rawId}-${idx}` : rawId;
              seenIds.add(uniqueId);
              const namaLengkap =
                k.namaLengkap || k.namaKader || k.nama || "Kader PMII";
              return {
                ...k,
                id: uniqueId,
                namaLengkap,
                asalRayon: k.asalRayon || k.rayon || "PK. PMII Sunan Ampel",
                fotoKader: k.fotoKader || k.foto || "",
              };
            });

          setKaderData(dataValid);

          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const sharedKaderName = params.get("kader");
            if (sharedKaderName) {
              const decoded = decodeURIComponent(sharedKaderName)
                .toLowerCase()
                .trim();
              const foundKader = dataValid.find(
                (k) => (k.namaLengkap || "").toLowerCase().trim() === decoded
              );
              if (foundKader) {
                setActiveKaderId(foundKader.id);
              }
            }
          }
        }
      } catch (error) {
        console.error("Gagal menarik data apresiasi:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchApresiasi();
  }, []);

  // Telemetry stats across all kaderData
  const telemetry = useMemo(() => {
    let totalPrestasi = 0;
    let totalAkademik = 0;
    let totalNonAkademik = 0;

    kaderData.forEach((k) => {
      (k.prestasi || []).forEach((p) => {
        totalPrestasi++;
        if (isAkademikType(p)) totalAkademik++;
        else totalNonAkademik++;
      });
    });

    return {
      totalKader: kaderData.length,
      totalPrestasi,
      totalAkademik,
      totalNonAkademik,
    };
  }, [kaderData]);

  // Unique rayon list
  const listRayon = useMemo(() => {
    return [
      "Semua",
      ...new Set(kaderData.map((k) => k.asalRayon).filter(Boolean)),
    ];
  }, [kaderData]);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return kaderData
      .map((kader) => {
        const allPrestasi = Array.isArray(kader.prestasi) ? kader.prestasi : [];
        const akadCount = allPrestasi.filter((p) => isAkademikType(p)).length;
        const nonAkadCount = allPrestasi.length - akadCount;

        const filteredPrestasi = allPrestasi.filter((p) => {
          if (activeTab === "semua") return true;
          if (activeTab === "akademik") return isAkademikType(p);
          return !isAkademikType(p);
        });

        return {
          ...kader,
          filteredPrestasi,
          akadCount,
          nonAkadCount,
        };
      })
      .filter((kader) => kader.filteredPrestasi.length > 0)
      .filter(
        (kader) =>
          selectedRayon === "Semua" || kader.asalRayon === selectedRayon
      )
      .filter((item) => {
        if (!q) return true;
        const matchName = (item.namaLengkap || "").toLowerCase().includes(q);
        const matchRayon = (item.asalRayon || "").toLowerCase().includes(q);
        const matchPrestasi = item.filteredPrestasi.some(
          (p) =>
            (p.judul || "").toLowerCase().includes(q) ||
            (p.pencapaian || "").toLowerCase().includes(q) ||
            (p.tingkat || "").toLowerCase().includes(q) ||
            String(p.tahun || "")
              .toLowerCase()
              .includes(q)
        );
        return matchName || matchRayon || matchPrestasi;
      })
      .sort((a, b) => b.filteredPrestasi.length - a.filteredPrestasi.length);
  }, [kaderData, activeTab, selectedRayon, searchQuery]);

  // Active Kader for Modal
  const activeKaderIndex = useMemo(() => {
    if (!activeKaderId) return -1;
    return processedData.findIndex((k) => k.id === activeKaderId);
  }, [processedData, activeKaderId]);

  const activeKader = useMemo(() => {
    if (!activeKaderId) return null;
    return kaderData.find((k) => k.id === activeKaderId) || null;
  }, [kaderData, activeKaderId]);

  const handleOpenKader = (kader) => {
    setActiveKaderId(kader.id);
    if (typeof window !== "undefined") {
      window.history.pushState(
        null,
        "",
        `?kader=${encodeURIComponent(kader.namaLengkap)}`
      );
    }
  };

  const handleCloseKader = () => {
    setActiveKaderId(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/apresiasi`);
    }
  };

  const handlePrevNextModal = (dir) => {
    if (processedData.length === 0) return;
    let nextIdx = activeKaderIndex + dir;
    if (nextIdx < 0) nextIdx = processedData.length - 1;
    if (nextIdx >= processedData.length) nextIdx = 0;
    const target = processedData[nextIdx];
    if (target) handleOpenKader(target);
  };

  const handleShare = async (kader, e) => {
    if (e) e.stopPropagation();
    if (!kader || typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/apresiasi?kader=${encodeURIComponent(
      kader.namaLengkap
    )}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rekam Jejak ${kader.namaLengkap} - PMII`,
          text: `Lihat profil pencapaian akademik, perlombaan, dan kaderisasi dari sahabat/i ${kader.namaLengkap} di Hall of Fame PMII!`,
          url: shareUrl,
        });
      } catch {
        // User dibatalkan
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] font-sans text-slate-900 dark:text-slate-100 flex flex-col pb-16 xl:pb-0">
      <Navbar />

      {/* ARCHITECTURAL HALL OF FAME HEADER */}
      <section className="relative pt-28 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 bg-[#020617] text-white border-b border-slate-800/80 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-950/80 border border-blue-800/70 text-amber-400 text-[11px] font-mono uppercase tracking-widest mb-4">
                <Sparkles size={13} />
                Hall of Fame & Karya Intelektual
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
                <span className="text-amber-400">Prestasi Kader</span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Arsip pencapaian akademik, publikasi jurnal ilmiah, kejuaraan
                lomba, serta rekam jejak kaderisasi sahabat/i PK. PMII Sunan
                Ampel Malang.
              </p>
            </div>

            {/* Live Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Kader Tercatat
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {telemetry.totalKader}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Total Capaian
                </p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                  {telemetry.totalPrestasi}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  Karya / Akademik
                </p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
                  {telemetry.totalAkademik}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-blue-400">
                  Kejuaraan / Lomba
                </p>
                <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-0.5">
                  {telemetry.totalNonAkademik}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH & CATEGORY FILTER CONSOLE */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-8 relative z-20 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/70 gap-1">
              <button
                onClick={() => setActiveTab("semua")}
                className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "semua"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Layers size={14} className="shrink-0" />
                <span>Semua ({telemetry.totalPrestasi})</span>
              </button>
              <button
                onClick={() => setActiveTab("akademik")}
                className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "akademik"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookOpen size={14} className="shrink-0" />
                <span className="truncate">Akademik ({telemetry.totalAkademik})</span>
              </button>
              <button
                onClick={() => setActiveTab("non-akademik")}
                className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "non-akademik"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Award size={14} className="shrink-0" />
                <span className="truncate">
                  Non-Akad ({telemetry.totalNonAkademik})
                </span>
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">
              Menampilkan{" "}
              <strong className="text-slate-900 dark:text-white">
                {processedData.length}
              </strong>{" "}
              profil kader berprestasi
            </span>
          </div>

          {/* Search & Rayon Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kader, judul jurnal/lomba, tingkat kejuaraan, atau tahun..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="relative sm:w-64 shrink-0">
              <Filter
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                value={selectedRayon}
                onChange={(e) => setSelectedRayon(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 truncate"
              >
                {listRayon.map((r, i) => (
                  <option key={i} value={r}>
                    {r === "Semua" ? "Semua Asal Rayon" : r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* APPRECIATION CARDS GRID */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow">
        {loading ? (
          <GridSkeleton />
        ) : processedData.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto">
            <Trophy
              size={44}
              className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
            />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Data Apresiasi Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Belum ada rekam jejak prestasi yang cocok dengan pencarian atau filter kategori saat ini.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedRayon("Semua");
                setActiveTab("semua");
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              Tampilkan Semua Apresiasi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {processedData.map((kader, idx) => {
              const previewItems = kader.filteredPrestasi.slice(0, 2);
              const remainingCount = Math.max(
                0,
                kader.filteredPrestasi.length - previewItems.length
              );

              const rankStyle =
                idx === 0
                  ? "bg-amber-400 text-slate-950 border-amber-400"
                  : idx === 1
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                  : idx === 2
                  ? "bg-amber-700/20 text-amber-700 dark:text-amber-300 border-amber-600/40"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";

              return (
                <motion.div
                  key={`${kader.id || "apr"}-${idx}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25 }}
                  onClick={() => handleOpenKader(kader)}
                  className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden relative"
                >
                  {/* Top Accent Line */}
                  <div
                    className={`h-1 w-full ${
                      idx === 0
                        ? "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500"
                        : "bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 opacity-75 group-hover:opacity-100"
                    }`}
                  />

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    {/* Header Meta Row: Rank + Category Counters */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${rankStyle}`}
                      >
                        <Trophy size={11} />
                        #{String(idx + 1).padStart(2, "0")}
                        {idx < 3 ? " TERBAIK" : ""}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {kader.akadCount > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70"
                            title="Capaian Akademik / Kaderisasi"
                          >
                            <BookOpen size={10} /> {kader.akadCount}
                          </span>
                        )}
                        {kader.nonAkadCount > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70"
                            title="Kejuaraan Lomba / Non-Akademik"
                          >
                            <Award size={10} /> {kader.nonAkadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Profile Identity Block (Horizontal & Clean) */}
                    <div className="flex items-center gap-3.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                      <ApresiasiAvatar
                        src={kader.fotoKader}
                        name={kader.namaLengkap}
                        size="md"
                        rank={idx}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-base sm:text-lg leading-snug line-clamp-2">
                          {kader.namaLengkap}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {kader.asalRayon}
                        </p>
                      </div>
                    </div>

                    {/* Achievements Preview List (Up to 2 items) */}
                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <span>Sorotan Capaian & Karya</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {kader.filteredPrestasi.length} Prestasi
                        </span>
                      </div>

                      {previewItems.map((pres, pIdx) => {
                        const isAkad = isAkademikType(pres);
                        return (
                          <div
                            key={pres.id || pIdx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800/90 flex items-start gap-2.5"
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isAkad
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                                  : "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {isAkad ? (
                                <BookOpen size={14} />
                              ) : (
                                <Award size={14} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-[13px] leading-snug line-clamp-2">
                                {pres.judul || "Capaian Kader PMII"}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {pres.pencapaian && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                    {pres.pencapaian}
                                  </span>
                                )}
                                {pres.tingkat && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                    {pres.tingkat}
                                  </span>
                                )}
                                {pres.tahun && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    • {pres.tahun}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {remainingCount > 0 && (
                        <div className="text-center py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/40 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                          + {remainingCount} rekam capaian lainnya
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Action Bar */}
                  <div className="px-4 sm:px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Buka Rekam Jejak <ArrowUpRight size={14} />
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleShare(kader, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition"
                      title="Bagikan Rekam Jejak Kader"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL DOSSIER REKAM JEJAK KADER */}
      <AnimatePresence>
        {activeKader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseKader}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
            >
              {/* Sticky Top Bar */}
              <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                    Hall of Fame Dossier // Rekam Jejak Kader
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleShare(activeKader, e)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition mr-1"
                  >
                    {copiedShare ? <Check size={14} /> : <Share2 size={14} />}
                    <span className="hidden sm:inline">
                      {copiedShare ? "Tersalin" : "Bagikan"}
                    </span>
                  </button>
                  {processedData.length > 1 && (
                    <>
                      <button
                        onClick={() => handlePrevNextModal(-1)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        title="Kader Sebelumnya"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => handlePrevNextModal(1)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        title="Kader Selanjutnya"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleCloseKader}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition ml-1"
                    title="Tutup"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Profile Header */}
              <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ApresiasiAvatar
                    src={activeKader.fotoKader}
                    name={activeKader.namaLengkap}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-600 text-white mb-1.5">
                      {activeKader.asalRayon}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                      {activeKader.namaLengkap}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Total{" "}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {activeKader.prestasi?.length || 0} Capaian
                      </strong>{" "}
                      terdokumentasi di Komisariat
                    </p>
                  </div>
                </div>
              </div>

              {/* Achievements List */}
              <div className="p-5 sm:p-6 space-y-3.5">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                    Daftar Lengkap Pencapaian & Karya
                  </h4>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-amber-400">
                    {activeKader.prestasi?.length || 0} Rekaman
                  </span>
                </div>

                {(activeKader.prestasi || []).map((p, idx) => {
                  const isAkad = isAkademikType(p);
                  const hasMedia =
                    p.linkOrFoto && String(p.linkOrFoto).trim() !== "";

                  return (
                    <div
                      key={p.id || idx}
                      className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row gap-4 items-start hover:border-blue-500/40 transition"
                    >
                      <SafePrestasiMedia
                        linkOrFoto={p.linkOrFoto}
                        isAkad={isAkad}
                        judul={p.judul}
                      />

                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                              isAkad
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {isAkad
                              ? "Akademik / Kaderisasi"
                              : "Lomba / Non-Akademik"}
                          </span>

                          {p.pencapaian && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-blue-600 text-white">
                              {p.pencapaian}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug mb-2.5">
                          {p.judul || "Capaian Prestasi Kader"}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-700/70">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 font-semibold">
                            <Medal size={13} className="text-amber-500" />
                            Tingkat: {p.tingkat || "Lokal"}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 font-mono font-semibold">
                            <Calendar size={13} className="text-blue-500" />
                            {p.tahun || "-"}
                          </span>

                          {hasMedia && (
                            <a
                              href={p.linkOrFoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sm:ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-600 text-blue-600 dark:text-blue-300 hover:text-white font-bold transition"
                            >
                              {isAkad ? (
                                <FileText size={13} />
                              ) : (
                                <ExternalLink size={13} />
                              )}
                              <span>
                                {isAkad
                                  ? "Buka Karya / Bukti"
                                  : "Lihat Sertifikat / Dokumentasi"}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
