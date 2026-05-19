"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Users, Calendar, Shield, Target, Compass, MessageSquare, Award, FileText, CheckCircle2, Clock } from "lucide-react";

export default function DetailRayon() {
  const params = useParams(); 
  // State untuk mengatur konten mana yang aktif di sebelah kanan ('profil' atau 'proker')
  const [activeTab, setActiveTab] = useState("profil");
  
  const rayonDatabase = {
    "ibnu-sina": {
      nama: "Rayon Ibnu Sina",
      fakultas: "Fakultas Sains dan Teknologi",
      deskripsi: "Rayon Ibnu Sina diperuntukkan bagi mahasiswa Saintek yang berfokus pada integrasi sains modern dengan nilai-nilai agama, serta pengabdian masyarakat di bidang teknologi tepat guna.",
      logo: "pmii/logo-ibnu-sina",
      instagram: "@pmii.ibnusina",
      pengurus: {
        ketua: "Ahmad Rosikhul Fahmi",
        sekretaris: "Siti Aisyah",
        bendahara: "Putri Khadijah",
        jumlahAnggota: "85 Orang",
        tahunBerdiri: "2015",
        whatsapp: "6281234567890" // Ganti dengan nomor WA Ketua asli (awali dengan 62)
      },
      visi: "Membangun kader saintis muslim yang transformatif dan berwawasan global berlandaskan Aswaja.",
      misi: [
        "Meningkatkan budaya literasi dan riset.",
        "Mengembangkan inovasi teknologi tepat guna untuk masyarakat.",
        "Membentuk karakter kader yang religius dan toleran."
      ],
      // Simulasi data dari excel proker
      programKerja: [
        { no: 1, agenda: "Kajian Sains & Islam (KSI)", bidang: "Biro Keagamaan", waktu: "Setiap Bulan", status: "Berjalan" },
        { no: 2, agenda: "Pelatihan Coding & Web basic", bidang: "Biro Iptek", waktu: "Juni 2026", status: "Selesai" },
        { no: 3, agenda: "Saintek Berbagi & Bakti Desa", bidang: "Biro Sosial", waktu: "Agustus 2026", status: "Direncanakan" },
      ]
    },
    "keadilan": {
      nama: "Rayon Keadilan",
      fakultas: "Fakultas Syariah",
      deskripsi: "Garda terdepan dalam kajian hukum Islam dan perundang-undangan positif. Mengawal isu-isu hukum dan advokasi kebijakan publik di kampus dan masyarakat.",
      logo: "pmii/logo-keadilan",
      instagram: "@pmii.keadilan",
      pengurus: {
        ketua: "Bima Arya",
        sekretaris: "Dian Sastro",
        bendahara: "Nabila Maharani",
        jumlahAnggota: "65 Orang",
        tahunBerdiri: "2016",
        whatsapp: "6289876543210"
      },
      visi: "Menjadi kawah candradimuka bagi kader hukum yang adil dan progresif.",
      misi: ["Pendampingan hukum masyarakat.", "Kajian rutin konstitusi.", "Advokasi kebijakan."],
      programKerja: [
        { no: 1, agenda: "Mochtar Kusumaatmadja Law Discussion", bidang: "Kajian Hukum", waktu: "Juli 2026", status: "Direncanakan" },
        { no: 2, agenda: "Penyuluhan Hukum Kesadaran Warga", bidang: "Advokasi & HAM", waktu: "Mei 2026", status: "Selesai" },
      ]
    },
    "al-farabi": {
      nama: "Rayon Al-Farabi",
      fakultas: "Fakultas Ilmu Tarbiyah dan Keguruan",
      deskripsi: "Pusat persemaian calon pendidik berkarakter. Menitikberatkan pada pengembangan metodologi pendidikan kritis.",
      logo: "pmii/logo-alfarabi",
      instagram: "@pmii.alfarabi",
      pengurus: {
        ketua: "Hasan Basri",
        sekretaris: "Nisa Sabyan",
        bendahara: "Ahmad Dani",
        jumlahAnggota: "90 Orang",
        tahunBerdiri: "2014",
        whatsapp: "628555555555"
      },
      visi: "Mencetak pendidik profesional yang berakhlakul karimah.",
      misi: ["Inovasi metode pembelajaran.", "Pendampingan sekolah marjinal.", "Kajian pendidikan kritis."],
      programKerja: [
        { no: 1, agenda: "Farabi Mengajar (Kader Mengabdi)", bidang: "Minat Bakat", waktu: "Juli 2026", status: "Direncanakan" },
      ]
    }
  };

  const data = rayonDatabase[params.id] || rayonDatabase["ibnu-sina"];

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        
        <Link href="/rayon" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-8 transition-colors group">
           <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar Rayon
        </Link>

        {/* Kotak Grid Utama */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          
          {/* ================= KOLOM KIRI: IDENTITAS & AKSI ================= */}
          <div className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-8 flex flex-col items-center lg:items-start">
              
              <div className="w-32 h-32 relative rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-6 shadow-sm">
                <span className="text-slate-400 text-xs font-medium">Logo Rayon</span>
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">
                Unit Pergerakan
              </span>
              
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2">
                {data.nama}
              </h1>
              <p className="text-sm font-semibold text-slate-500 mb-5">
                {data.fakultas}
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 text-center lg:text-left">
                {data.deskripsi}
              </p>

              {/* Tombol Instagram */}
              <a 
                href={`https://instagram.com/${data.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold py-3 px-6 rounded-xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-md shadow-pink-500/10 mb-6"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                {data.instagram}
              </a>

              <div className="w-full h-px bg-slate-100 mb-6"></div>

              {/* ================= TOMBOL AKSI AKTIF ================= */}
              <div className="w-full space-y-2.5">
                {/* 1. Tombol Hubungi Ketua Rayon -> Redirect ke API WA */}
                <a 
                  href={`https://wa.me/${data.pengurus.whatsapp}?text=Assalamualaikum%20Sahabat%20Ketua%20${encodeURIComponent(data.nama)},%20saya%20ingin%20berkoordinasi...`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold text-left transition flex items-center justify-between group block"
                >
                  <span>Hubungi Ketua Rayon</span>
                  <MessageSquare size={16} className="text-slate-400 group-hover:text-slate-600 transition" />
                </a>

                {/* 2. Tombol Program Kerja -> Mengubah State Tampilan Kanan */}
                <button 
                  onClick={() => setActiveTab(activeTab === "proker" ? "profil" : "proker")}
                  className={`w-full py-3 px-4 border text-sm font-semibold rounded-xl text-left transition flex items-center justify-between group ${
                    activeTab === "proker" 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <span>{activeTab === "proker" ? "Lihat Profil Rayon" : "Program Kerja"}</span>
                  <Compass size={16} className={activeTab === "proker" ? "text-white" : "text-slate-400 group-hover:text-slate-600"} />
                </button>
              </div>

            </div>
          </div>

          {/* ================= KOLOM KANAN: KONTEN DINAMIS (BERUBAH BERDASARKAN TAB) ================= */}
          <div className="lg:col-span-2 space-y-6">
            
            {activeTab === "profil" ? (
              <>
                {/* TAMPILAN 1: STRUKTUR & VISI MISI ASLI */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-6 md:p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Award size={20} className="text-blue-600" /> Struktur & Informasi Inti
                  </h3>
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl flex items-center justify-between shadow-md">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-400 block mb-1">Pimpinan Utama</span>
                        <h4 className="text-lg font-bold">{data.pengurus.ketua}</h4>
                        <p className="text-xs text-slate-300 mt-0.5">Ketua Rayon</p>
                      </div>
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                        <Shield size={22} className="text-yellow-400" />
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Administrasi</span>
                      <h4 className="font-bold text-slate-900 text-sm">{data.pengurus.sekretaris}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Sekretaris Rayon</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Keuangan</span>
                      <h4 className="font-bold text-slate-900 text-sm">{data.pengurus.bendahara}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Bendahara Rayon</p>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-100/50 p-5 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block mb-1">Kekuatan Kader</span>
                        <h4 className="font-extrabold text-blue-900 text-base">{data.pengurus.jumlahAnggota}</h4>
                      </div>
                      <Users size={18} className="text-blue-500" />
                    </div>

                    <div className="sm:col-span-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> Berdiri Sejak Tahun {data.pengurus.tahunBerdiri}</span>
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold">#MasaKhidmat2026</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-6 md:p-8 space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Target size={20} className="text-blue-600" /> Visi Perjuangan
                    </h3>
                    <div className="bg-slate-50 border-l-4 border-blue-600 p-6 rounded-r-2xl">
                      <p className="text-base font-medium text-slate-700 italic leading-relaxed">
                        "{data.visi}"
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Compass size={20} className="text-blue-600" /> Manifes Misi Gerakan
                    </h3>
                    <div className="grid gap-3">
                      {data.misi.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl">
                          <div className="w-7 h-7 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed pt-0.5">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ================= TAMPILAN 2: TABEL PROGRAM KERJA (EXCEL RENDERING) ================= */
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-6 md:p-8 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FileText size={22} className="text-blue-600" /> Database Program Kerja
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Sistem sinkronisasi dokumen kerja eksternal Rayon.</p>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-3 py-1.5 rounded-lg">
                     Terintegrasi Dokumen Excel Admin
                  </span>
                </div>

                {/* Konstruksi Tabel */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#1e293b] text-white text-xs uppercase tracking-wider">
                        <th className="py-4 px-4 text-center font-bold w-12">No</th>
                        <th className="py-4 px-6 font-semibold">Nama Agenda Kegiatan</th>
                        <th className="py-4 px-6 font-semibold">Pelaksana / Biro</th>
                        <th className="py-4 px-6 font-semibold">Target Waktu</th>
                        <th className="py-4 px-6 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 text-xs divide-y divide-slate-100">
                      {data.programKerja.map((proker, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">{proker.no}</td>
                          <td className="py-4 px-6 font-bold text-slate-900">{proker.agenda}</td>
                          <td className="py-4 px-6 text-slate-600">{proker.bidang}</td>
                          <td className="py-4 px-6 text-slate-500 font-medium">{proker.waktu}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                              proker.status === 'Selesai' ? 'bg-green-100 text-green-700' : 
                              proker.status === 'Berjalan' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {proker.status === 'Selesai' && <CheckCircle2 size={12} />}
                              {proker.status === 'Berjalan' && <Clock size={12} />}
                              {proker.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Kotak Informasi Tambahan untuk Pengurus Admin */}
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
                  💡 <strong>Catatan Admin:</strong> Lembar kerja ini bersifat dinamis. Pembaruan data dilakukan oleh pengurus komisariat melalui fitur ekspor/unggah berkas format <code>.xlsx</code> / CSV di halaman panel administrasi kontrol utama.
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}