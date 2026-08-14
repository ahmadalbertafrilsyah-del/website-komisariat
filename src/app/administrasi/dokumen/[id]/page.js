// app/administrasi/dokumen/[id]/page.js
"use client";
import React, { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft, Share2, Download, MonitorPlay } from "lucide-react";
import Link from "next/link";

export default function DetailDokumenPage({ params }) {
  const unwrappedParams = use(params);
  const documentId = unwrappedParams.id;
  
  const [loading, setLoading] = useState(true);
  const [dokumen, setDokumen] = useState(null);

  useEffect(() => {
    async function fetchDetailDokumen() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const listPresentasi = data.listPresentasi || [];
          const foundDoc = listPresentasi.find(item => item.id === documentId);
          setDokumen(foundDoc);
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (documentId) {
      fetchDetailDokumen();
    }
  }, [documentId]);

  const getSafeEmbedUrl = (url) => {
    if (!url) return "";
    let safeUrl = url;
    
    if (safeUrl.includes("canva.com") && !safeUrl.includes("embed")) {
      safeUrl = safeUrl.split("?")[0] + "?embed";
    }
    if (safeUrl.includes("docs.google.com") && safeUrl.includes("/edit")) {
      safeUrl = safeUrl.replace("/edit", "/preview");
    }
    
    return safeUrl;
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = encodeURIComponent(`Lihat Dokumen Administrasi: ${dokumen?.judul}\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center pt-24">
          <Loader2 size={40} className="text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!dokumen) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center pt-24 text-center px-4">
          <MonitorPlay size={60} className="text-slate-300 dark:text-slate-600 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Dokumen Tidak Ditemukan</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Materi atau presentasi yang Anda cari mungkin sudah dihapus oleh Admin.</p>
          <Link href="/administrasi" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold transition">
            Kembali ke Pusat Administrasi
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 flex flex-col font-sans text-slate-800 dark:text-slate-200">
      <Navbar />

      <main className="flex-grow pt-28 md:pt-36 pb-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        <Link href="/administrasi" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition mb-6">
          <ArrowLeft size={16} /> Kembali
        </Link>

        {/* HEADER DOKUMEN */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <span className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-3">
                {dokumen.tipeDokumen || "Presentasi"}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-3 leading-snug">
                {dokumen.judul}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
                {dokumen.deskripsi}
              </p>
            </div>
            
            <div className="flex flex-row md:flex-col gap-3 shrink-0">
              <button onClick={handleShare} className="flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm border border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-600 w-full md:w-auto">
                <Share2 size={16} /> Bagikan
              </button>
              {dokumen.downloadUrl && (
                <a href={dokumen.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm w-full md:w-auto">
                  <Download size={16} /> Unduh Berkas
                </a>
              )}
            </div>
          </div>
        </div>

        {/* PEMUTAR DOKUMEN (IFRAME) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden w-full relative pt-[56.25%]">
           <iframe
             loading="lazy"
             className="absolute top-0 left-0 w-full h-full border-0"
             src={getSafeEmbedUrl(dokumen.embedUrl)}
             allowFullScreen
             allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
           ></iframe>
        </div>

      </main>

      <Footer />
    </div>
  );
}