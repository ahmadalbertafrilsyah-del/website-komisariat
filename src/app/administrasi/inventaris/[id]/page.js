// app/administrasi/inventaris/[id]/page.js
"use client";
import React, { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft, Camera, CalendarDays, Package, CheckCircle2, AlertTriangle, AlertOctagon, Info } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function DetailInventarisPage({ params }) {
  // Standar Next.js terbaru untuk membaca URL Params & Queries
  const unwrappedParams = use(params);
  const itemId = unwrappedParams.id;
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "foto");

  useEffect(() => {
    async function fetchDetailInventaris() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const listInventaris = data.listInventaris || [];
          const foundItem = listInventaris.find(i => i.id === itemId);
          setItem(foundItem);
        }
      } catch (error) {
        console.error("Gagal mengambil data inventaris:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (itemId) {
      fetchDetailInventaris();
    }
  }, [itemId]);

  // Fungsi untuk mewarnai badge kondisi barang
  const getKondisiBadge = (kondisi) => {
    if (kondisi === "Baik") return <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"><CheckCircle2 size={14}/> Baik</span>;
    if (kondisi === "Rusak Ringan") return <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"><AlertTriangle size={14}/> Rusak Ringan</span>;
    return <span className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"><AlertOctagon size={14}/> Rusak Berat</span>;
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

  if (!item) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center pt-24 text-center px-4">
          <Package size={60} className="text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Barang Tidak Ditemukan</h1>
          <p className="text-slate-500 mb-6">Barang inventaris yang Anda cari mungkin sudah dihapus oleh Admin.</p>
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

      <main className="flex-grow pt-28 md:pt-36 pb-16 px-4 md:px-8 max-w-5xl mx-auto w-full">
        
        <Link href="/administrasi" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition mb-6">
          <ArrowLeft size={16} /> Kembali
        </Link>

        {/* HEADER BARANG */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                 <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-widest">
                   <Package size={14}/> Inventaris PMII
                 </span>
                 {getKondisiBadge(item.kondisi)}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 leading-snug">
                {item.namaBarang}
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-4">
                {item.deskripsi || "Tidak ada deskripsi detail mengenai barang ini."}
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center shrink-0 min-w-[150px]">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Stok Tersedia</p>
               <p className="text-4xl font-black text-slate-800">{item.jumlah}</p>
               <p className="text-xs font-semibold text-slate-500 mt-1">Unit / Buah</p>
            </div>
          </div>
        </div>

        {/* TABS (FOTO & KALENDER) */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px scrollbar-none mb-6">
          <button onClick={() => setActiveTab("foto")} className={`px-6 py-3.5 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "foto" ? "border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-sm" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            <Camera size={18} /> Galeri Foto
          </button>
          <button onClick={() => setActiveTab("kalender")} className={`px-6 py-3.5 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "kalender" ? "border-purple-600 text-purple-600 bg-white rounded-t-lg shadow-sm" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            <CalendarDays size={18} /> Jadwal Peminjaman
          </button>
        </div>

        {/* KONTEN TAB: FOTO */}
        {activeTab === "foto" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {(!item.fotoGroup || item.fotoGroup.length === 0) ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                <Camera size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="font-bold text-slate-700 text-lg">Foto Belum Tersedia</h3>
                <p className="text-sm text-slate-400 mt-1">Admin belum mengunggah foto untuk inventaris ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {item.fotoGroup.map((fotoUrl, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative w-full pt-[75%] bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                       {fotoUrl ? (
                         <img src={fotoUrl} alt={`Foto ${item.namaBarang} ${idx + 1}`} className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                       ) : (
                         <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">Gagal memuat foto</div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KONTEN TAB: KALENDER PEMINJAMAN */}
        {activeTab === "kalender" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-start gap-3">
               <Info className="text-purple-600 shrink-0 mt-0.5" size={18} />
               <div>
                 <h4 className="text-sm font-bold text-purple-900 mb-1">Informasi Peminjaman</h4>
                 <p className="text-xs text-purple-700 leading-relaxed">
                   Pastikan melihat jadwal kalender di bawah ini sebelum mengajukan peminjaman. Tanggal yang memiliki blok warna menandakan bahwa barang sedang dibooking/dipinjam pada hari tersebut. Hubungi pengurus administrasi untuk konfirmasi ketersediaan.
                 </p>
               </div>
             </div>

             {item.calendarUrl ? (
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full relative h-[600px] md:h-[700px]">
                 <iframe
                   src={item.calendarUrl}
                   style={{ border: 0, width: "100%", height: "100%" }}
                   frameBorder="0"
                   scrolling="no"
                 ></iframe>
               </div>
             ) : (
               <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                 <CalendarDays size={48} className="text-slate-300 mx-auto mb-4" />
                 <h3 className="font-bold text-slate-700 text-lg">Kalender Belum Diatur</h3>
                 <p className="text-sm text-slate-400 mt-1">Admin belum menautkan Google Calendar publik untuk barang ini.</p>
               </div>
             )}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}