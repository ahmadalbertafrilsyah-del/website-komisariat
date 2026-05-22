"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { Search, GraduationCap, MapPin, Briefcase, Calendar } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function AlumniPage() {
  const [loading, setLoading] = useState(true);
  const [alumniData, setAlumniData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchAlumni() {
      try {
        const docRef = doc(db, "website_config", "database_alumni");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().listAlumni) {
          setAlumniData(docSnap.data().listAlumni);
        }
      } catch (error) {
        console.error("Gagal menarik data alumni:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAlumni();
  }, []);

  const filteredData = alumniData.filter(item => 
    (item.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.profesi || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingScreen text="Memuat Direktori Alumni" />;

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 flex flex-col">
      <Navbar />

      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-5 bg-[#0f172a] text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.span initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-400 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-5 inline-flex items-center justify-center gap-2 w-max backdrop-blur-sm">
            <GraduationCap size={14} /> Jaringan Profesional Kader
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Direktori <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">Alumni</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-300 text-sm md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Menelusuri jejak langkah dan dedikasi sahabat/i PMII Komisariat yang telah berkiprah di berbagai profesi dan instansi.
          </motion.p>
        </div>
      </section>

      <section className="px-5 max-w-6xl mx-auto w-full -mt-10 md:-mt-12 relative z-20">
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center relative">
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau profesi..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
          <Search className="absolute left-7 h-5 w-5 text-slate-400" />
        </div>
      </section>

      <section className="py-16 px-5 max-w-6xl mx-auto w-full flex-grow">
        {filteredData.length === 0 ? (
           <div className="text-center text-slate-400 py-10"><GraduationCap size={48} className="mx-auto mb-4 opacity-50"/>Belum ada data alumni.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredData.map((alumni, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                 <div className="w-full h-56 bg-slate-200 relative overflow-hidden">
                    {alumni.foto ? (
                      <img src={alumni.foto} alt={alumni.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400"><GraduationCap size={40}/></div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                       <h3 className="text-white font-extrabold text-lg leading-tight line-clamp-2">{alumni.nama}</h3>
                    </div>
                 </div>
                 <div className="p-5 flex flex-col gap-3 flex-grow bg-white">
                    <div className="flex items-start gap-2.5">
                       <div className="mt-0.5 bg-emerald-50 p-1.5 rounded-lg text-emerald-600"><Briefcase size={14}/></div>
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profesi</p>
                         <p className="font-bold text-emerald-700 text-sm leading-snug">{alumni.profesi || "Belum diisi"}</p>
                       </div>
                    </div>
                    <div className="w-full h-px bg-slate-50"></div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                       <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md"><Calendar size={12}/> Mapaba: {alumni.tahunMapaba || "-"}</span>
                       <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md truncate max-w-[120px]"><MapPin size={12}/> {alumni.asalRayon || "-"}</span>
                    </div>
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