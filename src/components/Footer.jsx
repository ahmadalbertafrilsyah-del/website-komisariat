"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ChevronRight, Clock, Lock } from "lucide-react";

export default function Footer() {
  const [config, setConfig] = useState({
    tentangPmii: "PMII Komisariat adalah organisasi mahasiswa Islam yang berkomitmen untuk membangun intelektual muslim yang berkarakter dan berakhlak mulia berdasarkan nilai-nilai Ahlussunnah Wal Jama'ah.",
    jamSeninJumat: "08:00 - 16:00 WIB",
    jamSabtuMinggu: "09:00 - 14:00 WIB",
    lokasi: "Jl. Gajayana No. 50\nKota Malang, Jawa Timur",
    footerText: "© 2026 PMII Komisariat. Powered by Divisi Kominfo."
  });

  useEffect(() => {
    async function fetchGlobalConfig() {
      try {
        const docRef = doc(db, "website_config", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig({ ...config, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Gagal memuat data footer:", error);
      }
    }
    fetchGlobalConfig();
  }, []);

  return (
    <footer className="bg-[#0f172a] text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        
        {/* PERUBAHAN: sm:grid-cols-2 lg:grid-cols-3 membuat layout sangat rapi di tablet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 mb-12">
          
          {/* Kolom 1: Tentang */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl font-bold text-yellow-400 mb-5 md:mb-6">Tentang PMII Komisariat</h3>
            <p className="text-sm leading-relaxed text-slate-400 whitespace-pre-line">
              {config.tentangPmii}
            </p>
          </div>
          
          {/* Kolom 2: Link Cepat */}
          <div>
            <h3 className="text-xl font-bold text-yellow-400 mb-5 md:mb-6">Menu Kategori</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-yellow-400 flex items-center gap-2 transition"><ChevronRight size={14}/> Beranda</Link></li>
              <li><Link href="/struktur" className="hover:text-yellow-400 flex items-center gap-2 transition"><ChevronRight size={14}/> Struktur Kepengurusan</Link></li>
              <li><Link href="/anggota" className="hover:text-yellow-400 flex items-center gap-2 transition"><ChevronRight size={14}/> Cari Anggota</Link></li>
              <li><Link href="/rayon" className="hover:text-yellow-400 flex items-center gap-2 transition"><ChevronRight size={14}/> Daftar Rayon</Link></li>
              <li><Link href="/administrasi" className="hover:text-yellow-400 flex items-center gap-2 transition"><ChevronRight size={14}/> Administrasi Surat</Link></li>
              <li><Link href="https://siakad.pmii-uinmalang.or.id/" className="hover:text-yellow-400 flex items-center gap-2 transition"><ChevronRight size={14}/> Portal Siakad</Link></li>
            </ul>
          </div>
          
          {/* Kolom 3: Jam & Lokasi */}
          <div>
            <h3 className="text-xl font-bold text-yellow-400 mb-5 md:mb-6">Jam Operasional</h3>
            <div className="space-y-4 text-sm text-slate-400 mb-6">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Senin - Jumat</p>
                  <p>{config.jamSeninJumat}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Sabtu - Minggu</p>
                  <p>{config.jamSabtuMinggu}</p>
                </div>
              </div>
            </div>
            <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-2">Lokasi Kami</h4>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
              {config.lokasi}
            </p>
          </div>
        </div>

        {/* ================= AREA BAWAH ================= */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 text-center md:text-left">
            {config.footerText}
          </p>
          <Link 
            href="/admin/login" 
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-yellow-400 transition group"
          >
            <Lock size={12} className="group-hover:-translate-y-0.5 transition-transform" /> Portal Pengurus
          </Link>
        </div>
      </div>
    </footer>
  );
}