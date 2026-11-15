"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import GridSkeleton from "@/components/GridSkeleton";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  MonthlyMagazineCover,
  MagazineBookPage,
  downloadArticleAsEkoranPng,
  printEkoranClean,
} from "@/components/EkoranPMII";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ExternalLink,
  User,
  Clock,
  Newspaper,
  Eye,
  X,
  Sparkles,
  ArrowUpRight,
  Tag,
  Download,
  Printer,
  Calendar,
  Layers,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";

const createSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const extractSnippet = (htmlContent, maxLength = 150) => {
  if (!htmlContent) return "";
  const plainText = htmlContent
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + "...";
};

const estimateReadTime = (htmlContent) => {
  if (!htmlContent) return 1;
  const words = htmlContent
    .replace(/<[^>]*>?/gm, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const getCategoryBadgeStyle = (cat) => {
  switch (cat) {
    case "Opini Kader":
      return "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70";
    case "Kajian & Artikel":
      return "bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/70";
    case "Pengumuman":
      return "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70";
    default:
      return "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/70";
  }
};

function SafeNewsImage({ src, alt, category, priority = false, sizes }) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={alt || "Kabar Pergerakan PMII"}
        fill
        priority={priority}
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes={sizes || "(max-width: 768px) 100vw, 50vw"}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 mb-2">
        <Newspaper size={22} />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
        {category || "Redaksi PMII Sunan Ampel"}
      </span>
    </div>
  );
}

const CATEGORIES = [
  "Semua",
  "Berita Utama",
  "Opini Kader",
  "Kajian & Artikel",
  "Pengumuman",
];

