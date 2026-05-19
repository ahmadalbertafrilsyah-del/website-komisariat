"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ExternalLink } from "lucide-react"; // Tambahan ikon ExternalLink
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  // State untuk menyimpan data logo dan nama dari Firebase
  const [globalConfig, setGlobalConfig] = useState({
    logoText: "PMII",
    komisariatName: "Komisariat UIN Malang",
    logoUrl: ""
  });

  // Tarik data dari Firebase
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
            
            {/* ================= AREA LOGO & NAMA KOMISARIAT ================= */}
            <div className="flex items-center gap-2 md:gap-3">
              {globalConfig.logoUrl ? (
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                  <img 
                    src={globalConfig.logoUrl} 
                    alt="Logo PMII" 
                    className="w-full h-full object-contain" 
                  />
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

            {/* ================= MENU DESKTOP ================= */}
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <Link href="/" className={isActive("/")}>Beranda</Link>
              <Link href="/struktur" className={isActive("/struktur")}>Struktur</Link>
              <Link href="/anggota" className={isActive("/anggota")}>Anggota</Link>
              <Link href="/rayon" className={isActive("/rayon")}>Rayon</Link>
              <Link href="/berita" className={isActive("/berita")}>Berita</Link>
              <Link href="/administrasi" className={isActive("/administrasi")}>Administrasi</Link>
              
              {/* Menu SIAKAD PMII (Eksternal Link) */}
              <a 
                href="https://siakad.pmii-uinmalang.or.id/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-400 hover:text-emerald-300 transition font-bold flex items-center gap-1.5"
              >
                Siakad PMII <ExternalLink size={14} />
              </a>
              
              <Link href="/pendaftaran" className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 px-5 py-2 rounded-full font-bold transition shadow-md shadow-blue-500/20 ml-2">
                Pendaftaran
              </Link>
            </div>

            {/* Tombol Toggle Menu Mobile */}
            <button className="md:hidden text-white p-1" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ================= MENU MOBILE (HP) ================= */}
        {isOpen && (
          <div className="md:hidden bg-[#1f2937] p-4 flex flex-col space-y-4 text-xs sm:text-sm border-t border-slate-700 shadow-xl pb-6">
            <Link href="/" onClick={() => setIsOpen(false)} className={isActiveMobile("/")}>Beranda</Link>
            <Link href="/struktur" onClick={() => setIsOpen(false)} className={isActiveMobile("/struktur")}>Struktur Kepengurusan</Link>
            <Link href="/anggota" onClick={() => setIsOpen(false)} className={isActiveMobile("/anggota")}>Database Anggota</Link>
            <Link href="/rayon" onClick={() => setIsOpen(false)} className={isActiveMobile("/rayon")}>Daftar Rayon</Link>
            <Link href="/berita" onClick={() => setIsOpen(false)} className={isActiveMobile("/berita")}>Berita & Artikel</Link>
            <Link href="/administrasi" onClick={() => setIsOpen(false)} className={isActiveMobile("/administrasi")}>Data Administrasi</Link>
            
            {/* Menu SIAKAD PMII Mobile */}
            <a 
              href="https://siakad.pmii-uinmalang.or.id/" 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => setIsOpen(false)}
              className="text-emerald-400 hover:text-emerald-300 transition font-bold flex items-center gap-2 pt-2 border-t border-slate-700"
            >
              Siakad PMII <ExternalLink size={14} />
            </a>
            
            <Link href="/pendaftaran" onClick={() => setIsOpen(false)} className="bg-blue-600 text-white text-center py-2.5 rounded-lg font-bold mt-2">
              Pendaftaran Kader
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}