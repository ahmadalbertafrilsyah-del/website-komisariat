"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { MapPin, Users, BookOpen, ArrowLeft, Shield, ExternalLink, Hash, Compass, MessageCircle, Star, Target, FileText, Wallet, Map } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import Image from 'next/image';

export default function DetailRayonPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [rayonData, setRayonData] = useState(null);
  const [anggotaRayon, setAnggotaRayon] = useState([]);

  useEffect(() => {
    async function fetchDetailRayon() {
      try {
        if (!params.id) return;
        const urlId = decodeURIComponent(params.id).toLowerCase().replace(/-/g, " ");

        const docRayon = await getDoc(doc(db, "website_config", "database_rayon"));
        let foundRayon = null;
        
        if (docRayon.exists() && docRayon.data().listRayon) {
          const allRayon = docRayon.data().listRayon;
          foundRayon = allRayon.find(r => 
            r.nama.toLowerCase() === urlId || 
            r.nama.toLowerCase().replace(/[^a-z0-9]/g, "") === urlId.replace(/[^a-z0-9]/g, "")
          );
        }

        if (foundRayon) {
          setRayonData(foundRayon);
          
          const docAnggota = await getDoc(doc(db, "website_config", "database_anggota"));
          if (docAnggota.exists() && docAnggota.data().listAnggota) {
            const allAnggota = docAnggota.data().listAnggota;
            const filtered = allAnggota.filter(
              (a) => a.rayon && a.rayon.toLowerCase() === foundRayon.nama.toLowerCase()
            );
            setAnggotaRayon(filtered);
          }
        } else {
          setRayonData("NOT_FOUND");
        }
      } catch (error) {
        console.error("Gagal memuat detail rayon:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetailRayon();
  }, [params.id]);

  if (loading) return <LoadingScreen text="Mencari Profil Rayon" />;

  if (rayonData === "NOT_FOUND") {
    return (
      <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 flex flex-col items-center justify-center p-5">
        <Navbar />
        <div className="text-center mt-20">
          <Compass className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Rayon Tidak Ditemukan</h1>
          <button onClick={() => router.push('/rayon')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition flex items-center gap-2 mx-auto mt-4">
            <ArrowLeft size={18} /> Kembali ke Daftar Rayon
          </button>
        </div>
      </main>
    );
  }

  const PersonilCard = ({ jabatan, nama, wa, icon }) => (
    <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-200 dark:hover:border-blue-500 transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{jabatan}</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{nama || "Belum diisi"}</p>
        </div>
      </div>
      {wa && (
        <a 
          href={`https://wa.me/${wa.replace(/[^0-9]/g, "")}?text=Halo%20Sahabat/i%20${encodeURIComponent(nama)}`} 
          target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center shrink-0 transition-colors"
          title={`Chat ${jabatan}`}
        >
          <MessageCircle size={16} />
        </a>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 w-full overflow-x-hidden flex flex-col">
      <Navbar />

      <section className="relative pt-24 pb-32 md:pt-32 md:pb-48 bg-[#0f172a] overflow-hidden">
        {rayonData?.logoUrl ? (
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 blur-sm scale-150 pointer-events-none">
            <Image src={rayonData.logoUrl} alt={rayonData.nama} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent z-10"></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900 to-[#0f172a]"></div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-5 w-full">
          
          <div className="mb-6 md:mb-10 flex justify-between items-center">
            <button onClick={() => router.push('/rayon')} className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold w-max shrink-0">
              <ArrowLeft size={14} /> Kembali
            </button>
            
            {rayonData?.logoUrl && (
               <div className="relative w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 drop-shadow-xl overflow-hidden">
                 <Image src={rayonData.logoUrl} alt="Logo Rayon" fill className="object-contain p-2" />
               </div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 tracking-tight leading-snug">
              <span className="text-yellow-400">{rayonData?.nama}</span>
            </h1>
            
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 rounded-full mb-5 inline-flex items-center gap-1.5 w-max truncate backdrop-blur-sm">
              <BookOpen size={14} className="shrink-0" /> <span className="truncate">{rayonData?.fakultas || "Fakultas"}</span>
            </span>

            <p className="text-slate-300 text-sm md:text-lg max-w-3xl leading-relaxed italic border-l-4 border-yellow-400 pl-4 bg-white/5 py-2 pr-4 rounded-r-lg backdrop-blur-sm">
              "{rayonData?.deskripsi || "Berproses bersama mengawal pergerakan di tingkat fakultas dengan nilai-nilai Ahlussunnah Wal Jama'ah."}"
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-5 max-w-7xl mx-auto w-full -mt-16 md:-mt-20 relative z-20 mb-12">
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-700">
          
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 justify-between items-start lg:items-center pb-6 md:pb-8 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <MapPin size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Basecamp / Sekretariat</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm md:text-base leading-snug">{rayonData?.alamat || "Belum ditambahkan"}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
               <div className="bg-slate-50 dark:bg-slate-700/50 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-600 text-center w-full sm:w-auto flex flex-col justify-center min-h-[60px]">
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Kader</p>
                 <h2 className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">{anggotaRayon.length}</h2>
               </div>
               
               <div className="flex gap-2 w-full sm:w-auto h-full min-h-[60px]">
                 {rayonData?.igUrl && (
                   <a href={rayonData.igUrl} target="_blank" rel="noopener noreferrer" className="bg-slate-900 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-5 rounded-2xl transition-colors flex items-center justify-center gap-2 text-xs shadow-md flex-1">
                     Web/IG <ExternalLink size={14} />
                   </a>
                 )}
                 {rayonData?.mapUrl && (
                   <a href={rayonData.mapUrl} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold px-5 rounded-2xl transition-colors flex items-center justify-center gap-2 text-xs shadow-md flex-1">
                     Lokasi <Map size={14} />
                   </a>
                 )}
               </div>
            </div>
          </div>

          <div className="pt-6 md:pt-8">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-5 flex items-center gap-2">
              <Star size={20} className="text-yellow-500" /> Pengurus Inti Rayon
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <PersonilCard jabatan="Ketua Rayon" nama={rayonData?.ketua} wa={rayonData?.waKetua} icon={<Shield size={20}/>} />
              <PersonilCard jabatan="Sekretaris" nama={rayonData?.sekretaris} wa={rayonData?.waSekret} icon={<FileText size={20}/>} />
              <PersonilCard jabatan="Bendahara" nama={rayonData?.bendahara} wa={rayonData?.waBendum} icon={<Wallet size={20}/>} />
              <PersonilCard jabatan="CO Kaderisasi" nama={rayonData?.coKaderisasi} wa={rayonData?.waKaderisasi} icon={<Target size={20}/>} />
              <PersonilCard jabatan="CO Gerakan" nama={rayonData?.coGerakan} wa={rayonData?.waGerakan} icon={<Compass size={20}/>} />
            </div>
          </div>

        </div>
      </section>

      <section className="px-5 pb-20 max-w-7xl mx-auto w-full flex-grow">
        <div className="flex items-center gap-3 mb-6">
          <Users size={24} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Direktori Kader</h2>
        </div>

        {anggotaRayon.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-12 text-center max-w-xl mx-auto">
             <Users className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
             <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg">Belum Ada Kader Terdata</h3>
             <p className="text-sm text-slate-400 mt-1 leading-relaxed">Admin belum memasukkan nama-nama kader untuk rayon ini ke dalam sistem database pusat.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {anggotaRayon.map((kader, index) => (
              <motion.div key={`${kader.id || 'kader'}-${index}`} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-blue-100 dark:hover:border-blue-500 transition-all duration-300 flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-inner">{kader.nama.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 text-sm">{kader.nama}</h3>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase tracking-wider w-max mt-1.5">{kader.angkatan || "Tahun -"}</p>
                  </div>
                </div>
                <div className="space-y-2 mt-auto border-t border-slate-50 dark:border-slate-700 pt-3">
                  <div className="flex items-center gap-2 text-xs"><Hash size={14} className="text-slate-400 dark:text-slate-500 shrink-0" /><span className="text-slate-500 dark:text-slate-400 font-medium w-8 shrink-0">NIM</span><span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{kader.nim || "-"}</span></div>
                  <div className="flex items-center gap-2 text-xs"><Hash size={14} className="text-slate-400 dark:text-slate-500 shrink-0" /><span className="text-slate-500 dark:text-slate-400 font-medium w-8 shrink-0">NIA</span><span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{kader.nia || "-"}</span></div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}