export default function Berita() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(7);

  const [allArticles, setAllArticles] = useState([]);
  const [externalLink, setExternalLink] = useState("");
  const [loading, setLoading] = useState(true);

  // State Mode Majalah Bulanan & E-Koran
  const [activeViewMode, setActiveViewMode] = useState("portal"); // "portal" | "majalah"
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [magazineSubView, setMagazineSubView] = useState("cover"); // "cover" | "page" | "bundle"
  const [activeArticleIdx, setActiveArticleIdx] = useState(0);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const currentEkoranRef = useRef(null);

  useEffect(() => {
    async function fetchBerita() {
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const qParam = params.get("search");
          if (qParam) setSearchQuery(decodeURIComponent(qParam));
        }

        const configRef = doc(db, "website_config", "berita_config");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setExternalLink(configSnap.data().externalNewsLink || "");
        }

        const newsRef = collection(db, "berita");
        const q = query(newsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const fetchedNews = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let formattedDate = "Tanggal Tidak Diketahui";
          let rawDateIso = null;
          let monthKey = "2026-11";
          let monthLabel = "November 2026";

          if (data.createdAt) {
            const dateObj = data.createdAt.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt);
            if (Number.isFinite(dateObj.getTime())) {
              rawDateIso = dateObj.toISOString();
              formattedDate = dateObj.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const y = dateObj.getFullYear();
              const m = String(dateObj.getMonth() + 1).padStart(2, "0");
              monthKey = `${y}-${m}`;
              monthLabel = dateObj.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              });
            }
          }

          const content = data.content || "";

          return {
            id: docSnap.id,
            status: data.status || "Terbit",
            title: data.title || "Tanpa Judul",
            category: data.kategori || "Berita Utama",
            date: formattedDate,
            rawDate: rawDateIso,
            monthKey,
            monthLabel,
            content,
            imageUrl: data.imageUrl || "",
            dateline: data.dateline || "",
            penulis: data.penulis || "Tim Redaksi",
            editorName: data.editorName || "",
            fotografer: data.fotografer || "",
            sumber: data.sumber || "",
            tags: data.tags || "",
            views: data.views || 0,
            readTime: estimateReadTime(content),
          };
        });
        setAllArticles(
          fetchedNews.filter((news) => news.status !== "Draf")
        );
      } catch (error) {
        console.error("Gagal memuat berita:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBerita();
  }, []);

  const categoryCounts = useMemo(() => {
    const map = { Semua: allArticles.length };
    CATEGORIES.slice(1).forEach((c) => {
      map[c] = allArticles.filter((a) => a.category === c).length;
    });
    return map;
  }, [allArticles]);

  const totalViews = useMemo(() => {
    return allArticles.reduce((acc, item) => acc + (Number(item.views) || 0), 0);
  }, [allArticles]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allArticles.filter((item) => {
      const matchesCategory =
        selectedCategory === "Semua" || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.tags.toLowerCase().includes(q) ||
        item.penulis.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allArticles, selectedCategory, searchQuery]);

  const featuredArticle = filteredArticles[0] || null;
  const secondaryArticles = filteredArticles.slice(1, visibleCount);

  // Kelompokkan seluruh berita, opini, kajian, dan karya lainnya per bulan menjadi 1 Majalah Bulanan
  const monthlyEditions = useMemo(() => {
    const map = new Map();
    allArticles.forEach((art) => {
      const key = art.monthKey || "2026-11";
      const label = art.monthLabel || "November 2026";
      if (!map.has(key)) {
        map.set(key, {
          monthKey: key,
          monthLabel: label,
          articles: [],
        });
      }
      map.get(key).articles.push(art);
    });
    return Array.from(map.values()).sort((a, b) =>
      b.monthKey.localeCompare(a.monthKey)
    );
  }, [allArticles]);

  const activeEdition = useMemo(() => {
    if (monthlyEditions.length === 0) return null;
    return (
      monthlyEditions.find((e) => e.monthKey === selectedMonthKey) ||
      monthlyEditions[0]
    );
  }, [monthlyEditions, selectedMonthKey]);

  const handleOpenMonthlyEdition = (monthKey, subView = "cover", articleIdx = 0) => {
    setSelectedMonthKey(monthKey);
    setMagazineSubView(subView);
    setActiveArticleIdx(articleIdx);
    setActiveViewMode("majalah");
  };

  const handleDownloadCurrentPagePng = async () => {
    const art =
      activeEdition?.articles?.[activeArticleIdx] ||
      activeEdition?.articles?.[0];
    if (!art) return;
    setIsDownloadingPng(true);
    try {
      const slug = createSlug(
        art?.title || activeEdition?.monthLabel || "ekoran-pmii"
      ).slice(0, 40);
      await downloadArticleAsEkoranPng(
        art,
        `E-Koran-PMII-${slug}.png`,
        `MAJALAH PERGERAKAN • EDISI ${(activeEdition?.monthLabel || "").toUpperCase()}`
      );
    } catch (err) {
      console.error("Gagal mengunduh PNG:", err);
      alert("Gagal mengunduh gambar E-Koran: " + (err?.message || "Silakan coba lagi."));
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handlePrintFullMagazine = async () => {
    if (magazineSubView !== "bundle") {
      setMagazineSubView("bundle");
      await new Promise((r) => setTimeout(r, 350));
    }
    if (currentEkoranRef.current) {
      printEkoranClean(
        currentEkoranRef.current,
        `Majalah Pergerakan PMII - Edisi ${activeEdition?.monthLabel || ""}`
      );
    } else {
      window.print();
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] font-sans flex flex-col text-slate-900 dark:text-slate-100 pb-16 xl:pb-0">
      <Navbar />

      <div className="flex-grow">
        {/* ARCHITECTURAL MASTHEAD HEADER */}
        <section className="relative pt-28 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 bg-[#020617] text-white border-b border-slate-800/80 overflow-hidden">
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
                  Pers & Dialektika Intelektual
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
                  Kabar Pergerakan{" "}
                </h1>

                {externalLink && (
                  <div className="mt-5">
                    <a
                      href={externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-xs sm:text-sm shadow-sm"
                    >
                      Buka Portal Berita Eksternal <ExternalLink size={15} />
                    </a>
                  </div>
                )}
              </div>

              {/* Editorial Telemetry */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Total Terbitan
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                    {allArticles.length}
                  </p>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Rubrik Aktif
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                    {CATEGORIES.length - 1}
                  </p>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Total Dibaca
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-0.5">
                    {totalViews}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STICKY SEARCH & CATEGORY RUBRIK BAR */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-7 relative z-20">
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-200/90 dark:border-slate-800 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setVisibleCount(7);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70"
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input & Mode Majalah Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveViewMode("portal")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeViewMode === "portal"
                      ? "bg-[#020617] dark:bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  <BookOpen size={13} /> Portal Berita
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewMode("majalah")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeViewMode === "majalah"
                      ? "bg-[#facc15] text-slate-950 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  <Newspaper size={13} /> Majalah &amp; E-Koran ({monthlyEditions.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64 lg:w-72 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(7);
                  }}
                  placeholder="Cari judul, topik, penulis..."
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
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
            </div>
          </div>
        </section>

        {/* NEWS EDITORIAL FEED OR MONTHLY MAGAZINE & E-KORAN VIEW */}
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-12">
          {loading ? (
            <GridSkeleton />
          ) : activeViewMode === "majalah" && activeEdition ? (
            /* ================= TAMPILAN MAJALAH BULANAN & E-KORAN PMII ================= */
            <div className="space-y-6">
              {/* Bar Kontrol Majalah Bulanan (Pilih Bulan, Pilih Mode Baca, Download PNG/PDF) */}
              <div className="bg-[#020617] text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4 print:hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-[#facc15] flex items-center justify-center shrink-0">
                      <Newspaper size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#facc15] block">
                        ARSIP KOMPILASI BULANAN KOMISARIAT
                      </span>
                      <h2 className="text-base sm:text-xl font-black text-white">
                        Majalah Pergerakan — Edisi {activeEdition.monthLabel}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Bundel otomatis seluruh Berita Utama, Opini Kader, Kajian &amp; Karya pada bulan {activeEdition.monthLabel} ({activeEdition.articles.length} karya).
                      </p>
                    </div>
                  </div>

                  {/* Pemilih Bulan Edisi Majalah & Tombol Download */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
                      <Calendar size={15} className="text-[#facc15] shrink-0" />
                      <select
                        value={activeEdition.monthKey}
                        onChange={(e) => {
                          setSelectedMonthKey(e.target.value);
                          setActiveArticleIdx(0);
                        }}
                        className="bg-transparent text-xs sm:text-sm font-bold text-white outline-none cursor-pointer"
                      >
                        {monthlyEditions.map((ed) => (
                          <option
                            key={ed.monthKey}
                            value={ed.monthKey}
                            className="text-slate-900"
                          >
                            Edisi {ed.monthLabel} ({ed.articles.length} Karya)
                          </option>
                        ))}
                      </select>
                    </div>

                    {magazineSubView === "page" && (
                      <button
                        type="button"
                        disabled={isDownloadingPng}
                        onClick={handleDownloadCurrentPagePng}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs disabled:opacity-60"
                      >
                        {isDownloadingPng ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                        <span>Download Lembar E-Koran Ini (PNG)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handlePrintFullMagazine}
                      className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Printer size={14} />
                      <span>Download / Cetak Majalah Bulan Ini (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Navigasi Halaman di Dalam Majalah */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMagazineSubView("cover")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        magazineSubView === "cover"
                          ? "bg-[#facc15] text-slate-950"
                          : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      <Sparkles size={13} /> Sampul &amp; Daftar Isi
                    </button>
                    <button
                      type="button"
                      onClick={() => setMagazineSubView("page")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        magazineSubView === "page"
                          ? "bg-[#facc15] text-slate-950"
                          : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      <BookOpen size={13} /> Baca Lembar Buku ({activeArticleIdx + 1}/{activeEdition.articles.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMagazineSubView("bundle")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        magazineSubView === "bundle"
                          ? "bg-[#facc15] text-slate-950"
                          : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      <Layers size={13} /> Bundel Penuh 1 Bulan ({activeEdition.articles.length} Halaman)
                    </button>
                  </div>

                  {magazineSubView === "page" && activeEdition.articles.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={activeArticleIdx === 0}
                        onClick={() => setActiveArticleIdx((p) => Math.max(0, p - 1))}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1 border border-slate-700"
                      >
                        <ChevronLeft size={14} /> Hal. Sebelumnya
                      </button>
                      <span className="text-xs font-mono text-[#facc15]">
                        Halaman {activeArticleIdx + 1} / {activeEdition.articles.length}
                      </span>
                      <button
                        type="button"
                        disabled={activeArticleIdx >= activeEdition.articles.length - 1}
                        onClick={() =>
                          setActiveArticleIdx((p) =>
                            Math.min(activeEdition.articles.length - 1, p + 1)
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1 border border-slate-700"
                      >
                        Hal. Selanjutnya <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Konten Majalah Bulanan Berdasarkan Sub-View */}
              {magazineSubView === "cover" && (
                <MonthlyMagazineCover
                  edition={activeEdition}
                  onSelectArticleIndex={(idx) => {
                    setActiveArticleIdx(idx);
                    setMagazineSubView("page");
                  }}
                />
              )}

              {magazineSubView === "page" && activeEdition.articles[activeArticleIdx] && (
                <div className="space-y-4">
                  <MagazineBookPage
                    article={activeEdition.articles[activeArticleIdx]}
                    monthLabel={activeEdition.monthLabel}
                    pageNumber={activeArticleIdx + 1}
                    totalPages={activeEdition.articles.length}
                    sheetRef={currentEkoranRef}
                  />

                  {/* Navigasi Bawah Buku Majalah (Memudahkan Balik Halaman di HP) */}
                  {activeEdition.articles.length > 1 && (
                    <div className="max-w-[900px] mx-auto bg-[#020617] text-white rounded-xl p-3.5 border border-slate-800 flex items-center justify-between gap-2 print:hidden">
                      <button
                        type="button"
                        disabled={activeArticleIdx === 0}
                        onClick={() => {
                          setActiveArticleIdx((p) => Math.max(0, p - 1));
                          window.scrollTo({ top: 260, behavior: "smooth" });
                        }}
                        className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                      >
                        <ChevronLeft size={15} /> Halaman Sebelumnya
                      </button>

                      <span className="text-xs font-bold text-[#facc15]">
                        Hal. {activeArticleIdx + 1} dari {activeEdition.articles.length}
                      </span>

                      <button
                        type="button"
                        disabled={activeArticleIdx >= activeEdition.articles.length - 1}
                        onClick={() => {
                          setActiveArticleIdx((p) =>
                            Math.min(activeEdition.articles.length - 1, p + 1)
                          );
                          window.scrollTo({ top: 260, behavior: "smooth" });
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[#facc15] hover:bg-amber-300 text-slate-950 disabled:opacity-40 text-xs font-extrabold flex items-center gap-1.5"
                      >
                        Halaman Berikutnya <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {magazineSubView === "bundle" && (
                <div ref={currentEkoranRef} className="space-y-10">
                  <MonthlyMagazineCover
                    edition={activeEdition}
                    onSelectArticleIndex={(idx) => {
                      setActiveArticleIdx(idx);
                      setMagazineSubView("page");
                    }}
                  />
                  {activeEdition.articles.map((art, idx) => (
                    <div key={art.id || idx} className="break-before-page">
                      <MagazineBookPage
                        article={art}
                        monthLabel={activeEdition.monthLabel}
                        pageNumber={idx + 1}
                        totalPages={activeEdition.articles.length}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-900 dark:text-white font-bold text-base">
                Belum Ada Arsip Berita yang Cocok
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Coba gunakan kata kunci lain atau pilih rubrik kategori yang berbeda.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Semua");
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Tampilkan Semua Berita
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 0. RAK MAJALAH BULANAN & E-KORAN PMII (TIAP 1 BULAN JADI 1 MAJALAH) */}
              {monthlyEditions.length > 0 && (
                <div className="bg-gradient-to-br from-[#020617] via-[#0b1938] to-[#020617] text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#facc15]">
                        <Newspaper size={13} /> TERBITAN BERKALA KOMISARIAT
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                        Edisi Majalah Bulanan &amp; E-Koran PMII
                      </h2>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Seluruh berita, opini kader, dan karya intelektual pada setiap bulan dikompilasi menjadi satu Majalah &amp; E-Koran siap unduh.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveViewMode("majalah")}
                      className="px-4 py-2.5 rounded-xl bg-[#facc15] hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-sm"
                    >
                      <Newspaper size={14} /> Buka Ruang Baca Majalah
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {monthlyEditions.slice(0, 3).map((ed) => {
                      const coverArt = ed.articles[0] || {};
                      return (
                        <div
                          key={ed.monthKey}
                          onClick={() => handleOpenMonthlyEdition(ed.monthKey, "cover", 0)}
                          className="group cursor-pointer rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-white/10 hover:border-[#facc15]/60 p-4 flex items-center gap-3.5 transition-all"
                        >
                          <div className="w-16 h-22 rounded-lg bg-[#0b2559] border border-white/15 overflow-hidden relative shrink-0 flex flex-col justify-between p-2 text-center">
                            {coverArt.imageUrl && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={coverArt.imageUrl}
                                alt={ed.monthLabel}
                                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform"
                              />
                            )}
                            <span className="relative z-10 text-[7px] font-mono font-bold uppercase tracking-wider text-[#facc15] bg-slate-950/80 rounded px-1 py-0.5">
                              MAJALAH
                            </span>
                            <span className="relative z-10 text-[9px] font-black text-white leading-tight drop-shadow">
                              {ed.monthLabel}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                              EDISI {ed.monthLabel.toUpperCase()}
                            </span>
                            <h3 className="font-bold text-white text-sm group-hover:text-[#facc15] transition-colors truncate mt-0.5">
                              Majalah Pergerakan {ed.monthLabel}
                            </h3>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {coverArt.title}
                            </p>
                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10 text-[10px] font-mono text-slate-300">
                              <span>{ed.articles.length} Karya / Berita</span>
                              <span className="text-[#facc15] font-bold">
                                Baca &amp; Download →
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1. FEATURED HEADLINE (ARTIKEL UTAMA) */}
              {featuredArticle && (
                <Link
                  href={`/berita/${createSlug(featuredArticle.title)}`}
                  className="group block bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-video lg:aspect-auto lg:min-h-[380px] bg-slate-900 overflow-hidden">
                      <SafeNewsImage
                        src={featuredArticle.imageUrl}
                        alt={featuredArticle.title}
                        category={featuredArticle.category}
                        priority
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                      <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-amber-400 font-mono text-[10px] font-bold uppercase tracking-widest border border-white/10">
                          Sorotan Utama
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-[#0b2559]/90 backdrop-blur-md text-[#facc15] font-mono text-[10px] font-bold uppercase tracking-wider border border-[#facc15]/40 inline-flex items-center gap-1">
                          <Newspaper size={11} /> E-Koran Tersedia
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 p-5 sm:p-7 lg:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs mb-3.5">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${getCategoryBadgeStyle(
                              featuredArticle.category
                            )}`}
                          >
                            {featuredArticle.category}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            • {featuredArticle.date}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                            • <Clock size={11} /> {featuredArticle.readTime} min
                            baca
                          </span>
                        </div>

                        <h2 className="font-black text-slate-900 dark:text-white text-xl sm:text-2xl lg:text-3xl mb-3.5 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {featuredArticle.title}
                        </h2>

                        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-4 mb-6">
                          {featuredArticle.dateline && (
                            <strong className="uppercase font-mono text-slate-900 dark:text-white">
                              {featuredArticle.dateline} —{" "}
                            </strong>
                          )}
                          {extractSnippet(featuredArticle.content, 220)}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0 text-blue-600 dark:text-amber-400">
                            <User size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {featuredArticle.penulis}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {featuredArticle.views > 0
                                ? `${featuredArticle.views}x dibaca`
                                : "Redaksi Komisariat"}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
                          Baca Selengkapnya <ArrowUpRight size={15} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* 2. GRID ARTIKEL LAINNYA (NYAMAN DI HP & LAPTOP) */}
              {secondaryArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {secondaryArticles.map((item) => {
                    const articleSlug = createSlug(item.title);
                    const snippetText = extractSnippet(item.content, 135);
                    const firstTag = item.tags
                      ? item.tags.split(",")[0].trim()
                      : "";

                    return (
                      <Link
                        key={item.id}
                        href={`/berita/${articleSlug}`}
                        className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 shadow-sm hover:shadow-xl transition-all duration-200"
                      >
                        <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden shrink-0">
                          <SafeNewsImage
                            src={item.imageUrl}
                            alt={item.title}
                            category={item.category}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border backdrop-blur-md shadow-sm ${getCategoryBadgeStyle(
                                item.category
                              )}`}
                            >
                              {item.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[#0b2559]/90 backdrop-blur-md text-[#facc15] font-mono text-[9px] font-bold uppercase tracking-wider border border-[#facc15]/40 inline-flex items-center gap-1">
                              <Newspaper size={10} /> E-Koran
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400 mb-2.5">
                              <span>{item.date}</span>
                              <span className="flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} /> {item.readTime} mnt
                                </span>
                                {item.views > 0 && (
                                  <span className="flex items-center gap-1">
                                    • <Eye size={11} /> {item.views}
                                  </span>
                                )}
                              </span>
                            </div>

                            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg mb-2.5 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                              {item.title}
                            </h3>

                            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed line-clamp-3 mb-4">
                              {item.dateline && (
                                <strong className="uppercase font-mono text-slate-800 dark:text-slate-200">
                                  {item.dateline} —{" "}
                                </strong>
                              )}
                              {snippetText}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[60%] flex items-center gap-1.5">
                              <User size={12} className="text-blue-500 shrink-0" />
                              <span className="truncate">{item.penulis}</span>
                            </span>

                            {firstTag ? (
                              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 truncate max-w-[38%]">
                                <Tag size={10} className="text-amber-500 shrink-0" />
                                <span className="truncate">{firstTag}</span>
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-blue-600 dark:text-amber-400">
                                Baca →
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {filteredArticles.length > visibleCount && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => setVisibleCount(visibleCount + 6)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-amber-400 font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm shadow-sm"
              >
                Muat Lebih Banyak Artikel (
                {filteredArticles.length - visibleCount} tersisa){" "}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}
