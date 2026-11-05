"use client";
import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon,
  Home,
  Newspaper,
  UserPlus,
  Users,
  Compass,
  GraduationCap,
  Award,
  Archive,
  BookOpen,
  Heart,
  Network,
  ArrowUpRight,
  ChevronDown,
  Database,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const LOGO_URL = "/logo.png";

const emptySubscribe = () => () => {};

// Komponen Toggle Tema (Light / Dark)
const ThemeToggle = ({ className = "" }) => {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/70 shrink-0 ${className}`}
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
        theme === "dark"
          ? "bg-slate-900 border-slate-700/80 text-yellow-400 hover:border-yellow-400/50 hover:bg-slate-800"
          : "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700"
      } ${className}`}
      aria-label="Ubah Tema Terang/Gelap"
      title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

const DATABASE_ITEMS = [
  {
    label: "Anggota",
    sub: "Direktori Kader Aktif",
    href: "/anggota",
    icon: Users,
  },
  {
    label: "Alumni",
    sub: "Jejaring IKA & Alumni",
    href: "/alumni",
    icon: GraduationCap,
  },
  {
    label: "Rayon",
    sub: "Basis Tingkat Fakultas",
    href: "/rayon",
    icon: Compass,
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dbDropdownOpen, setDbDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const dbDropdownRef = useRef(null);

  const [globalConfig, setGlobalConfig] = useState({
    logoText: "PMII",
    komisariatName: "SUNAN AMPEL MALANG",
  });

  useEffect(() => {
    async function fetchGlobalConfig() {
      try {
        const docRef = doc(db, "website_config", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalConfig((prev) => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Gagal memuat konfigurasi global navbar:", error);
      }
    }
    fetchGlobalConfig();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tutup dropdown Database saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dbDropdownRef.current &&
        !dbDropdownRef.current.contains(e.target)
      ) {
        setDbDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mematikan scroll body ketika Bottom Sheet terbuka di HP
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const checkActive = (path) => {
    if (path === "/") return pathname === "/";
    if (path === "/bacaan") {
      return pathname.startsWith("/bacaan") || pathname.startsWith("/buku");
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const isDatabaseActive = DATABASE_ITEMS.some((item) =>
    checkActive(item.href)
  );

  const activeDatabaseItem = DATABASE_ITEMS.find((item) =>
    checkActive(item.href)
  );

  const mobileGridOrg = [
    { label: "Struktur", sub: "BPH & Biro", href: "/struktur", icon: Network },
    { label: "Anggota", sub: "Data Kader", href: "/anggota", icon: Users },
    {
      label: "Alumni",
      sub: "Jejaring IKA",
      href: "/alumni",
      icon: GraduationCap,
    },
    { label: "Rayon", sub: "Basis Fakultas", href: "/rayon", icon: Compass },
    { label: "Apresiasi", sub: "Hall of Fame", href: "/apresiasi", icon: Award },
    {
      label: "Administrasi",
      sub: "Surat & SK",
      href: "/administrasi",
      icon: Archive,
    },
  ];

  return (
    <>
      {/* ==================== 1. TOP ARCHITECTURAL HEADER ==================== */}
      <header className="fixed top-0 inset-x-0 z-50">
        <nav
          className={`transition-all duration-300 border-b ${
            scrolled
              ? "bg-[#050a14]/95 backdrop-blur-xl border-slate-800/90"
              : "bg-[#070e1c]/95 backdrop-blur-md border-white/10"
          } text-white`}
        >
          {/* Top Accent Hairline */}
          <div className="h-[2px] w-full bg-gradient-to-r from-blue-600 via-yellow-400 to-blue-600" />

          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 md:h-[70px] gap-2 lg:gap-3">
              {/* Brand Identity (Logo & Nama Komisariat) */}
              <Link
                href="/"
                onClick={() => {
                  setIsOpen(false);
                  setDbDropdownOpen(false);
                }}
                className="group flex items-center gap-2.5 shrink-0 min-w-0"
              >
                {LOGO_URL ? (
                  <img
                    src={LOGO_URL}
                    alt="Logo PMII"
                    className="w-11 h-11 md:w-12 md:h-12 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-yellow-400 font-black text-sm shrink-0">
                    {globalConfig.logoText}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest text-yellow-400/90 leading-none">
                      PENGURUS KOMISARIAT
                    </span>
                  </div>
                  <h1 className="font-black text-xs sm:text-sm md:text-[15px] tracking-tight leading-tight truncate">
                    PMII{" "}
                    <span className="text-yellow-400">
                      {(
                        globalConfig.komisariatName || "SUNAN AMPEL MALANG"
                      ).replace("Komisariat ", "")}
                    </span>
                  </h1>
                </div>
              </Link>

              {/* DESKTOP NAVIGATION PILLS (xl+) */}
              <div className="hidden xl:flex items-center gap-1 bg-slate-900/75 border border-slate-800/90 rounded-2xl p-1">
                {/* 1. Beranda */}
                <Link
                  href="/"
                  onClick={() => setDbDropdownOpen(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    checkActive("/")
                      ? "bg-yellow-400 text-slate-950 shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  Beranda
                </Link>

                {/* 2. Struktur */}
                <Link
                  href="/struktur"
                  onClick={() => setDbDropdownOpen(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    checkActive("/struktur")
                      ? "bg-yellow-400 text-slate-950 shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  Struktur
                </Link>

                {/* 3. Dropdown DATABASE (Anggota, Alumni, Rayon) */}
                <div className="relative" ref={dbDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDbDropdownOpen((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isDatabaseActive
                        ? "bg-yellow-400 text-slate-950 shadow-xs"
                        : dbDropdownOpen
                        ? "bg-white/10 text-white"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <Database
                      size={13}
                      className={
                        isDatabaseActive ? "text-slate-950" : "text-yellow-400"
                      }
                    />
                    <span>
                      Database
                      {activeDatabaseItem
                        ? ` • ${activeDatabaseItem.label}`
                        : ""}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${
                        dbDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Menu Dropdown 3 Pilihan Ke Bawah */}
                  {dbDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2.5 w-60 rounded-2xl bg-[#091122] border border-slate-700/90 shadow-[0_18px_45px_rgba(0,0,0,0.65)] p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-2.5 py-1.5 mb-1 border-b border-slate-800/90 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-400">
                          Direktori Database
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          3 MODUL
                        </span>
                      </div>
                      <div className="space-y-1">
                        {DATABASE_ITEMS.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const subActive = checkActive(subItem.href);
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setDbDropdownOpen(false)}
                              className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                subActive
                                  ? "bg-yellow-400 text-slate-950 font-bold"
                                  : "text-slate-200 hover:bg-slate-800/90 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    subActive
                                      ? "bg-slate-950/15 text-slate-950"
                                      : "bg-slate-800 border border-slate-700/80 text-yellow-400 group-hover:border-yellow-400/50"
                                  }`}
                                >
                                  <SubIcon size={15} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold leading-tight truncate">
                                    {subItem.label}
                                  </p>
                                  <p
                                    className={`text-[10px] truncate ${
                                      subActive
                                        ? "text-slate-800 font-medium"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {subItem.sub}
                                  </p>
                                </div>
                              </div>
                              <ArrowUpRight
                                size={14}
                                className={
                                  subActive
                                    ? "text-slate-950 shrink-0"
                                    : "text-slate-500 group-hover:text-yellow-400 shrink-0"
                                }
                              />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Apresiasi */}
                <Link
                  href="/apresiasi"
                  onClick={() => setDbDropdownOpen(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    checkActive("/apresiasi")
                      ? "bg-yellow-400 text-slate-950 shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  Apresiasi
                </Link>

                {/* 5. Bacaan Kader (Buku 3D) */}
                <Link
                  href="/bacaan"
                  onClick={() => setDbDropdownOpen(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    checkActive("/bacaan")
                      ? "bg-yellow-400 text-slate-950 shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  Perpustakaan
                </Link>

                {/* 6. Berita */}
                <Link
                  href="/berita"
                  onClick={() => setDbDropdownOpen(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    checkActive("/berita")
                      ? "bg-yellow-400 text-slate-950 shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  Berita
                </Link>

                {/* 7. Administrasi */}
                <Link
                  href="/administrasi"
                  onClick={() => setDbDropdownOpen(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    checkActive("/administrasi")
                      ? "bg-yellow-400 text-slate-950 shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  Administrasi
                </Link>
              </div>

              {/* DESKTOP RIGHT ACTION GROUP (xl+) — Tanpa Icon Login Admin */}
              <div className="hidden xl:flex items-center gap-2 shrink-0">
                <Link
                  href="/donasi"
                  onClick={() => setDbDropdownOpen(false)}
                  className="bg-red-600 hover:bg-red-500 text-white border border-red-400/40 px-4 py-2 rounded-xl text-xs font-black tracking-wide transition shadow-md shadow-red-600/20 whitespace-nowrap"
                >
                  Donasi
                </Link>
                
                <Link
                  href="/pendaftaran"
                  onClick={() => setDbDropdownOpen(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 px-4 py-2 rounded-xl text-xs font-black tracking-wide transition shadow-md shadow-blue-600/20 whitespace-nowrap"
                >
                  Pendaftaran
                </Link>

                <ThemeToggle />
              </div>

              {/* MOBILE & TABLET RIGHT ACTIONS (< xl) — Tanpa Icon Login Admin */}
              <div className="flex items-center gap-2 xl:hidden">
                <a
                  href="https://siakad.pmii-uinmalang.or.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all bg-slate-900/90 border-slate-700/80 text-yellow-300 hover:border-yellow-400/40"
                >
                  <ExternalLink size={13} />
                  <span>SIAKAD</span>
                </a>

                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* ==================== 2. MOBILE NATIVE BOTTOM NAVIGATION DOCK (5 TAB) ==================== */}
      <div className="xl:hidden fixed bottom-0 inset-x-0 bg-[#050a14]/95 backdrop-blur-xl border-t border-slate-800/90 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16 px-1.5 max-w-lg mx-auto">
          {[
            { label: "Beranda", href: "/", icon: Home },
            { label: "Perpustakaan", href: "/bacaan", icon: BookOpen },
            { label: "Berita", href: "/berita", icon: Newspaper },
            { label: "Daftar", href: "/pendaftaran", icon: UserPlus },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = !isOpen && checkActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setIsOpen(false)}
                className="relative flex flex-col items-center justify-center gap-1 group"
              >
                {active && (
                  <span className="absolute top-0 w-7 h-0.5 rounded-full bg-yellow-400" />
                )}
                <div
                  className={`px-3 py-1 rounded-xl transition-colors ${
                    active
                      ? "bg-yellow-400/15 text-yellow-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span
                  className={`text-[10px] tracking-tight truncate ${
                    active
                      ? "font-bold text-yellow-400"
                      : "font-medium text-slate-400"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Tombol Pembuka Laci Semua Menu */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex flex-col items-center justify-center gap-1 group"
          >
            {isOpen && (
              <span className="absolute top-0 w-7 h-0.5 rounded-full bg-yellow-400" />
            )}
            <div
              className={`px-3 py-1 rounded-xl transition-colors ${
                isOpen
                  ? "bg-yellow-400 text-slate-950"
                  : "text-slate-400 group-hover:text-slate-200"
              }`}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </div>
            <span
              className={`text-[10px] tracking-tight truncate ${
                isOpen
                  ? "font-bold text-yellow-400"
                  : "font-medium text-slate-400"
              }`}
            >
              Semua Menu
            </span>
          </button>
        </div>
      </div>

      {/* ==================== 3. MOBILE APP DRAWER SHEET (KATEGORI TERSTRUKTUR) ==================== */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-40 xl:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet Container */}
          <div className="xl:hidden fixed bottom-16 inset-x-0 bg-[#0b1324] text-white p-4 sm:p-5 rounded-t-3xl max-h-[75vh] overflow-y-auto z-40 border-t border-slate-800 animate-in slide-in-from-bottom-full duration-200">
            {/* Pull Handle */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3.5" />

            {/* Header Sheet */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-400 block">
                  Navigasi Portal Komisariat
                </span>
                <h3 className="text-sm font-black text-white">
                  Eksplorasi Modul & Database
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Banner Highlight Perpustakaan Buku 3D */}
            <Link
              href="/bacaan"
              onClick={() => setIsOpen(false)}
              className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-blue-950/60 to-slate-900 border border-yellow-400/35 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-yellow-400">
                      Perpustakaan Digital
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-yellow-400/20 text-yellow-300 text-[9px] font-mono font-bold">
                      3D FLIPBOOK
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    Bacaan Kader & Modul Pergerakan
                  </p>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-yellow-400 shrink-0" />
            </Link>

            {/* Grid 2 Kolom Modul Organisasi & Database */}
            <div className="mb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Database, Organisasi & Administrasi
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mobileGridOrg.map((item) => {
                  const Icon = item.icon;
                  const active = checkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                        active
                          ? "bg-yellow-400/15 border-yellow-400/50 text-yellow-300"
                          : "bg-slate-900/90 border-slate-800/90 text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          active
                            ? "bg-yellow-400 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-tight">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.sub}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Baris Bawah: Donasi & Portal SIAKAD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-800">
              <Link
                href="/donasi"
                onClick={() => setIsOpen(false)}
                className="p-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25 text-pink-300 font-bold text-xs flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Heart size={15} className="text-pink-400" />
                  <span>Donasi & Kemandirian QRIS</span>
                </span>
                <ArrowUpRight size={14} />
              </Link>

              <a
                href="https://siakad.pmii-uinmalang.or.id/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 font-bold text-xs flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink size={15} className="text-emerald-400" />
                  <span>Portal SIAKAD PMII</span>
                </span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
