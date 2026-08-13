"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, X, ExternalLink, Sun, Moon } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const LOGO_URL = "/logo.png";

// Komponen Toggle Tema agar bisa dipakai di mode Desktop dan Mobile
const ThemeToggle = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Mencegah error hidrasi (ketidaksesuaian render awal antara server & client)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`w-8 h-8 rounded-full ${className}`}></div>; // Placeholder
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`p-2 rounded-full transition-colors ${
        theme === "dark" ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-blue-800 text-yellow-200 hover:bg-blue-700"
      } ${className}`}
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const [globalConfig, setGlobalConfig] = useState({
    logoText: "PMII",
    komisariatName: "SUNAN AMPEL MALANG"
  });

  useEffect(() => {
    async function fetchGlobalConfig() {
      try {
        const docRef = doc(db, "website_config", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalConfig(docSnap.data());
        }
      } catch (error) {
        console.error("Gagal memuat konfigurasi global navbar:", error);
      }
    }
    fetchGlobalConfig();
  }, []);

  const isActive = (path) => {
    return pathname === path 
      ? "text-[#facc15] border-b-2 border-[#facc15] pb-1 font-bold" 
      : "text-white hover:text-[#facc15] transition border-b-2 border-transparent pb-1 font-medium";
  };

  const isActiveMobile = (path) => {
    return pathname === path ? "text-[#facc15] font-bold" : "text-white hover:text-[#facc15] transition";
  };

  return (
    <div className="fixed w-full z-50">
      <nav className="bg-[#111827] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2 md:gap-3">
              {LOGO_URL ? (
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                  <img src={LOGO_URL} alt="Logo PMII" className="w-full h-full object-contain drop-shadow-md" />
                </div>
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded flex items-center justify-center shadow-inner">
                  <span className="text-yellow-300 font-bold text-[10px] md:text-xs">{globalConfig.logoText}</span>
                </div>
              )}
              <div>
                <h1 className="font-bold text-sm md:text-xl leading-none">
                  PMII <span className="text-[#facc15]">{globalConfig.komisariatName.replace("Komisariat ", "")}</span>
                </h1>
                <p className="font-light text-[8px] md:text-xs text-slate-300 mt-0.5 md:mt-1">
                  Pergerakan Mahasiswa Islam Indonesia
                </p>
              </div>
            </div>

            <div className="hidden xl:flex items-center space-x-5 text-sm">
              <Link href="/" className={isActive("/")}>Beranda</Link>
              <Link href="/struktur" className={isActive("/struktur")}>Struktur</Link>
              <Link href="/anggota" className={isActive("/anggota")}>Anggota</Link>
              <Link href="/rayon" className={isActive("/rayon")}>Rayon</Link>
              <Link href="/alumni" className={isActive("/alumni")}>Alumni</Link>
              <Link href="/apresiasi" className={isActive("/apresiasi")}>Apresiasi</Link>
              <Link href="/berita" className={isActive("/berita")}>Berita</Link>
              <Link href="/administrasi" className={isActive("/administrasi")}>Administrasi</Link>
              
              <Link href="/pendaftaran" className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 px-5 py-2 rounded-full font-bold transition shadow-md shadow-blue-500/20 mx-2 whitespace-nowrap">
                Pendaftaran
              </Link>
              
              {/* Tombol Tema untuk Desktop */}
              <ThemeToggle />
            </div>

            {/* Area Kanan untuk Mode Mobile (Tombol Tema + Hamburger) */}
            <div className="flex items-center gap-3 xl:hidden">
              <ThemeToggle />
              <button className="text-white p-1" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="xl:hidden bg-[#1f2937] p-4 flex flex-col space-y-4 text-sm border-t border-slate-700 shadow-xl pb-6 h-screen overflow-y-auto">
            <Link href="/" onClick={() => setIsOpen(false)} className={isActiveMobile("/")}>Beranda</Link>
            <Link href="/struktur" onClick={() => setIsOpen(false)} className={isActiveMobile("/struktur")}>Struktur Kepengurusan</Link>
            <Link href="/anggota" onClick={() => setIsOpen(false)} className={isActiveMobile("/anggota")}>Database Anggota</Link>
            <Link href="/rayon" onClick={() => setIsOpen(false)} className={isActiveMobile("/rayon")}>Daftar Rayon</Link>
            <Link href="/alumni" onClick={() => setIsOpen(false)} className={isActiveMobile("/alumni")}>Jejaring Alumni</Link>
            <Link href="/apresiasi" onClick={() => setIsOpen(false)} className={isActiveMobile("/apresiasi")}>Apresiasi Kader</Link>
            <Link href="/berita" onClick={() => setIsOpen(false)} className={isActiveMobile("/berita")}>Berita & Artikel</Link>
            <Link href="/administrasi" onClick={() => setIsOpen(false)} className={isActiveMobile("/administrasi")}>Data Administrasi</Link>
            
            <a href="https://siakad.pmii-uinmalang.or.id/" target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="text-emerald-400 hover:text-emerald-300 transition font-bold flex items-center gap-2 pt-2 border-t border-slate-700">
              Portal Siakad PMII <ExternalLink size={14} />
            </a>
            
            <Link href="/pendaftaran" onClick={() => setIsOpen(false)} className="bg-blue-600 text-white text-center py-3 rounded-lg font-bold mt-2">
              Pendaftaran Kader
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}