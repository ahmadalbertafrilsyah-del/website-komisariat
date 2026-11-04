"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import GridSkeleton from "@/components/GridSkeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  GraduationCap,
  MapPin,
  Briefcase,
  Calendar,
  X,
  Share2,
  Star,
  FileText,
  ChevronLeft,
  ChevronRight,
  Award,
  Sparkles,
  CheckCircle2,
  LayoutGrid,
  Table2,
  Filter,
  Copy,
  Check,
  Building2,
  Hash,
  UserPlus,
  Plus,
  Upload,
  Loader2,
  Send,
  Clock,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const RAYON_OPTIONS = [
  "PR. PMII “KAWAH” Chondrodimuko",
  "PR. PMII “Perjuangan” Ibnu Aqil",
  "PR. PMII “Radikal” Al-Faruq",
  "PR. PMII “Penakluk” Al-Adawiyah",
  "PR. PMII “Penyelamat” Dja’far Saifuddin",
  "PR. PMII Ekonomi “Moch. Hatta”",
  "PR. PMII Pencerahan Galileo",
];

const JENJANG_KEYS = ["MAPABA", "PKD", "PKL", "SIG", "SKP", "SKK"];

const JENJANG_META = {
  MAPABA: {
    label: "MAPABA",
    full: "Masa Penerimaan Anggota Baru",
    soft: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  PKD: {
    label: "PKD",
    full: "Pelatihan Kader Dasar",
    soft: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  PKL: {
    label: "PKL",
    full: "Pelatihan Kader Lanjut",
    soft: "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  },
  SIG: {
    label: "SIG",
    full: "Sekolah Islam & Gender",
    soft: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  SKP: {
    label: "SKP",
    full: "Sekolah Kader Putri",
    soft: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
  SKK: {
    label: "SKK",
    full: "Sekolah Kader Komisariat / Keprofesian",
    soft: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
};

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AL";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getSafeArray(data) {
  if (Array.isArray(data)) return data.map((s) => String(s).trim()).filter(Boolean);
  if (typeof data === "string" && data.trim() !== "") {
    return data
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeJenjang(jenjang, fallbackTahun) {
  const result = {};
  if (jenjang && typeof jenjang === "object") {
    JENJANG_KEYS.forEach((key) => {
      if (jenjang[key] && String(jenjang[key]).trim() !== "") {
        result[key] = String(jenjang[key]).trim();
      }
    });
  }
  if (
    Object.keys(result).length === 0 &&
    fallbackTahun &&
    String(fallbackTahun).trim() !== "" &&
    fallbackTahun !== "-"
  ) {
    result.MAPABA = String(fallbackTahun).trim();
  }
  return result;
}

function getHighestJenjang(jenjangObj) {
  const order = ["PKL", "SKK", "SKP", "SIG", "PKD", "MAPABA"];
  for (const k of order) {
    if (jenjangObj && jenjangObj[k]) {
      return { key: k, year: jenjangObj[k], ...JENJANG_META[k] };
    }
  }
  return null;
}

function AlumniAvatar({ foto, nama, size = "md" }) {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = {
    sm: "w-10 h-10 text-xs rounded-xl",
    md: "w-14 h-14 text-base rounded-2xl",
    lg: "w-24 h-24 text-2xl rounded-2xl",
  };
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-slate-900 dark:bg-blue-950 text-amber-400 font-black flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm ${
        sizeClasses[size] || sizeClasses.md
      }`}
    >
      {foto && !imgError ? (
        <Image
          src={foto}
          alt={nama || "Alumni PMII"}
          fill
          className="object-cover"
          sizes={size === "lg" ? "96px" : "56px"}
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{getInitials(nama)}</span>
      )}
    </div>
  );
}

export default function AlumniClient() {
  const [loading, setLoading] = useState(true);
  const [alumniData, setAlumniData] = useState([]);

  // Search, Filters & View Mode
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRayon, setSelectedRayon] = useState("Semua");
  const [selectedTahun, setSelectedTahun] = useState("Semua");
  const [selectedJenjang, setSelectedJenjang] = useState("Semua");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [selectedAlumniId, setSelectedAlumniId] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // State Form Input Mandiri Alumni (Menunggu ACC Admin)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [selfForm, setSelfForm] = useState({
    nama: "",
    asalRayon: RAYON_OPTIONS[0],
    tahunMapaba: "",
    nim: "",
    nia: "",
    profesiUtama: "",
    instansiUtama: "",
    profesiTambahan: "",
    bidangText: "",
    foto: "",
    jenjang: {
      MAPABA: "",
      PKD: "",
      PKL: "",
      SIG: "",
      SKP: "",
      SKK: "",
    },
  });

  const handleUploadSelfFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file gambar (JPG/PNG/WEBP)!");
      return;
    }
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setSelfForm((prev) => ({ ...prev, foto: data.url }));
      } else {
        alert("Gagal mengunggah foto profil.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSelfSubmitAlumni = async (e) => {
    e.preventDefault();
    if (!selfForm.nama.trim() || !selfForm.tahunMapaba.trim()) {
      alert("Nama Lengkap dan Tahun Angkatan / Mapaba wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = doc(db, "website_config", "database_alumni");
      const docSnap = await getDoc(docRef);
      const existingList =
        docSnap.exists() && Array.isArray(docSnap.data().listAlumni)
          ? docSnap.data().listAlumni
          : [];

      const profesiArr = [
        selfForm.profesiUtama.trim(),
        ...getSafeArray(selfForm.profesiTambahan),
      ].filter(Boolean);

      const deskripsiProfesiObj = {};
      if (selfForm.profesiUtama.trim() && selfForm.instansiUtama.trim()) {
        deskripsiProfesiObj[selfForm.profesiUtama.trim()] =
          selfForm.instansiUtama.trim();
      }

      const jenjangClean = {
        MAPABA:
          selfForm.jenjang.MAPABA.trim() || selfForm.tahunMapaba.trim(),
        PKD: selfForm.jenjang.PKD.trim(),
        PKL: selfForm.jenjang.PKL.trim(),
        SIG: selfForm.jenjang.SIG.trim(),
        SKP: selfForm.jenjang.SKP.trim(),
        SKK: selfForm.jenjang.SKK.trim(),
      };

      const newEntry = {
        id: `alm-self-${Date.now()}`,
        nama: selfForm.nama.trim(),
        nim: selfForm.nim.trim(),
        nia: selfForm.nia.trim(),
        tahunMapaba: selfForm.tahunMapaba.trim(),
        asalRayon: selfForm.asalRayon,
        profesi: profesiArr,
        deskripsiProfesi: deskripsiProfesiObj,
        bidang: getSafeArray(selfForm.bidangText),
        jenjang: jenjangClean,
        foto: selfForm.foto.trim(),
        status: "pending", // Menunggu ACC Admin
        submittedBy: "mandiri",
        createdAt: new Date().toISOString(),
      };

      await setDoc(
        docRef,
        { listAlumni: [newEntry, ...existingList] },
        { merge: true }
      );

      setSubmitSuccess(true);
      setSelfForm({
        nama: "",
        asalRayon: RAYON_OPTIONS[0],
        tahunMapaba: "",
        nim: "",
        nia: "",
        profesiUtama: "",
        instansiUtama: "",
        profesiTambahan: "",
        bidangText: "",
        foto: "",
        jenjang: {
          MAPABA: "",
          PKD: "",
          PKL: "",
          SIG: "",
          SKP: "",
          SKK: "",
        },
      });
    } catch (error) {
      console.error("Gagal mengirim data alumni:", error);
      alert("Maaf, terjadi kesalahan saat mengirim data. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchAlumni() {
      try {
        const docRef = doc(db, "website_config", "database_alumni");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAlumni) {
          const rawList = docSnap.data().listAlumni;
          const seenIds = new Set();

          // Hanya tampilkan alumni yang sudah di-ACC (atau data lama tanpa field status)
          const approvedRawList = rawList.filter(
            (item) => !item.status || item.status === "approved"
          );

          const normalized = approvedRawList.map((item, idx) => {
            const rawId = item.id ? String(item.id) : `alm-${idx}`;
            const uniqueId = seenIds.has(rawId) ? `${rawId}-${idx}` : rawId;
            seenIds.add(uniqueId);

            const tahunMapaba =
              item.tahunMapaba || item.angkatan || item.jenjang?.MAPABA || "";
            const asalRayon = item.asalRayon || item.rayon || "";
            const profesiList = getSafeArray(item.profesi);
            const bidangList = getSafeArray(item.bidang);
            const jenjangMap = normalizeJenjang(item.jenjang, tahunMapaba);

            return {
              ...item,
              id: uniqueId,
              tahunMapaba: String(tahunMapaba).trim(),
              asalRayon: String(asalRayon).trim(),
              profesiList,
              bidangList,
              jenjangMap,
            };
          });

          setAlumniData(normalized);

          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const namaParam = params.get("nama");
            if (namaParam) {
              const decoded = decodeURIComponent(namaParam).toLowerCase().trim();
              const found = normalized.find(
                (a) => (a.nama || "").toLowerCase().trim() === decoded
              );
              if (found) setSelectedAlumniId(found.id);
            }
          }
        }
      } catch (error) {
        console.error("Gagal menarik data alumni:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAlumni();
  }, []);

  // Filter options
  const listRayon = useMemo(() => {
    return [
      "Semua",
      ...new Set(alumniData.map((a) => a.asalRayon).filter(Boolean)),
    ];
  }, [alumniData]);

  const listTahun = useMemo(() => {
    return [
      "Semua",
      ...new Set(alumniData.map((a) => a.tahunMapaba).filter(Boolean)),
    ].sort((a, b) => (a === "Semua" ? -1 : b === "Semua" ? 1 : b.localeCompare(a)));
  }, [alumniData]);

  // Telemetry counts
  const jenjangCounts = useMemo(() => {
    const counts = { MAPABA: 0, PKD: 0, PKL: 0, SIG: 0, SKP: 0, SKK: 0 };
    alumniData.forEach((a) => {
      JENJANG_KEYS.forEach((k) => {
        if (a.jenjangMap && a.jenjangMap[k]) counts[k]++;
      });
    });
    return counts;
  }, [alumniData]);

  const uniqueProfesiCount = useMemo(() => {
    const set = new Set();
    alumniData.forEach((a) => {
      (a.profesiList || []).forEach((p) => set.add(p.toLowerCase()));
    });
    return set.size;
  }, [alumniData]);

  const filteredData = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();

    return alumniData.filter((item) => {
      const profesiString = (item.profesiList || []).join(" ");
      const bidangString = (item.bidangList || []).join(" ");
      const deskripsiString =
        typeof item.deskripsiProfesi === "object" &&
        item.deskripsiProfesi !== null
          ? Object.values(item.deskripsiProfesi).join(" ")
          : typeof item.deskripsiProfesi === "string"
          ? item.deskripsiProfesi
          : "";

      const matchSearch =
        !searchLower ||
        (item.nama || "").toLowerCase().includes(searchLower) ||
        profesiString.toLowerCase().includes(searchLower) ||
        bidangString.toLowerCase().includes(searchLower) ||
        deskripsiString.toLowerCase().includes(searchLower) ||
        (item.asalRayon || "").toLowerCase().includes(searchLower) ||
        (item.nim && String(item.nim).toLowerCase().includes(searchLower)) ||
        (item.nia && String(item.nia).toLowerCase().includes(searchLower));

      const matchRayon =
        selectedRayon === "Semua" || item.asalRayon === selectedRayon;

      const matchTahun =
        selectedTahun === "Semua" || item.tahunMapaba === selectedTahun;

      const matchJenjang =
        selectedJenjang === "Semua" ||
        Boolean(item.jenjangMap && item.jenjangMap[selectedJenjang]);

      return matchSearch && matchRayon && matchTahun && matchJenjang;
    });
  }, [alumniData, searchQuery, selectedRayon, selectedTahun, selectedJenjang]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));

  const currentAlumniData = useMemo(() => {
    return filteredData.slice(
      (safeCurrentPage - 1) * ITEMS_PER_PAGE,
      safeCurrentPage * ITEMS_PER_PAGE
    );
  }, [filteredData, safeCurrentPage]);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= safeCurrentPage - 1 && i <= safeCurrentPage + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  // Active Alumni for Modal
  const selectedAlumniIndex = useMemo(() => {
    if (!selectedAlumniId) return -1;
    return filteredData.findIndex((a) => a.id === selectedAlumniId);
  }, [filteredData, selectedAlumniId]);

  const selectedAlumni = useMemo(() => {
    if (!selectedAlumniId) return null;
    return alumniData.find((a) => a.id === selectedAlumniId) || null;
  }, [alumniData, selectedAlumniId]);

  const handleOpenModal = (alumni) => {
    setSelectedAlumniId(alumni.id);
    if (typeof window !== "undefined") {
      window.history.pushState(
        null,
        "",
        `?nama=${encodeURIComponent(alumni.nama)}`
      );
    }
  };

  const handleCloseModal = () => {
    setSelectedAlumniId(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/alumni`);
    }
  };

  const handlePrevNextModal = (direction) => {
    if (filteredData.length === 0) return;
    let nextIdx = selectedAlumniIndex + direction;
    if (nextIdx < 0) nextIdx = filteredData.length - 1;
    if (nextIdx >= filteredData.length) nextIdx = 0;
    const target = filteredData[nextIdx];
    if (target) handleOpenModal(target);
  };

  const handleShare = async (targetAlumni = selectedAlumni) => {
    if (!targetAlumni || typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/alumni?nama=${encodeURIComponent(
      targetAlumni.nama
    )}`;
    const shareData = {
      title: `Profil Alumni: ${targetAlumni.nama}`,
      text: `Lihat profil profesional & rekam jejak kaderisasi alumni PMII ${targetAlumni.nama} di Direktori Alumni PK. PMII Sunan Ampel Malang.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User dibatalkan
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleCopyCode = (value, label) => {
    if (!value || value === "-") return;
    navigator.clipboard.writeText(String(value));
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] font-sans text-slate-900 dark:text-slate-100 flex flex-col relative pb-16 xl:pb-0">
      <Navbar />

      {/* ARCHITECTURAL HERO HEADER */}
      <section className="relative pt-28 md:pt-32 pb-14 md:pb-20 px-4 sm:px-6 lg:px-8 bg-[#020617] text-white border-b border-slate-800/80 overflow-hidden">
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
                <GraduationCap size={14} />
                Jejaring Profesional & Korps Alumni
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
                Direktori & Jejaring{" "}
                <span className="text-amber-400">Alumni PMII</span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Pangkalan data lintas-angkatan yang memetakan distribusi profesi,
                bidang keahlian, asal rayon, serta rekam jejak kaderisasi alumni
                PK. PMII Sunan Ampel Malang.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitSuccess(false);
                    setIsSubmitModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>+ Daftarkan Data Alumni Mandiri</span>
                </button>
                <span className="text-[11px] font-mono text-slate-400">
                  Belum terdaftar di direktori? Masukkan profil Anda di sini.
                </span>
              </div>
            </div>

            {/* Live Telemetry Strip */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Total Alumni
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {alumniData.length}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Bidang Profesi
                </p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                  {uniqueProfesiCount}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Asal Rayon
                </p>
                <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-0.5">
                  {Math.max(0, listRayon.length - 1)}
                </p>
              </div>
            </div>
          </div>

          {/* Jenjang Kaderisasi Quick Filter Strip */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Award size={13} className="text-amber-400" /> Filter Cepat Riwayat
                Jenjang Kaderisasi Alumni
              </span>
              {selectedJenjang !== "Semua" && (
                <button
                  onClick={() => {
                    setSelectedJenjang("Semua");
                    setCurrentPage(1);
                  }}
                  className="text-[11px] font-mono text-amber-400 hover:underline"
                >
                  Reset ({selectedJenjang}) ✕
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {JENJANG_KEYS.map((key) => {
                const isSelected = selectedJenjang === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedJenjang(isSelected ? "Semua" : key);
                      setCurrentPage(1);
                    }}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/20"
                        : "bg-slate-900/80 hover:bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isSelected ? "text-amber-300" : "text-slate-400"
                        }`}
                      >
                        {key}
                      </span>
                      <Award
                        size={12}
                        className={isSelected ? "text-amber-300" : "text-slate-500"}
                      />
                    </div>
                    <p className="text-lg sm:text-xl font-black mt-0.5 leading-none">
                      {jenjangCounts[key] || 0}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* STICKY SEARCH & MULTI-FILTER CONSOLE */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-6 relative z-20">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama alumni, profesi, instansi, bidang keahlian, atau rayon..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown Filters + View Mode */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial min-w-[145px]">
                <Filter
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <select
                  value={selectedRayon}
                  onChange={(e) => {
                    setSelectedRayon(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 truncate"
                >
                  {listRayon.map((r, i) => (
                    <option key={i} value={r}>
                      {r === "Semua" ? "Semua Rayon" : r}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={selectedTahun}
                onChange={(e) => {
                  setSelectedTahun(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {listTahun.map((t, i) => (
                  <option key={i} value={t}>
                    {t === "Semua" ? "Semua Angkatan" : `Mapaba ${t}`}
                  </option>
                ))}
              </select>

              <select
                value={selectedJenjang}
                onChange={(e) => {
                  setSelectedJenjang(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Semua">Semua Jenjang</option>
                {JENJANG_KEYS.map((k) => (
                  <option key={k} value={k}>
                    Lulus {k}
                  </option>
                ))}
              </select>

              {/* View Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Tampilan Kartu"
                >
                  <LayoutGrid size={14} />
                  <span className="hidden sm:inline">Kartu</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Tampilan Tabel Matriks"
                >
                  <Table2 size={14} />
                  <span className="hidden sm:inline">Matriks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter summary bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Menampilkan{" "}
              <strong className="text-slate-900 dark:text-white">
                {filteredData.length}
              </strong>{" "}
              alumni terdaftar
            </span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-amber-400">
              Klik kartu alumni untuk membuka Dossier Profesi & Riwayat Kaderisasi →
            </span>
          </div>
        </div>
      </section>

      {/* DIRECTORY CONTENT */}
      <section className="py-8 md:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow flex flex-col">
        {loading ? (
          <GridSkeleton />
        ) : filteredData.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Data Alumni Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Coba ubah kata kunci pencarian profesi/keahlian atau atur ulang filter di atas.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedRayon("Semua");
                setSelectedTahun("Semua");
                setSelectedJenjang("Semua");
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {currentAlumniData.map((alumni, idx) => {
                  const highest = getHighestJenjang(alumni.jenjangMap || {});
                  const activeJenjangKeys = JENJANG_KEYS.filter(
                    (k) => alumni.jenjangMap && alumni.jenjangMap[k]
                  );
                  const primaryProfesi = alumni.profesiList?.[0] || null;
                  const primaryDesc =
                    primaryProfesi &&
                    typeof alumni.deskripsiProfesi === "object" &&
                    alumni.deskripsiProfesi !== null
                      ? alumni.deskripsiProfesi[primaryProfesi]
                      : null;

                  return (
                    <motion.div
                      key={`${alumni.id || "alm"}-${idx}`}
                      onClick={() => handleOpenModal(alumni)}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25 }}
                      className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-xl hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 opacity-75 group-hover:opacity-100 transition-opacity" />

                      <div>
                        {/* Top Meta Strip */}
                        <div className="flex items-center justify-between gap-2 mb-3.5 pt-1">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[65%]">
                            {alumni.asalRayon
                              ? alumni.asalRayon.replace(/^PR\.\s*PMII\s*/i, "")
                              : "Komisariat"}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 shrink-0">
                            Akt. {alumni.tahunMapaba || "-"}
                          </span>
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex items-start gap-3.5 mb-4">
                          <AlumniAvatar
                            foto={alumni.foto}
                            nama={alumni.nama}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2 text-base">
                              {alumni.nama}
                            </h3>
                            {primaryProfesi ? (
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 truncate">
                                <Briefcase size={12} className="shrink-0" />
                                <span className="truncate">{primaryProfesi}</span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic mt-1">
                                Korps Alumni PMII
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Profesi / Instansi Box */}
                        {alumni.profesiList && alumni.profesiList.length > 0 && (
                          <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                            <div className="flex flex-wrap gap-1">
                              {alumni.profesiList.slice(0, 2).map((p, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/80 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                >
                                  <Briefcase size={10} /> {p}
                                </span>
                              ))}
                              {alumni.profesiList.length > 2 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  +{alumni.profesiList.length - 2}
                                </span>
                              )}
                            </div>
                            {primaryDesc && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-1.5 font-medium">
                                {primaryDesc}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Bidang Keahlian Tags */}
                        {alumni.bidangList && alumni.bidangList.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                              Keahlian
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {alumni.bidangList.slice(0, 3).map((b, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/60"
                                >
                                  <Sparkles size={9} /> {b}
                                </span>
                              ))}
                              {alumni.bidangList.length > 3 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  +{alumni.bidangList.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Jenjang Kaderisasi Chips */}
                        {activeJenjangKeys.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                              Jenjang Kaderisasi
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {activeJenjangKeys.map((k) => (
                                <span
                                  key={k}
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${JENJANG_META[k].soft}`}
                                >
                                  {k} &apos;{String(alumni.jenjangMap[k]).slice(-2)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span>
                          {highest ? `${highest.label} (${highest.year})` : "Profil Alumni"}
                        </span>
                        <span className="font-sans font-bold text-blue-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                          Lihat Dossier →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* MATRIX TABLE VIEW */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-3.5 px-4">Nama Alumni</th>
                        <th className="py-3.5 px-4">Asal Rayon & Mapaba</th>
                        <th className="py-3.5 px-4">Profesi & Karir</th>
                        <th className="py-3.5 px-4">Bidang Keahlian</th>
                        <th className="py-3.5 px-4">Jenjang Kaderisasi</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                      {currentAlumniData.map((alumni, idx) => (
                        <tr
                          key={`${alumni.id || "alm-row"}-${idx}`}
                          onClick={() => handleOpenModal(alumni)}
                          className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <AlumniAvatar
                                foto={alumni.foto}
                                nama={alumni.nama}
                                size="sm"
                              />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {alumni.nama}
                                </p>
                                {alumni.nia && (
                                  <p className="text-[11px] font-mono text-slate-400">
                                    NIA: {alumni.nia}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                              {alumni.asalRayon || "-"}
                            </p>
                            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                              Mapaba {alumni.tahunMapaba || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {alumni.profesiList && alumni.profesiList.length > 0 ? (
                                alumni.profesiList.map((p, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                  >
                                    {p}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {alumni.bidangList && alumni.bidangList.length > 0 ? (
                                alumni.bidangList.slice(0, 3).map((b, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/70 dark:border-violet-800"
                                  >
                                    {b}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {JENJANG_KEYS.filter(
                                (k) => alumni.jenjangMap && alumni.jenjangMap[k]
                              ).map((k) => (
                                <span
                                  key={k}
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${JENJANG_META[k].soft}`}
                                >
                                  {k} ({alumni.jenjangMap[k]})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-xs text-blue-600 dark:text-amber-400 whitespace-nowrap">
                            Buka →
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10 w-full">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition bg-white dark:bg-slate-900"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="hidden sm:flex items-center gap-1.5">
                  {getPageNumbers().map((pageNum, idx) => (
                    <button
                      key={idx}
                      onClick={() => pageNum !== "..." && setCurrentPage(pageNum)}
                      disabled={pageNum === "..."}
                      className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition ${
                        pageNum === safeCurrentPage
                          ? "bg-blue-600 text-white shadow-sm"
                          : pageNum === "..."
                          ? "text-slate-400 cursor-default"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <div className="sm:hidden px-4 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  Hal <span className="text-blue-600 dark:text-amber-400">{safeCurrentPage}</span> /{" "}
                  {totalPages}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition bg-white dark:bg-slate-900"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* MODAL DOSSIER ALUMNI */}
      <AnimatePresence>
        {selectedAlumni && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                    Dossier Korps Alumni // PK. PMII Sunan Ampel
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleShare(selectedAlumni)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition mr-1"
                    title="Bagikan Profil Alumni"
                  >
                    {copiedShare ? <Check size={14} /> : <Share2 size={14} />}
                    <span className="hidden sm:inline">
                      {copiedShare ? "Tersalin" : "Bagikan"}
                    </span>
                  </button>
                  {filteredData.length > 1 && (
                    <>
                      <button
                        onClick={() => handlePrevNextModal(-1)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        title="Alumni Sebelumnya"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => handlePrevNextModal(1)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        title="Alumni Selanjutnya"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleCloseModal}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition ml-1"
                    title="Tutup"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Identity Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <AlumniAvatar
                    foto={selectedAlumni.foto}
                    nama={selectedAlumni.nama}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-600 text-white">
                        {selectedAlumni.asalRayon || "PK. PMII Sunan Ampel"}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">
                        Mapaba {selectedAlumni.tahunMapaba || "-"}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                      {selectedAlumni.nama}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-blue-500 shrink-0" />
                      Jaringan Korps Alumni PMII Sunan Ampel Malang
                    </p>
                  </div>
                </div>

                {/* Metadata Grid (Asal Rayon, Tahun Mapaba, + NIM/NIA if transferred from Anggota) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Asal Pangkalan Rayon
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {selectedAlumni.asalRayon || "Belum dicantumkan"}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Tahun Angkatan / Mapaba
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {selectedAlumni.tahunMapaba || "Tidak diketahui"}
                      </p>
                    </div>
                  </div>

                  {(selectedAlumni.nim || selectedAlumni.nia) && (
                    <>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Hash size={15} className="text-slate-400" />
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                              NIM Semasa Kuliah
                            </p>
                            <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                              {selectedAlumni.nim || "-"}
                            </p>
                          </div>
                        </div>
                        {selectedAlumni.nim && selectedAlumni.nim !== "-" && (
                          <button
                            onClick={() => handleCopyCode(selectedAlumni.nim, "NIM")}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600"
                          >
                            {copiedCode === "NIM" ? (
                              <Check size={13} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Hash size={15} className="text-slate-400" />
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                              Nomor Induk Anggota (NIA)
                            </p>
                            <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                              {selectedAlumni.nia || "-"}
                            </p>
                          </div>
                        </div>
                        {selectedAlumni.nia && selectedAlumni.nia !== "-" && (
                          <button
                            onClick={() => handleCopyCode(selectedAlumni.nia, "NIA")}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600"
                          >
                            {copiedCode === "NIA" ? (
                              <Check size={13} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Profesi & Karir Saat Ini */}
                <div>
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Briefcase size={13} className="text-blue-500" /> Profesi &
                    Kiprah Profesional Saat Ini
                  </h4>
                  {selectedAlumni.profesiList &&
                  selectedAlumni.profesiList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedAlumni.profesiList.map((p, idx) => {
                        const descText =
                          typeof selectedAlumni.deskripsiProfesi === "object" &&
                          selectedAlumni.deskripsiProfesi !== null
                            ? selectedAlumni.deskripsiProfesi[p]
                            : null;
                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-200/70 dark:border-slate-700"
                          >
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold">
                              <Building2 size={12} /> {p}
                            </div>
                            {descText && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed flex items-start gap-1.5">
                                <FileText
                                  size={13}
                                  className="text-slate-400 shrink-0 mt-0.5"
                                />
                                <span>{descText}</span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      Informasi profesi/instansi belum ditambahkan.
                    </p>
                  )}
                </div>

                {/* Bidang Keahlian */}
                <div>
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-violet-500" /> Bidang
                    Keahlian & Kompetensi
                  </h4>
                  {selectedAlumni.bidangList &&
                  selectedAlumni.bidangList.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedAlumni.bidangList.map((b, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/70 text-xs font-bold"
                        >
                          <Star size={12} className="text-violet-500" /> {b}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      Data bidang keahlian belum ditambahkan.
                    </p>
                  )}
                </div>

                {/* Rekam Jejak Jenjang Kaderisasi */}
                <div>
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Award size={13} className="text-amber-500" /> Rekam Jejak
                    Kaderisasi PMII & Tahun Lulus
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {JENJANG_KEYS.map((key) => {
                      const year = selectedAlumni.jenjangMap?.[key];
                      const meta = JENJANG_META[key];
                      const passed = Boolean(year);
                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border transition-all ${
                            passed
                              ? `${meta.soft} shadow-sm`
                              : "bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 text-slate-400 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black tracking-wider font-mono">
                              {key}
                            </span>
                            {passed ? (
                              <CheckCircle2 size={14} className="shrink-0" />
                            ) : (
                              <span className="text-[10px] font-mono">—</span>
                            )}
                          </div>
                          <p className="text-[10px] leading-tight line-clamp-1 opacity-80">
                            {meta.full}
                          </p>
                          <p className="text-xs font-mono font-bold mt-2 pt-1.5 border-t border-current/10">
                            {passed ? `Tahun ${year}` : "Belum Tercatat"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL INPUT DATA ALUMNI MANDIRI (MENUNGGU ACC ADMIN) */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSubmitModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                    Registrasi Mandiri Korps Alumni // PK. PMII Sunan Ampel
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition"
                  title="Tutup"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                {submitSuccess ? (
                  <div className="py-8 px-4 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={28} />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                        <Clock size={12} /> Menunggu Verifikasi (ACC) Admin
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                        Data Alumni Berhasil Dikirim!
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
                        Terima kasih Sahabat/i! Data profil, profesi, dan riwayat
                        kaderisasi Anda telah masuk ke antrean verifikasi Admin
                        Komisariat dan akan segera tayang di Direktori Alumni
                        setelah di-ACC.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSubmitSuccess(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                      >
                        Input Data Alumni Lainnya
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                      >
                        Selesai & Tutup
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSelfSubmitAlumni} className="space-y-5">
                    <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-slate-800/70 border border-blue-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Silakan lengkapi data diri, kiprah profesi/instansi saat
                      ini, serta riwayat kaderisasi Anda. Data yang dikirim akan
                      diverifikasi terlebih dahulu oleh Pengurus Komisariat
                      sebelum tampil di publik.
                    </div>

                    {/* Bagian 1: Identitas & Asal Rayon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Nama Lengkap & Gelar *
                        </label>
                        <input
                          type="text"
                          required
                          value={selfForm.nama}
                          onChange={(e) =>
                            setSelfForm({ ...selfForm, nama: e.target.value })
                          }
                          placeholder="Contoh: Dr. H. Ahmad Fauzi, M.HI."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Asal Pangkalan Rayon *
                        </label>
                        <select
                          value={selfForm.asalRayon}
                          onChange={(e) =>
                            setSelfForm({
                              ...selfForm,
                              asalRayon: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                          {RAYON_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Tahun Angkatan / Mapaba *
                        </label>
                        <input
                          type="text"
                          required
                          value={selfForm.tahunMapaba}
                          onChange={(e) =>
                            setSelfForm({
                              ...selfForm,
                              tahunMapaba: e.target.value,
                              jenjang: {
                                ...selfForm.jenjang,
                                MAPABA:
                                  selfForm.jenjang.MAPABA || e.target.value,
                              },
                            })
                          }
                          placeholder="Contoh: 2018"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          NIM Semasa Kuliah (Opsional)
                        </label>
                        <input
                          type="text"
                          value={selfForm.nim}
                          onChange={(e) =>
                            setSelfForm({ ...selfForm, nim: e.target.value })
                          }
                          placeholder="Contoh: 180101..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Nomor Induk Anggota / NIA (Opsional)
                        </label>
                        <input
                          type="text"
                          value={selfForm.nia}
                          onChange={(e) =>
                            setSelfForm({ ...selfForm, nia: e.target.value })
                          }
                          placeholder="Contoh: 04.05..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Bagian 2: Profesi, Instansi & Bidang Keahlian */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
                      <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-amber-400">
                        Kiprah Profesional & Keahlian Saat Ini
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            Profesi / Pekerjaan Utama
                          </label>
                          <input
                            type="text"
                            value={selfForm.profesiUtama}
                            onChange={(e) =>
                              setSelfForm({
                                ...selfForm,
                                profesiUtama: e.target.value,
                              })
                            }
                            placeholder="Contoh: Dosen / Advokat / Wirausaha"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            Nama Instansi / Tempat Berkarya
                          </label>
                          <input
                            type="text"
                            value={selfForm.instansiUtama}
                            onChange={(e) =>
                              setSelfForm({
                                ...selfForm,
                                instansiUtama: e.target.value,
                              })
                            }
                            placeholder="Contoh: UIN Maulana Malik Ibrahim Malang"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            Profesi Lainnya (Opsional, pisahkan koma)
                          </label>
                          <input
                            type="text"
                            value={selfForm.profesiTambahan}
                            onChange={(e) =>
                              setSelfForm({
                                ...selfForm,
                                profesiTambahan: e.target.value,
                              })
                            }
                            placeholder="Contoh: Peneliti, Konsultan"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            Bidang Keahlian (Pisahkan dengan koma)
                          </label>
                          <input
                            type="text"
                            value={selfForm.bidangText}
                            onChange={(e) =>
                              setSelfForm({
                                ...selfForm,
                                bidangText: e.target.value,
                              })
                            }
                            placeholder="Contoh: Hukum Tata Negara, Kebijakan Publik"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bagian 3: Riwayat Jenjang Kaderisasi */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-amber-400">
                        Riwayat Jenjang Kaderisasi (Isi Tahun Lulus)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {JENJANG_KEYS.map((jKey) => (
                          <div
                            key={jKey}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                          >
                            <span className="text-[10px] font-mono font-black text-slate-700 dark:text-slate-200 block mb-1">
                              {jKey}
                            </span>
                            <input
                              type="text"
                              value={selfForm.jenjang[jKey]}
                              onChange={(e) =>
                                setSelfForm({
                                  ...selfForm,
                                  jenjang: {
                                    ...selfForm.jenjang,
                                    [jKey]: e.target.value,
                                  },
                                })
                              }
                              placeholder="Thn (2019)"
                              className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bagian 4: Upload Foto Profil */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        Foto Profil Alumni (Opsional)
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold cursor-pointer transition shrink-0">
                          {uploadingFoto ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Upload size={15} />
                          )}
                          <span>
                            {uploadingFoto
                              ? "Mengunggah Foto..."
                              : "Upload Foto Profil"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadSelfFoto}
                            className="hidden"
                            disabled={uploadingFoto}
                          />
                        </label>
                        <input
                          type="text"
                          value={selfForm.foto}
                          onChange={(e) =>
                            setSelfForm({ ...selfForm, foto: e.target.value })
                          }
                          placeholder="Atau tempel URL foto profil..."
                          className="w-full flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Submit Footer */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || uploadingFoto}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={15} />
                        )}
                        <span>Kirim Data Alumni</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
