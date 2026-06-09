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
  // Unwrap params menggunakan React.use() sesuai standar Next.js terbaru
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
          // Cari dokumen yang ID-nya cocok dengan URL
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

  // 🔥 PENYEMBUH LINK OTOMATIS 🔥
  // Mencegah error "Sad Face" jika Admin salah memasukkan link biasa (bukan link embed)
  const getSafeEmbedUrl = (url) => {
    if (!url) return "";
    let safeUrl = url;
    
    // Jika link Canva tapi tidak ada '?embed'
    if (safeUrl.includes("canva.com") && !safeUrl.includes("embed")) {
      safeUrl = safeUrl.split("?")[0] + "?embed";
    }
    // Jika link Google Docs/Sheets/Slides tapi pakai '/edit'
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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center pt-24">
          <Loader2 size={40} className="text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!dokumen) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center pt-24 text-center px-4">
          <MonitorPlay size={60} className="text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Dokumen Tidak Ditemukan</h1>
          <p className="text-slate-500 mb-6">Materi atau presentasi yang Anda cari mungkin sudah dihapus oleh Admin.</p>
          <Link href="/administrasi" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">
            Kembali ke Pusat Administrasi
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-28 md:pt-36 pb-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        <Link href="/administrasi" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition mb-6">
          <ArrowLeft size={16} /> Kembali
        </Link>

        {/* HEADER DOKUMEN */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-3">
                {dokumen.tipeDokumen || "Presentasi"}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 leading-snug">
                {dokumen.judul}
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-3xl">
                {dokumen.deskripsi}
              </p>
            </div>
            
            <div className="flex flex-row md:flex-col gap-3 shrink-0">
              <button onClick={handleShare} className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm border border-emerald-100 hover:border-emerald-600 w-full md:w-auto">
                <Share2 size={16} /> Bagikan
              </button>
              {dokumen.downloadUrl && (
                <a href={dokumen.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm w-full md:w-auto">
                  <Download size={16} /> Unduh Berkas
                </a>
              )}
            </div>
          </div>
        </div>

        {/* PEMUTAR DOKUMEN (IFRAME) */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden w-full relative pt-[56.25%] (16:9 Aspect Ratio)">
           {/* Aspect Ratio Container */}
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