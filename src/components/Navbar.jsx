"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  Menu, X, ExternalLink, Sun, Moon, 
  Home, Newspaper, UserPlus, Users, 
  Compass, GraduationCap, Award, Archive, ShieldCheck
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const LOGO_URL = "/logo.png";

// Komponen Toggle Tema
const ThemeToggle = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`w-8 h-8 rounded-full ${className}`}></div>; 
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

  // Styling Tab Aktif (Desktop)
  const isActive = (path) => {
    return pathname === path 
      ? "text-[#facc15] border-b-2 border-[#facc15] pb-1 font-bold" 
      : "text-white hover:text-[#facc15] transition border-b-2 border-transparent pb-1 font-medium";
  };

  // Styling Menu Interaktif ala Aplikasi (Mobile Sheet - Diperkecil Paddingnya)
  const isActiveMobile = (path) => {
    return pathname === path 
        ? "text-[#facc15] font-bold bg-white/10 px-3 py-2.5 rounded-xl flex items-center gap-3" 
        : "text-slate-300 hover:text-[#facc15] transition px-3 py-2.5 hover:bg-white/5 rounded-xl flex items-center gap-3";
  };

  // Mematikan scroll body ketika Bottom Sheet terbuka di HP
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <>
      {/* ==================== 1. TOP NAVBAR ==================== */}
      <div className="fixed top-0 w-full z-50">
        <nav className="bg-[#111827] text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex justify-between items-center h-16 md:h-20">
              {/* Logo & Judul */}
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

              {/* DESKTOP MENU (Ditampilkan di layar besar) */}
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
                
                <ThemeToggle />
              </div>

              {/* MOBILE TOP BUTTONS (Tombol Login Admin & Toggle Tema) */}
              <div className="flex items-center gap-2 xl:hidden">
                <Link 
                  href="/admin/login" 
                  className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  aria-label="Login Admin"
                >
                  <ShieldCheck size={18} />
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* ==================== 2. MOBILE BOTTOM APP BAR (5 IKON) ==================== */}
      <div className="xl:hidden fixed bottom-0 left-0 w-full bg-[#111827] border-t border-slate-800 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] z-50 flex justify-around items-center h-16 px-1 pb-[env(safe-area-inset-bottom)]">
          <Link href="/" onClick={() => setIsOpen(false)} className={`flex flex-col items-center gap-1 w-1/5 ${pathname === '/' ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400 transition-colors'}`}>
              <Home size={20} />
              <span className="text-[9px] font-medium truncate w-full text-center">Beranda</span>
          </Link>
          <Link href="/berita" onClick={() => setIsOpen(false)} className={`flex flex-col items-center gap-1 w-1/5 ${pathname.startsWith('/berita') ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400 transition-colors'}`}>
              <Newspaper size={20} />
              <span className="text-[9px] font-medium truncate w-full text-center">Berita</span>
          </Link>
          <Link href="/administrasi" onClick={() => setIsOpen(false)} className={`flex flex-col items-center gap-1 w-1/5 ${pathname.startsWith('/administrasi') ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400 transition-colors'}`}>
              <Archive size={20} />
              <span className="text-[9px] font-medium truncate w-full text-center">Data Adm</span>
          </Link>
          <Link href="/pendaftaran" onClick={() => setIsOpen(false)} className={`flex flex-col items-center gap-1 w-1/5 ${pathname.startsWith('/pendaftaran') ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400 transition-colors'}`}>
              <UserPlus size={20} />
              <span className="text-[9px] font-medium truncate w-full text-center">Daftar</span>
          </Link>
          
          <button onClick={() => setIsOpen(!isOpen)} className={`flex flex-col items-center gap-1 w-1/5 ${isOpen ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400 transition-colors'}`}>
              {isOpen ? <X size={20} /> : <Menu size={20} />}
              <span className="text-[9px] font-medium truncate w-full text-center">Menu</span>
          </button>
      </div>

      {/* ==================== 3. MOBILE BOTTOM MENU SHEET (DIPERKECIL) ==================== */}
      {isOpen && (
        <>
          {/* Backdrop (Latar Belakang Gelap) */}
          <div className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}></div>
          
          {/* Laci Konten Menu - Lebih Kecil dan Padat */}
          <div className="xl:hidden fixed bottom-16 left-0 w-full bg-[#1f2937] p-4 flex flex-col space-y-1 text-sm rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-h-[60vh] overflow-y-auto z-40 border-t border-slate-700 animate-in slide-in-from-bottom-full duration-300">
            
            {/* Pull Indicator (Garis abu-abu di atas modal) */}
            <div className="w-10 h-1.5 bg-slate-600 rounded-full mx-auto mb-3 shrink-0"></div> 
            
            {/* Daftar Tautan Menu Pendukung */}
            <Link href="/struktur" onClick={() => setIsOpen(false)} className={isActiveMobile("/struktur")}>
              <Users size={18} /> Struktur Kepengurusan
            </Link>
            <Link href="/anggota" onClick={() => setIsOpen(false)} className={isActiveMobile("/anggota")}>
              <Users size={18} /> Database Anggota
            </Link>
            <Link href="/rayon" onClick={() => setIsOpen(false)} className={isActiveMobile("/rayon")}>
              <Compass size={18} /> Daftar Rayon
            </Link>
            <Link href="/alumni" onClick={() => setIsOpen(false)} className={isActiveMobile("/alumni")}>
              <GraduationCap size={18} /> Jejaring Alumni
            </Link>
            <Link href="/apresiasi" onClick={() => setIsOpen(false)} className={isActiveMobile("/apresiasi")}>
              <Award size={18} /> Apresiasi Kader
            </Link>
            
            {/* Tautan Eksternal */}
            <div className="pt-2 mt-1 border-t border-slate-700">
              <a href="https://siakad.pmii-uinmalang.or.id/" target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 p-2.5 rounded-xl transition font-bold flex items-center justify-between">
                <span className="flex items-center gap-3"><ExternalLink size={18} /> Portal Siakad PMII</span>
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}