"use client";
import React from "react";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, ArrowRight } from "lucide-react";

export default function Rayon() {
  // Tambahkan ID/Slug untuk rute dinamis dan ganti ikon dengan gambar (logoPublicId)
  const rayons = [
    {
      id: "ibnu-sina",
      nama: "Rayon Ibnu Sina",
      fakultas: "Fakultas Sains dan Teknologi",
      deskripsi: "Berfokus pada integrasi sains modern dengan nilai-nilai agama. Memiliki basis kajian teknologi dan eksakta yang kuat.",
      anggota: 85,
      warna: "border-blue-500",
      bg: "bg-blue-50",
      logoPublicId: "pmii/logo-rayon-1" // Ganti dengan ID Logo Rayon di Cloudinary
    },
    {
      id: "keadilan",
      nama: "Rayon Keadilan",
      fakultas: "Fakultas Syariah",
      deskripsi: "Garda terdepan dalam kajian hukum Islam dan perundang-undangan positif. Aktif dalam advokasi kebijakan publik.",
      anggota: 65,
      warna: "border-green-500",
      bg: "bg-green-50",
      logoPublicId: "pmii/logo-rayon-2" 
    },
    {
      id: "al-farabi",
      nama: "Rayon Al-Farabi",
      fakultas: "Fakultas Ilmu Tarbiyah dan Keguruan",
      deskripsi: "Pusat persemaian calon pendidik berkarakter. Menitikberatkan pada pengembangan metodologi pendidikan kritis.",
      anggota: 90,
      warna: "border-yellow-500",
      bg: "bg-yellow-50",
      logoPublicId: "pmii/logo-rayon-3" 
    }
  ];

  return (
    <main className="min-h-screen bg-[#f8f9fa] font-sans">
      <Navbar />

      <section className="pt-36 pb-20 px-4 bg-[#1e293b] text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Daftar <span className="text-[#facc15]">Rayon</span>
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto text-lg font-light">
          Kenali lebih dekat ujung tombak pergerakan PMII di tingkat Fakultas.
        </p>
      </section>

      <section className="py-20 px-4 max-w-6xl mx-auto mb-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {rayons.map((rayon, index) => (
            <Link href={`/rayon/${rayon.id}`} key={index} className="block group">
              <div className={`bg-white rounded-3xl shadow-lg border-t-8 ${rayon.warna} overflow-hidden group-hover:-translate-y-2 transition-transform duration-300 h-full flex flex-col`}>
                <div className={`${rayon.bg} p-8 text-center border-b border-slate-100 flex flex-col items-center`}>
                   
                   {/* Wadah Gambar / Logo Rayon */}
                   <div className="w-24 h-24 mb-4 relative rounded-full overflow-hidden bg-white shadow-sm border border-slate-200 flex justify-center items-center">
                     <span className="text-xs text-slate-400">Logo</span>
                     {/* Aktifkan CldImage jika gambar sudah diunggah */}
                     {/* <CldImage src={rayon.logoPublicId} fill alt={rayon.nama} className="object-cover" /> */}
                   </div>

                   <h2 className="text-2xl font-bold text-[#1e293b] mb-1">{rayon.nama}</h2>
                   <p className="text-sm font-semibold text-slate-500">{rayon.fakultas}</p>
                </div>
                <div className="p-8 flex-grow flex flex-col">
                   <p className="text-slate-600 mb-6 leading-relaxed text-sm flex-grow">
                     {rayon.deskripsi}
                   </p>
                   <div className="flex items-center justify-center gap-3 text-slate-700 font-bold mb-8 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <Users className="text-blue-500" size={20} />
                      <span>{rayon.anggota} Kader Aktif</span>
                   </div>
                   <div className="w-full border-2 border-slate-200 group-hover:border-[#1e293b] group-hover:bg-[#1e293b] group-hover:text-white text-slate-700 font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2">
                     Lihat Profil Rayon <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}