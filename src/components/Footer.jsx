// src/components/Footer.jsx
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowUpRight,
  ArrowUp,
  Clock,
  Lock,
  MapPin,
  Heart,
  BookOpen,
  FileSignature,
  Compass,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

const DEFAULT_CONFIG = {
  logoText: "PMII",
  komisariatName: "SUNAN AMPEL MALANG",
  tentangPmii:
    "PK. PMII Sunan Ampel Malang adalah wadah pergerakan mahasiswa Islam yang berkomitmen membangun intelektual muslim progresif, kritis, dan berakhlak mulia berlandaskan nilai-nilai Ahlussunnah Wal Jama'ah.",
  jamSeninJumat: "08:00 - 16:00 WIB",
  jamSabtuMinggu: "09:00 - 14:00 WIB",
  lokasi: "Jl. Gajayana No. 50\nKota Malang, Jawa Timur",
  footerText:
    "© 2026 PK. PMII Sunan Ampel Malang.",
};

export default function Footer() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    async function fetchGlobalConfig() {
      try {
        const docRef = doc(db, "website_config", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig((prev) => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Gagal memuat data footer:", error);
      }
    }
    fetchGlobalConfig();
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const directoryLinks = [
    { code: "01", label: "Beranda Utama", href: "/" },
    { code: "02", label: "Struktur Pengurus", href: "/struktur" },
    { code: "03", label: "Database Anggota", href: "/anggota" },
    { code: "04", label: "Daftar Basis Rayon", href: "/rayon" },
    { code: "05", label: "Direktori Alumni", href: "/alumni" },
    { code: "06", label: "Hall of Fame Apresiasi", href: "/apresiasi" },
  ];

  const serviceLinks = [
    { label: "Perpustakaan", href: "/bacaan" },
    { label: "Berita", href: "/berita" },
    { label: "Administrasi & SK", href: "/administrasi" },
    { label: "Pendaftaran", href: "/pendaftaran" },
    { label: "Donasi", href: "/donasi" },
  ];

  return (
    <footer className="relative bg-[#050a14] text-slate-300 border-t border-slate-800/90 overflow-hidden transition-colors duration-300 pb-24 xl:pb-10">
      {/* Subtle Architectural Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================= 1. TOP QUICK ACCESS BANNER ================= */}
        <div className="py-7 sm:py-8 border-b border-slate-800/90 grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          <Link
            href="/bacaan"
            className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-yellow-400/50 transition-all"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center shrink-0 group-hover:bg-yellow-400 group-hover:text-slate-950 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-400">
                    Perpustakaan
                  </span>
                </div>
                <p className="text-sm font-bold text-white truncate">
                  Bacaan & Modul Kader 3D
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </Link>

          <Link
            href="/administrasi"
            className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-400/50 transition-all"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileSignature className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 block">
                  Layanan Terpadu
                </span>
                <p className="text-sm font-bold text-white truncate">
                  Arsip Surat, Proker & Pengajuan SK
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </Link>

          <Link
            href="/donasi"
            className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-400/50 transition-all"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Heart className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                  Kemandirian Gerakan
                </span>
                <p className="text-sm font-bold text-white truncate">
                  Dukung Donasi Digital (QRIS)
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </Link>
        </div>

        {/* ================= 2. MAIN 4-COLUMN ARCHITECTURAL GRID ================= */}
        <div className="py-12 sm:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Kolom 1: Identitas Organisasi & Sekretariat (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 shrink-0">
                <img
                  src="/logo.png"
                  alt="Logo PMII"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-400 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <span>Pengurus Komisariat</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
                  PMII{" "}
                  <span className="text-yellow-400">
                    {(config.komisariatName || "SUNAN AMPEL MALANG").replace(
                      "Komisariat ",
                      ""
                    )}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pergerakan Mahasiswa Islam Indonesia
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-400 whitespace-pre-line">
              {config.tentangPmii}
            </p>

            {/* Kartu Lokasi Sekretariat */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Sekretariat Komisariat
                </span>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                  {config.lokasi}
                </p>
              </div>
            </div>
          </div>

          {/* Kolom 2: Direktori Organisasi (3 cols) */}
          <div className="lg:col-span-3 lg:pl-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-yellow-400 mb-5">
              <Compass className="w-3.5 h-3.5" />
              <span>Direktori Utama</span>
            </div>
            <ul className="space-y-2.5">
              {directoryLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between py-1.5 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors border-b border-slate-800/50 hover:border-slate-700"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono font-bold text-slate-600 group-hover:text-yellow-400 transition-colors">
                        /{item.code}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-yellow-400 transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3: Literasi, Media & Layanan (2.5 -> 2 cols) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-yellow-400 mb-5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Literasi & Akses</span>
            </div>
            <ul className="space-y-2.5">
              {serviceLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-2 py-1.5 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors border-b border-slate-800/50 hover:border-slate-700"
                  >
                    <span className="font-medium truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="px-1.5 py-0.5 rounded bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-[9px] font-mono font-bold shrink-0">
                        {item.badge}
                      </span>
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-yellow-400 shrink-0 transition-colors" />
                    )}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://siakad.pmii-uinmalang.or.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-2 py-1.5 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors border-b border-slate-800/50"
                >
                  <span className="font-semibold">Portal SIAKAD PMII</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Jam Operasional & Portal Kaderisasi (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-yellow-400 mb-5">
              <Clock className="w-3.5 h-3.5" />
              <span>Jam Layanan Sekretariat</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Senin – Jumat</span>
                <span className="font-mono font-bold text-slate-200">
                  {config.jamSeninJumat}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Sabtu – Minggu</span>
                <span className="font-mono font-bold text-yellow-400">
                  {config.jamSabtuMinggu}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/25 p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                  Kaderisasi Terbuka
                </span>
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Bergabung bersama keluarga besar PK. PMII Sunan Ampel Malang atau
                baca modul materi kaderisasi secara daring.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/pendaftaran"
                  className="text-center bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-2 px-3 rounded-lg text-[11px] transition"
                >
                  Daftar Kader
                </Link>
                <Link
                  href="/bacaan"
                  className="text-center bg-white/5 hover:bg-white/10 text-white border border-white/15 font-bold py-2 px-3 rounded-lg text-[11px] transition"
                >
                  Baca Buku 3D
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. BOTTOM COPYRIGHT & UTILITY BAR ================= */}
        <div className="pt-6 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p className="text-xs text-slate-500">{config.footerText}</p>
            <span className="hidden sm:inline text-slate-800">•</span>
            <span className="text-[11px] font-mono text-slate-500">
              DZIKIR • FIKIR • AMAL SHOLEH
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-400 hover:text-yellow-400 transition"
            >
              <Lock className="w-3 h-3" />
              <span>Portal Pengurus</span>
            </Link>

            <button
              onClick={scrollToTop}
              aria-label="Kembali ke atas"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-yellow-400 transition"
            >
              <span>ATAS</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
