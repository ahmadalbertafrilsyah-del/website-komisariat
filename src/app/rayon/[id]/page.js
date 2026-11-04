"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  MapPin,
  Users,
  BookOpen,
  ArrowLeft,
  Shield,
  ExternalLink,
  Hash,
  Compass,
  MessageCircle,
  Star,
  Target,
  FileText,
  Wallet,
  Map,
  Search,
  X,
  Award,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const JENJANG_KEYS = ["MAPABA", "PKD", "PKL", "SIG", "SKP", "SKK"];

const JENJANG_META = {
  MAPABA: {
    label: "MAPABA",
    full: "Masa Penerimaan Anggota Baru",
    badge: "bg-blue-600 text-white border-blue-600",
    soft: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  PKD: {
    label: "PKD",
    full: "Pelatihan Kader Dasar",
    badge: "bg-indigo-600 text-white border-indigo-600",
    soft: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  PKL: {
    label: "PKL",
    full: "Pelatihan Kader Lanjut",
    badge: "bg-violet-600 text-white border-violet-600",
    soft: "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  },
  SIG: {
    label: "SIG",
    full: "Sekolah Islam & Gender",
    badge: "bg-amber-500 text-slate-950 border-amber-500",
    soft: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  SKP: {
    label: "SKP",
    full: "Sekolah Kader Putri",
    badge: "bg-rose-600 text-white border-rose-600",
    soft: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
  SKK: {
    label: "SKK",
    full: "Sekolah Kader Komisariat / Keprofesian",
    badge: "bg-emerald-600 text-white border-emerald-600",
    soft: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
};

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PM";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function normalizeBidang(bidang) {
  if (!bidang) return [];
  if (Array.isArray(bidang)) return bidang.map((b) => String(b).trim()).filter(Boolean);
  if (typeof bidang === "string") {
    return bidang
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeJenjang(jenjang, fallbackAngkatan) {
  const result = {};
  if (jenjang && typeof jenjang === "object") {
    JENJANG_KEYS.forEach((key) => {
      if (jenjang[key] && String(jenjang[key]).trim() !== "") {
        result[key] = String(jenjang[key]).trim();
      }
    });
  }
  if (Object.keys(result).length === 0 && fallbackAngkatan && fallbackAngkatan !== "-") {
    result.MAPABA = String(fallbackAngkatan).trim();
  }
  return result;
}

function getHighestJenjang(jenjangObj) {
  const order = ["PKL", "SKK", "SKP", "SIG", "PKD", "MAPABA"];
  for (const k of order) {
    if (jenjangObj[k]) return { key: k, year: jenjangObj[k], ...JENJANG_META[k] };
  }
  return null;
}

function SafeRayonLogo({ src, name, sizeClass = "w-16 h-16 md:w-20 md:h-20" }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className={`relative ${sizeClass} bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-xl overflow-hidden flex items-center justify-center shrink-0`}
    >
      {src && !imgError ? (
        <Image
          src={src}
          alt={name || "Logo Rayon"}
          fill
          className="object-contain p-2"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-black text-amber-400 text-lg tracking-wider">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function KaderAvatar({ foto, nama, size = "md" }) {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = {
    sm: "w-10 h-10 text-xs rounded-xl",
    md: "w-12 h-12 text-sm rounded-xl",
    lg: "w-20 h-20 text-xl rounded-2xl",
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
          alt={nama || "Kader"}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{getInitials(nama)}</span>
      )}
    </div>
  );
}

function PersonilCard({ jabatan, nama, wa, icon }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 p-4 rounded-xl flex items-center justify-between gap-3 hover:border-blue-500/40 transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
            {jabatan}
          </p>
          <p className="font-bold text-slate-900 dark:text-white text-sm truncate mt-0.5">
            {nama || "Belum diisi"}
          </p>
        </div>
      </div>
      {wa && (
        <a
          href={`https://wa.me/${wa.replace(/[^0-9]/g, "")}?text=Halo%20Sahabat/i%20${encodeURIComponent(
            nama || ""
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm"
          title={`Chat ${jabatan}`}
        >
          <MessageCircle size={14} />
          <span className="hidden sm:inline">Chat</span>
        </a>
      )}
    </div>
  );
}

export default function DetailRayonPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [rayonData, setRayonData] = useState(null);
  const [anggotaRayon, setAnggotaRayon] = useState([]);
  const [alumniCount, setAlumniCount] = useState(0);

  // Filter & Search States for Rayon Directory
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAngkatan, setSelectedAngkatan] = useState("Semua");
  const [selectedJenjang, setSelectedJenjang] = useState("Semua");

  // Selected Kader for Modal Dossier
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    async function fetchDetailRayon() {
      try {
        if (!params.id) return;
        const urlId = decodeURIComponent(params.id).toLowerCase().replace(/-/g, " ");

        const [docRayon, docAnggota, docAlumni] = await Promise.all([
          getDoc(doc(db, "website_config", "database_rayon")),
          getDoc(doc(db, "website_config", "database_anggota")),
          getDoc(doc(db, "website_config", "database_alumni")),
        ]);

        let foundRayon = null;

        if (docRayon.exists() && docRayon.data().listRayon) {
          const allRayon = docRayon.data().listRayon;
          foundRayon = allRayon.find(
            (r) =>
              r.nama.toLowerCase() === urlId ||
              r.nama.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                urlId.replace(/[^a-z0-9]/g, "")
          );
        }

        if (foundRayon) {
          setRayonData(foundRayon);
          const targetKey = foundRayon.nama.trim().toLowerCase();

          if (docAnggota.exists() && docAnggota.data().listAnggota) {
            const allAnggota = docAnggota.data().listAnggota;
            const seenIds = new Set();
            const filtered = allAnggota
              .filter((a) => a.rayon && a.rayon.trim().toLowerCase() === targetKey)
              .map((item, idx) => {
                const rawId = item.id ? String(item.id) : `rayon-kdr-${idx}`;
                const uniqueId = seenIds.has(rawId) ? `${rawId}-${idx}` : rawId;
                seenIds.add(uniqueId);
                return {
                  ...item,
                  id: uniqueId,
                  bidangList: normalizeBidang(item.bidang),
                  jenjangMap: normalizeJenjang(item.jenjang, item.angkatan),
                };
              });
            setAnggotaRayon(filtered);
          }

          if (docAlumni.exists() && docAlumni.data().listAlumni) {
            const allAlumni = docAlumni.data().listAlumni;
            const count = allAlumni.filter(
              (al) =>
                (al.asalRayon || al.rayon || "").trim().toLowerCase() ===
                targetKey
            ).length;
            setAlumniCount(count);
          }
        } else {
          setRayonData("NOT_FOUND");
        }
      } catch (error) {
        console.error("Gagal memuat detail rayon:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetailRayon();
  }, [params.id]);

  // Unique angkatan list in this rayon
  const listAngkatan = useMemo(() => {
    return [
      "Semua",
      ...new Set(anggotaRayon.map((item) => item.angkatan).filter(Boolean)),
    ].sort((a, b) => (a === "Semua" ? -1 : b === "Semua" ? 1 : b.localeCompare(a)));
  }, [anggotaRayon]);

  // Jenjang telemetry counts in this rayon
  const jenjangCounts = useMemo(() => {
    const counts = { MAPABA: 0, PKD: 0, PKL: 0, SIG: 0, SKP: 0, SKK: 0 };
    anggotaRayon.forEach((a) => {
      JENJANG_KEYS.forEach((k) => {
        if (a.jenjangMap && a.jenjangMap[k]) counts[k]++;
      });
    });
    return counts;
  }, [anggotaRayon]);

  // Filtered kader list
  const filteredAnggota = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return anggotaRayon.filter((kader) => {
      const matchSearch =
        !q ||
        (kader.nama && kader.nama.toLowerCase().includes(q)) ||
        (kader.nim && String(kader.nim).toLowerCase().includes(q)) ||
        (kader.nia && String(kader.nia).toLowerCase().includes(q)) ||
        (kader.bidangList &&
          kader.bidangList.some((b) => b.toLowerCase().includes(q)));

      const matchAngkatan =
        selectedAngkatan === "Semua" || kader.angkatan === selectedAngkatan;

      const matchJenjang =
        selectedJenjang === "Semua" ||
        Boolean(kader.jenjangMap && kader.jenjangMap[selectedJenjang]);

      return matchSearch && matchAngkatan && matchJenjang;
    });
  }, [anggotaRayon, searchTerm, selectedAngkatan, selectedJenjang]);

  const activeKader =
    selectedIndex !== null && filteredAnggota[selectedIndex]
      ? filteredAnggota[selectedIndex]
      : null;

  const handleCopy = (text, label) => {
    if (!text || text === "-") return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  if (loading) return <LoadingScreen text="Memuat Dossier Rayon..." />;

  if (rayonData === "NOT_FOUND") {
    return (
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col items-center justify-center p-5 pb-16 xl:pb-0">
        <Navbar />
        <div className="text-center mt-20 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <Compass className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            Rayon Tidak Ditemukan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Pastikan tautan rayon yang Anda buka sudah sesuai dengan daftar di database komisariat.
          </p>
          <button
            onClick={() => router.push("/rayon")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={15} /> Kembali ke Daftar Rayon
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] font-sans text-slate-900 dark:text-slate-100 w-full overflow-x-hidden flex flex-col pb-16 xl:pb-0">
      <Navbar />

      {/* ARCHITECTURAL HERO HEADER */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 bg-[#020617] text-white border-b border-slate-800/80 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Top Navigation Bar */}
          <div className="mb-8 flex justify-between items-center gap-4">
            <button
              onClick={() => router.push("/rayon")}
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-4 py-2 rounded-xl text-xs font-bold shrink-0"
            >
              <ArrowLeft size={14} /> Semua Rayon
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-950/80 border border-blue-800/70 text-amber-400 text-[11px] font-mono uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Pangkalan Rayon
            </div>
          </div>

          {/* Main Rayon Title & Logo */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-3xl">
              <SafeRayonLogo src={rayonData?.logoUrl} name={rayonData?.nama} />

              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-blue-300 bg-blue-500/15 border border-blue-400/30 px-3 py-1 rounded-md mb-2.5 inline-flex items-center gap-1.5">
                  <BookOpen size={13} className="text-amber-400 shrink-0" />
                  <span>{rayonData?.fakultas || "Fakultas"}</span>
                </span>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
                  {rayonData?.nama}
                </h1>

                <p className="text-slate-300 text-xs sm:text-sm md:text-base mt-3 leading-relaxed border-l-2 border-amber-400 pl-3.5 italic">
                  &ldquo;
                  {rayonData?.deskripsi ||
                    "Berproses bersama mengawal pergerakan di tingkat fakultas dengan nilai-nilai Ahlussunnah Wal Jama'ah."}
                  &rdquo;
                </p>
              </div>
            </div>

            {/* Live Telemetry Box */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Kader Aktif
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {anggotaRayon.length}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Alumni Rayon
                </p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                  {alumniCount}
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Angkatan
                </p>
                <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-0.5">
                  {Math.max(0, listAngkatan.length - 1)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEKRETARIAT & PENGURUS INTI RAYON */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-8 relative z-20 mb-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-7 shadow-lg border border-slate-200/90 dark:border-slate-800">
          {/* Top Row: Basecamp + External Links */}
          <div className="flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center pb-6 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-start gap-3.5 flex-1">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Basecamp / Sekretariat Rayon
                </p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm mt-0.5 leading-relaxed">
                  {rayonData?.alamat || "Alamat sekretariat belum ditambahkan"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
              {rayonData?.igUrl && (
                <a
                  href={rayonData.igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs flex-1 sm:flex-initial"
                >
                  Instagram / Web <ExternalLink size={14} />
                </a>
              )}
              {rayonData?.mapUrl && (
                <a
                  href={rayonData.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs flex-1 sm:flex-initial"
                >
                  Titik Google Maps <Map size={14} />
                </a>
              )}
            </div>
          </div>

          {/* Bottom Row: BPH Inti Rayon */}
          <div className="pt-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2 uppercase tracking-wider">
                <Star size={17} className="text-amber-500" /> Pengurus Inti Rayon (BPH)
              </h2>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Klik tombol Chat untuk terhubung via WhatsApp
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <PersonilCard
                jabatan="Ketua Rayon"
                nama={rayonData?.ketua}
                wa={rayonData?.waKetua}
                icon={<Shield size={18} />}
              />
              <PersonilCard
                jabatan="Sekretaris Rayon"
                nama={rayonData?.sekretaris}
                wa={rayonData?.waSekret}
                icon={<FileText size={18} />}
              />
              <PersonilCard
                jabatan="Bendahara Rayon"
                nama={rayonData?.bendahara}
                wa={rayonData?.waBendum}
                icon={<Wallet size={18} />}
              />
              <PersonilCard
                jabatan="CO Kaderisasi"
                nama={rayonData?.coKaderisasi}
                wa={rayonData?.waKaderisasi}
                icon={<Target size={18} />}
              />
              <PersonilCard
                jabatan="CO Gerakan"
                nama={rayonData?.coGerakan}
                wa={rayonData?.waGerakan}
                icon={<Compass size={18} />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* DIREKTORI KADER RAYON + JENJANG TELEMETRY */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20 max-w-7xl mx-auto w-full flex-grow">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold mb-1">
              <Users size={14} /> Database Anggota Rayon
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Direktori & Riwayat Kaderisasi
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredAnggota.length}
            </span>{" "}
            dari {anggotaRayon.length} kader rayon • Klik kartu untuk melihat Dossier lengkap
          </p>
        </div>

        {/* Jenjang Quick Filter Bar */}
        {anggotaRayon.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
            {JENJANG_KEYS.map((key) => {
              const active = selectedJenjang === key;
              return (
                <button
                  key={key}
                  onClick={() =>
                    setSelectedJenjang(selectedJenjang === key ? "Semua" : key)
                  }
                  className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                    active
                      ? "bg-blue-600 text-white border-blue-500 shadow-md"
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        active ? "text-amber-300" : "text-slate-400"
                      }`}
                    >
                      {key}
                    </span>
                    <Award
                      size={12}
                      className={active ? "text-amber-300" : "text-slate-400"}
                    />
                  </div>
                  <p className="text-lg font-black mt-0.5 leading-none">
                    {jenjangCounts[key] || 0}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Search & Filter Controls */}
        {anggotaRayon.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Cari nama kader, NIM, NIA, atau bidang keahlian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <select
                value={selectedAngkatan}
                onChange={(e) => setSelectedAngkatan(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {listAngkatan.map((akt, idx) => (
                  <option key={idx} value={akt}>
                    {akt === "Semua" ? "Semua Angkatan" : `Angkatan ${akt}`}
                  </option>
                ))}
              </select>

              <select
                value={selectedJenjang}
                onChange={(e) => setSelectedJenjang(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Semua">Semua Jenjang</option>
                {JENJANG_KEYS.map((k) => (
                  <option key={k} value={k}>
                    Lulus {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Directory Cards */}
        {anggotaRayon.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              Belum Ada Kader Terdata
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Admin belum memasukkan nama-nama kader untuk rayon ini ke dalam sistem database pusat.
            </p>
          </div>
        ) : filteredAnggota.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-xl mx-auto">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              Tidak Ada Kader yang Cocok
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Coba ubah kata kunci pencarian atau reset filter angkatan/jenjang.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedAngkatan("Semua");
                setSelectedJenjang("Semua");
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAnggota.map((kader, index) => {
              const highest = getHighestJenjang(kader.jenjangMap || {});
              const activeJenjangKeys = JENJANG_KEYS.filter(
                (k) => kader.jenjangMap && kader.jenjangMap[k]
              );

              return (
                <motion.div
                  key={`${kader.id || "kdr"}-${index}`}
                  onClick={() => setSelectedIndex(index)}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25 }}
                  className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-xl hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 opacity-75 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Top Row */}
                    <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Akt. {kader.angkatan || "-"}
                      </span>
                      {highest && (
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${highest.soft}`}
                        >
                          {highest.label} • {highest.year}
                        </span>
                      )}
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex items-start gap-3.5 mb-3.5">
                      <KaderAvatar foto={kader.foto} nama={kader.nama} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2 text-sm sm:text-base">
                          {kader.nama}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">
                          NIM: {kader.nim || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Bidang Keahlian */}
                    {kader.bidangList && kader.bidangList.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {kader.bidangList.slice(0, 3).map((b, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60"
                            >
                              <Sparkles size={9} /> {b}
                            </span>
                          ))}
                          {kader.bidangList.length > 3 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              +{kader.bidangList.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Jenjang Badges */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {activeJenjangKeys.length > 0 ? (
                          activeJenjangKeys.map((k) => (
                            <span
                              key={k}
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${JENJANG_META[k].soft}`}
                            >
                              {k} &apos;{String(kader.jenjangMap[k]).slice(-2)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] italic text-slate-400">
                            Belum ada data tahun jenjang
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>NIA: {kader.nia || "-"}</span>
                    <span className="font-sans font-bold text-blue-600 dark:text-blue-400">
                      Detail →
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL DOSSIER KADER RAYON */}
      <AnimatePresence>
        {activeKader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                    Dossier Kader Rayon // #{selectedIndex + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredAnggota.length - 1
                      )
                    }
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    title="Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedIndex((prev) =>
                        prev < filteredAnggota.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    title="Selanjutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedIndex(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition ml-1"
                    title="Tutup"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <KaderAvatar foto={activeKader.foto} nama={activeKader.nama} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-600 text-white">
                        {rayonData?.nama}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">
                        Angkatan {activeKader.angkatan || "-"}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                      {activeKader.nama}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-blue-500 shrink-0" />
                      Kader Aktif PK. PMII Sunan Ampel Malang
                    </p>
                  </div>
                </div>

                {/* NIM & NIA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Nomor Induk Mahasiswa (NIM)
                      </p>
                      <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {activeKader.nim || "-"}
                      </p>
                    </div>
                    {activeKader.nim && activeKader.nim !== "-" && (
                      <button
                        onClick={() => handleCopy(activeKader.nim, "NIM")}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600"
                      >
                        {copiedField === "NIM" ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Nomor Induk Anggota (NIA)
                      </p>
                      <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {activeKader.nia || "-"}
                      </p>
                    </div>
                    {activeKader.nia && activeKader.nia !== "-" && (
                      <button
                        onClick={() => handleCopy(activeKader.nia, "NIA")}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600"
                      >
                        {copiedField === "NIA" ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Bidang Keahlian */}
                <div>
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" /> Bidang Keahlian & Minat
                  </h4>
                  {activeKader.bidangList && activeKader.bidangList.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeKader.bidangList.map((b, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70"
                        >
                          <Sparkles size={12} className="text-amber-500" /> {b}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      Bidang keahlian belum ditambahkan oleh admin.
                    </p>
                  )}
                </div>

                {/* Rekam Jejak Jenjang Kaderisasi */}
                <div>
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Award size={13} className="text-blue-500" /> Rekam Jejak Kaderisasi & Tahun Lulus
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {JENJANG_KEYS.map((key) => {
                      const year = activeKader.jenjangMap?.[key];
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

      <Footer />
    </main>
  );
}
