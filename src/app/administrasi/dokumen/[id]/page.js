// app/administrasi/dokumen/[id]/page.js
"use client";
import React, { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft, Share2, Download, MonitorPlay, ExternalLink } from "lucide-react";
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
    const text = encodeURIComponent(`Lihat Dokumen Administrasi PMII: ${dokumen?.judul}\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center pt-24">
          <Loader2 size={36} className="text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!dokumen) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center pt-24 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 text-slate-400">
            <MonitorPlay size={32} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">Dokumen Tidak Ditemukan</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            Materi atau presentasi yang Anda cari mungkin sudah diperbarui atau dihapus oleh Admin.
          </p>
          <Link
            href="/administrasi?tab=presentasi"
            className="bg-[#020617] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition"
          >
            Kembali ke Pusat Administrasi
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* HEADER DARK BANNER */}
      <section className="pt-28 md:pt-32 pb-10 px-4 sm:px-6 bg-[#020617] text-white border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <Link
            href="/administrasi?tab=presentasi"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-[#facc15] transition mb-5"
          >
            <ArrowLeft size={15} /> Kembali ke Presentasi & Dokumen
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block bg-blue-600/20 border border-blue-500/30 text-[#facc15] px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
                {dokumen.tipeDokumen || "Presentasi"}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                {dokumen.judul}
              </h1>
              {dokumen.deskripsi && (
                <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl mt-2.5 whitespace-pre-wrap">
                  {dokumen.deskripsi}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={handleShare}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition border border-slate-700"
              >
                <Share2 size={15} /> Bagikan
              </button>
              {dokumen.embedUrl && (
                <a
                  href={dokumen.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition border border-slate-700"
                >
                  <ExternalLink size={15} /> Layar Penuh
                </a>
              )}
              {dokumen.downloadUrl && (
                <a
                  href={dokumen.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm"
                >
                  <Download size={15} /> Unduh Berkas
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-grow py-8 sm:py-12 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        {/* PEMUTAR DOKUMEN (IFRAME) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden w-full relative pt-[65%] sm:pt-[56.25%]">
          <iframe
            loading="lazy"
            title={dokumen.judul || "Pratinjau Dokumen"}
            className="absolute top-0 left-0 w-full h-full border-0"
            src={getSafeEmbedUrl(dokumen.embedUrl)}
            allowFullScreen
            allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
