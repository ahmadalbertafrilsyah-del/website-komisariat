"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { FileText, Calendar, Download, Send, Clock, CheckCircle2, FolderOpen, Search, ArrowRight } from "lucide-react";

export default function AdministrasiPage() {
  // State untuk mengatur tab mana yang sedang aktif
  const [activeTab, setActiveTab] = useState("surat"); // 'surat' atau 'proker'
  const [searchQuery, setSearchQuery] = useState("");

  // ================= DATA DUMMY SURAT KELUAR =================
  const dataSuratKeluar = [
    { id: 1, noSurat: "015.PMII.Kom-UIN.IV.2026", tanggal: "12 April 2026", tujuan: "PC PMII Kota Malang", perihal: "Permohonan Pemateri", status: "Terkirim" },
    { id: 2, noSurat: "016.PMII.Kom-UIN.IV.2026", tanggal: "14 April 2026", tujuan: "Dekanat Saintek", perihal: "Peminjaman Gedung", status: "Proses" },
    { id: 3, noSurat: "017.PMII.Kom-UIN.IV.2026", tanggal: "18 April 2026", tujuan: "Rayon Se-Komisariat", perihal: "Undangan Rapat Koordinasi", status: "Terkirim" },
    { id: 4, noSurat: "018.PMII.Kom-UIN.V.2026", tanggal: "02 Mei 2026", tujuan: "Alumni & Mabinkom", perihal: "Undangan Halal Bihalal", status: "Menunggu Acc" },
  ];

  // ================= DATA DUMMY PROGRAM KERJA =================
  const dataProker = [
    { id: 1, nama: "Pelatihan Administrasi & Kesekretariatan", biro: "Sekretaris", waktu: "Mei 2026", status: "Belum Mulai" },
    { id: 2, nama: "Kajian Rutin Keislaman (KARISMA)", biro: "Biro Keagamaan", waktu: "Minggu Ke-2 Tiap Bulan", status: "Berjalan" },
    { id: 3, nama: "Sekolah Jurnalistik & Jaringan (SJJ)", biro: "Biro Kominfo", waktu: "Juni 2026", status: "Persiapan" },
    { id: 4, nama: "PMII Mengabdi (Bakti Sosial Pedesaan)", biro: "Biro Pengabdian", waktu: "Agustus 2026", status: "Belum Mulai" },
    { id: 5, nama: "Rapat Kerja Tahunan (Rakerkom)", biro: "BPH", waktu: "Maret 2026", status: "Selesai" },
  ];

  // Fungsi Filter Pencarian
  const filteredSurat = dataSuratKeluar.filter(item => 
    item.perihal.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.tujuan.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredProker = dataProker.filter(item => 
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.biro.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      <Navbar />

      {/* ================= 1. BANNER HERO ================= */}
      <section className="pt-28 md:pt-36 pb-12 md:pb-16 px-4 bg-[#1e293b] text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mb-4 inline-block flex items-center justify-center gap-1.5 w-max mx-auto">
            <FolderOpen size={12} />
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Pusat <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-blue-400">Administrasi</span>
          </h1>
          <p className="text-slate-300 text-xs md:text-sm font-light max-w-xl mx-auto leading-relaxed">
            Transparansi rekam jejak surat menyurat dan progres pelaksanaan program kerja PMII Komisariat.
          </p>
        </div>
      </section>

      {/* ================= 2. KONTROL TAB & PENCARIAN ================= */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100">
          
          {/* Tombol Switcher (Tab) */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setActiveTab("surat")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === "surat" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileText size={16} /> Arsip Surat
            </button>
            <button 
              onClick={() => setActiveTab("proker")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === "proker" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Calendar size={16} /> Program Kerja
            </button>
          </div>

          {/* Kolom Pencarian */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${activeTab === 'surat' ? 'tujuan/perihal' : 'nama program'}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          </div>

        </div>
      </section>

      {/* ================= 3. AREA TABEL DATA (RESPONSIF) ================= */}
      <section className="pb-20 px-4 max-w-6xl mx-auto min-h-[50vh]">
        <motion.div 
          key={activeTab} // Kunci untuk mereset animasi saat tab berubah
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden"
        >
          
          {/* =========== TABEL SURAT KELUAR =========== */}
          {activeTab === "surat" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="py-4 px-6 font-bold w-12 text-center">No</th>
                    <th className="py-4 px-6 font-bold">Nomor & Tanggal Surat</th>
                    <th className="py-4 px-6 font-bold">Tujuan</th>
                    <th className="py-4 px-6 font-bold">Perihal</th>
                    <th className="py-4 px-6 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 text-xs md:text-sm divide-y divide-slate-100">
                  {filteredSurat.length > 0 ? filteredSurat.map((surat, index) => (
                    <tr key={surat.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-4 px-6 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-blue-700">{surat.noSurat}</div>
                        <div className="text-[10px] md:text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar size={12}/> {surat.tanggal}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{surat.tujuan}</td>
                      <td className="py-4 px-6 text-slate-600">{surat.perihal}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          surat.status === 'Terkirim' ? 'bg-emerald-100 text-emerald-700' : 
                          surat.status === 'Proses' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {surat.status === 'Terkirim' && <Send size={10} />}
                          {surat.status === 'Proses' && <Clock size={10} />}
                          {surat.status === 'Menunggu Acc' && <FileText size={10} />}
                          {surat.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="py-10 text-center text-slate-400">Data surat tidak ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* =========== TABEL PROGRAM KERJA =========== */}
          {activeTab === "proker" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="py-4 px-6 font-bold w-12 text-center">No</th>
                    <th className="py-4 px-6 font-bold">Nama Program / Kegiatan</th>
                    <th className="py-4 px-6 font-bold">Pelaksana (Biro)</th>
                    <th className="py-4 px-6 font-bold">Target Waktu</th>
                    <th className="py-4 px-6 font-bold text-center">Progres</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 text-xs md:text-sm divide-y divide-slate-100">
                  {filteredProker.length > 0 ? filteredProker.map((proker, index) => (
                    <tr key={proker.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-4 px-6 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                      <td className="py-4 px-6 font-bold text-slate-900">{proker.nama}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold">
                          {proker.biro}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">{proker.waktu}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          proker.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 
                          proker.status === 'Berjalan' || proker.status === 'Persiapan' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {proker.status === 'Selesai' && <CheckCircle2 size={12} />}
                          {(proker.status === 'Berjalan' || proker.status === 'Persiapan') && <Clock size={12} />}
                          {proker.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="py-10 text-center text-slate-400">Data program kerja tidak ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </motion.div>

        {/* Info Tambahan */}
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs text-slate-400">
          <p>💡 Menampilkan data secara *real-time* berdasarkan arsip kesekretariatan.</p>
          <a href="#" className="flex items-center gap-1 hover:text-blue-600 transition">
            Unduh Laporan Format PDF <Download size={14} />
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}