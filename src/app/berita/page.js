"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import GridSkeleton from "@/components/GridSkeleton";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
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
          if (data.createdAt) {
            const dateObj = data.createdAt.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt);
            if (Number.isFinite(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
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
            content,
            imageUrl: data.imageUrl || "",
            dateline: data.dateline || "",
            penulis: data.penulis || "Tim Redaksi",
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

            {/* Search Input */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(7);
                }}
                placeholder="Cari judul, topik, penulis, atau tag..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
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
        </section>

        {/* NEWS EDITORIAL FEED */}
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-12">
          {loading ? (
            <GridSkeleton />
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
                          <div className="absolute top-3 left-3 z-10">
                            <span
                              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border backdrop-blur-md shadow-sm ${getCategoryBadgeStyle(
                                item.category
                              )}`}
                            >
                              {item.category}
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
