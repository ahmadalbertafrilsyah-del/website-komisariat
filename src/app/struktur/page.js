"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Hash, MapPin, Calendar, Award, Shield, Users, Briefcase } from "lucide-react";

export default function StrukturPage() {
  const [selectedPengurus, setSelectedPengurus] = useState(null);

  // ================= DATA STRUKTUR KEPENGURUSAN (DINAMIS) =================
  // Data dibuat berkelompok (BPH, Biro Kaderisasi, Biro Keagamaan, dst)
  const strukturData = [
    {
      kategori: "Badan Pengurus Harian (BPH)",
      ikon: <Shield size={22} className="text-blue-600" />,
      anggota: [
        { 
          nama: "Muhammad Faiz Hadi", 
          jabatan: "Ketua Komisariat", 
          nim: "220101044", 
          nia: "04.03.22.001", 
          rayon: "Rayon Ibnu Sina", 
          angkatan: "2022", 
          whatsapp: "6281234567890",
          foto: "https://i.pravatar.cc/300?u=faiz" // Contoh foto ada
        },
        { 
          nama: "Abdullah Massaid", 
          jabatan: "Wakil Ketua I", 
          nim: "220202155", 
          nia: "04.03.22.012", 
          rayon: "Rayon Keadilan", 
          angkatan: "2022", 
          whatsapp: "628987654321",
          foto: "https://i.pravatar.cc/300?u=abdullah" 
        },
        { 
          nama: "Fajar Ardiansyah", 
          jabatan: "Wakil Ketua II", 
          nim: "220303088", 
          nia: "04.03.22.019", 
          rayon: "Rayon Al-Farabi", 
          angkatan: "2022", 
          whatsapp: "628555555555",
          foto: "https://i.pravatar.cc/300?u=fajar" 
        },
        { 
          nama: "Siti Nurhaliza", 
          jabatan: "Bendahara Umum", 
          nim: "230401022", 
          nia: "04.03.23.007", 
          rayon: "Rayon Keadilan", 
          angkatan: "2023", 
          whatsapp: "628222222222",
          foto: "https://i.pravatar.cc/300?u=siti" 
        }
      ]
    },
    {
      kategori: "Biro Kaderisasi & Pengembangan",
      ikon: <Users size={22} className="text-blue-600" />,
      anggota: [
        { 
          nama: "Ahmad Rizki", 
          jabatan: "Ketua Biro", 
          nim: "230102001", 
          nia: "04.03.23.050", 
          rayon: "Rayon Al-Farabi", 
          angkatan: "2023", 
          whatsapp: "628111222333",
          foto: "" // Contoh jika foto kosong (Akan otomatis menampilkan Inisial "A")
        },
        { 
          nama: "Nabila Syakieb", 
          jabatan: "Anggota Biro", 
          nim: "240103002", 
          nia: "04.03.24.011", 
          rayon: "Rayon Ibnu Sina", 
          angkatan: "2024", 
          whatsapp: "628333444555",
          foto: "https://i.pravatar.cc/300?u=nabila" 
        }
      ]
    },
    {
      kategori: "Biro Media & Informasi (Kominfo)",
      ikon: <Briefcase size={22} className="text-blue-600" />,
      anggota: [
        { 
          nama: "Bintang Pamungkas", 
          jabatan: "Ketua Biro", 
          nim: "220505055", 
          nia: "04.03.22.088", 
          rayon: "Rayon Ibnu Sina", 
          angkatan: "2022", 
          whatsapp: "628999888777",
          foto: "https://i.pravatar.cc/300?u=bintang" 
        }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      <Navbar />

      {/* 1. BANNER ATAS UTAMA */}
      <section className="pt-28 md:pt-36 pb-12 md:pb-16 px-4 bg-[#1e293b] text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-yellow-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mb-4 inline-block">
            Masa Khidmat 2026-2027
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Struktur <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Kepengurusan</span>
          </h1>
          <p className="text-slate-300 text-xs md:text-sm font-light max-w-xl mx-auto leading-relaxed">
            Nakhoda pergerakan PMII Komisariat yang berkomitmen membawa organisasi bergerak progresif dan inklusif.
          </p>
        </div>
      </section>

      {/* 2. AREA KONTEN (RENDERING DINAMIS PER KATEGORI) */}
      <section className="py-12 md:py-16 px-4 max-w-6xl mx-auto min-h-screen">
        
        {strukturData.map((divisi, divIndex) => (
          <div key={divIndex} className="mb-16 md:mb-20">
            {/* Header Kategori */}
            <div className="flex flex-col items-center mb-8 md:mb-10 text-center">
              <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 mb-2 flex items-center justify-center gap-2 md:gap-3">
                {divisi.ikon} {divisi.kategori}
              </h2>
              <div className="w-16 h-1 bg-blue-600 rounded-full mt-2"></div>
            </div>

            {/* Grid Kartu Pengurus */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {divisi.anggota.map((item, memberIndex) => (
                <motion.div 
                  key={memberIndex} 
                  onClick={() => setSelectedPengurus(item)} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: memberIndex * 0.1 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  {/* Area Foto Profil */}
                  <div className="relative h-44 sm:h-56 w-full bg-slate-100 flex items-center justify-center border-b border-slate-100 overflow-hidden">
                    {item.foto ? (
                      // Jika foto ada
                      <img 
                        src={item.foto} 
                        alt={item.nama} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      // Jika foto kosong (Fallback Inisial)
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 text-2xl font-bold uppercase shadow-sm group-hover:scale-105 transition-transform duration-500">
                        {item.nama.charAt(0)}
                      </div>
                    )}
                    
                    {/* Overlay Hitam Transparan saat di-hover */}
                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-300"></div>
                    
                    <span className="absolute bottom-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-slate-900/70 text-white px-2.5 py-1 rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Lihat Profil
                    </span>
                  </div>
                  
                  {/* Info Jabatan */}
                  <div className="p-4 md:p-5 text-center border-t-4 border-[#facc15] flex-grow flex flex-col justify-center bg-white z-10">
                    <h4 className="font-extrabold text-slate-900 text-xs md:text-sm leading-tight mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {item.nama}
                    </h4>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {item.jabatan}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ================= 3. POPUP MODAL IDENTITAS DIRI ================= */}
      <AnimatePresence>
        {selectedPengurus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPengurus(null)} 
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 w-full max-w-md relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="bg-[#1e293b] text-white p-4 md:p-5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-yellow-400" />
                  <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-200">Kartu Identitas Kader</span>
                </div>
                <button 
                  onClick={() => setSelectedPengurus(null)}
                  className="text-slate-400 hover:text-white transition p-1.5 bg-white/5 rounded-lg border border-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Area Isi Data Identitas (Bisa di-scroll jika layar terlalu kecil) */}
              <div className="p-5 md:p-8 space-y-5 overflow-y-auto hide-scrollbar">
                
                {/* Visual Avatar Atas */}
                <div className="flex flex-col items-center border-b border-slate-100 pb-5 mb-2 text-center">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-slate-100 mb-4 shadow-xl border-4 border-white shadow-slate-200 flex items-center justify-center text-4xl font-black text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                    {selectedPengurus.foto ? (
                      <img src={selectedPengurus.foto} alt={selectedPengurus.nama} className="w-full h-full object-cover" />
                    ) : (
                      selectedPengurus.nama.charAt(0)
                    )}
                  </div>
                  <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight px-2">{selectedPengurus.nama}</h3>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mt-2.5 shadow-sm">
                    {selectedPengurus.jabatan}
                  </span>
                </div>

                {/* List Data Diri */}
                <div className="space-y-3 text-xs md:text-sm">
                  <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 transition hover:border-blue-200">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Hash size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">NIM / NIA PMII</p>
                      <p className="font-bold text-slate-700 mt-0.5">
                        {selectedPengurus.nim} <span className="text-slate-300 mx-1">|</span> <span className="text-blue-700 font-mono">{selectedPengurus.nia}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 transition hover:border-blue-200">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Asal Rayon Komisariat</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedPengurus.rayon}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 transition hover:border-blue-200">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Calendar size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Angkatan Kaderisasi</p>
                      <p className="font-bold text-slate-700 mt-0.5">Kader Tahun {selectedPengurus.angkatan}</p>
                    </div>
                  </div>
                </div>

                {/* Tombol Kontak Whatsapp */}
                <div className="pt-2">
                  <a 
                    href={`https://wa.me/${selectedPengurus.whatsapp}?text=Assalamualaikum%20Sahabat%20${encodeURIComponent(selectedPengurus.nama)},%20selaku%20${encodeURIComponent(selectedPengurus.jabatan)}%20PMII%20Komisariat...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs md:text-sm font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <MessageSquare size={16} /> Hubungi via WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}