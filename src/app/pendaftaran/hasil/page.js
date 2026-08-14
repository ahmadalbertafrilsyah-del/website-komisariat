"use client";
import React, { useState, useEffect, Suspense } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Users, Download, ExternalLink, Loader2, CheckCircle2, Clock, XCircle, Search, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";

function HasilPendaftaranContent() {
  const searchParams = useSearchParams();
  const formIdentifier = searchParams.get("form");

  const [loading, setLoading] = useState(true);
  const [formConfig, setFormConfig] = useState(null);
  const [pendaftar, setPendaftar] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  useEffect(() => {
    if (!formIdentifier) {
      setErrorMsg("Link pendaftaran tidak valid.");
      setLoading(false);
      return;
    }

    let unsubscribeForm = null;
    let unsubscribePendaftar = null;

    async function initRealTimeData() {
      try {
        const qForm = query(collection(db, "formulir_kaderisasi"));
        const snapForm = await getDocs(qForm);
        const matchedForm = snapForm.docs.find(d => d.id === formIdentifier || d.data().slug === formIdentifier);

        if (!matchedForm) {
          setErrorMsg("Formulir tidak ditemukan atau sudah dihapus.");
          setLoading(false);
          return;
        }

        const formId = matchedForm.id;

        unsubscribeForm = onSnapshot(doc(db, "formulir_kaderisasi", formId), (docSnap) => {
          if (docSnap.exists()) {
            setFormConfig({ id: docSnap.id, ...docSnap.data() });
          }
        });

        const qPendaftar = query(collection(db, "data_pendaftar"), where("formId", "==", formId));
        unsubscribePendaftar = onSnapshot(qPendaftar, (snapshot) => {
          let dataPend = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          dataPend.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
          setPendaftar(dataPend);
          setLoading(false); 
        });

      } catch (error) {
        setErrorMsg("Terjadi kesalahan sistem: " + error.message);
        setLoading(false);
      }
    }

    initRealTimeData();

    return () => {
      if (unsubscribeForm) unsubscribeForm();
      if (unsubscribePendaftar) unsubscribePendaftar();
    };
  }, [formIdentifier]);

  const filteredPendaftar = pendaftar.filter((p) => {
    if (statusFilter !== "Semua") {
      const currentStatus = p.statusLulus || "Pending";
      if (statusFilter !== currentStatus) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchString = Object.values(p.answers || {}).join(" ").toLowerCase();
      const statusStr = (p.statusLulus || "pending").toLowerCase();
      
      if (!searchString.includes(q) && !statusStr.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleExportExcel = () => {
    if (!filteredPendaftar.length) return alert("Tidak ada data yang sesuai filter untuk diekspor!");

    const formattedData = filteredPendaftar.map((p, index) => {
      let baseData = {
        "No": index + 1,
        "Tanggal Daftar": p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString('id-ID') : "-",
        "Status Seleksi": p.statusLulus || "Pending",
      };

      if (formConfig?.customQuestions && p.answers) {
        formConfig.customQuestions.forEach(q => {
          if (p.answers[q.question] !== undefined) {
            baseData[q.question] = p.answers[q.question];
          }
        });
      }
      return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pendaftar");
    XLSX.writeFile(workbook, `Tabel_Hasil_${formConfig.slug}.xlsx`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Lulus": return <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 w-max shadow-sm"><CheckCircle2 size={14}/> Lulus</span>;
      case "Ditolak": return <span className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 w-max shadow-sm"><XCircle size={14}/> Ditolak</span>;
      default: return <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 w-max shadow-sm"><Clock size={14}/> Pending</span>;
    }
  };

  if (loading) return <LoadingScreen text="Memuat Tabel Publik..." />;

  if (errorMsg) return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-slate-900">
      <Navbar />
      <div className="flex-grow flex items-center justify-center pt-20">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Akses Ditolak</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{errorMsg}</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* HEADER PANEL */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block shadow-sm">
              Akses Publik Real-Time
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug max-w-2xl">{formConfig.judul}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Users size={14}/> {pendaftar.length} Total Pendaftar</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><ClipboardList size={14}/> Kategori: {formConfig.kategori}</p>
              {formConfig.status === 'Tutup' && (
                <p className="text-xs font-bold text-red-500 dark:text-red-400 flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-100 dark:border-red-800/50">
                  <XCircle size={12}/> Pendaftaran Ditutup
                </p>
              )}
            </div>
          </div>
          <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm w-full md:w-auto shrink-0">
            <Download size={16} /> Unduh Excel
          </button>
        </div>

        {/* TABEL AREA */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* TOOLBAR: PENCARIAN & FILTER */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500"/>
                <input 
                  type="text" 
                  placeholder="Cari nama, NIM, asal rayon..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                />
             </div>
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 w-full sm:w-auto focus-within:ring-1 focus-within:ring-blue-500 transition">
                  <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0"/>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm text-slate-700 dark:text-slate-200 outline-none bg-transparent w-full cursor-pointer font-medium"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Lulus">Lulus / Diterima</option>
                    <option value="Pending">Pending</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
             </div>
          </div>

          {/* TABEL DATA FORMAL */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-4 px-5 text-center w-16">No</th>
                  <th className="py-4 px-5">Waktu Daftar</th>
                  <th className="py-4 px-5">Status Kelulusan</th>
                  {formConfig.customQuestions?.map(q => (
                    <th key={q.id} className="py-4 px-5 truncate max-w-[200px]">{q.question}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                {filteredPendaftar.length === 0 ? (
                  <tr>
                    <td colSpan={3 + (formConfig.customQuestions?.length || 0)} className="py-16 text-center text-slate-500 dark:text-slate-400 font-medium">
                      {pendaftar.length === 0 ? "Belum ada data pendaftar yang masuk." : "Tidak ada data yang sesuai dengan pencarian/filter."}
                    </td>
                  </tr>
                ) : (
                  filteredPendaftar.map((p, index) => {
                    const date = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : "-";
                    
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-3 px-5 text-center text-slate-500 dark:text-slate-400 font-medium">{index + 1}</td>
                        <td className="py-3 px-5 text-xs text-slate-500 dark:text-slate-400">{date}</td>
                        <td className="py-3 px-5">{getStatusBadge(p.statusLulus)}</td>
                        
                        {formConfig.customQuestions?.map(q => {
                          const jawaban = p.answers ? p.answers[q.question] : "-";
                          const isFile = q.type === 'file' || (typeof jawaban === 'string' && jawaban.startsWith('http'));
                          
                          return (
                            <td key={q.id} className="py-3 px-5">
                              {isFile && jawaban && jawaban !== "-" ? (
                                <a href={jawaban} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-semibold flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-md transition w-max border border-blue-200 dark:border-blue-800/50 shadow-sm">
                                  <ExternalLink size={14}/> Lihat File
                                </a>
                              ) : (
                                <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[250px] block" title={jawaban}>{jawaban || "-"}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* FOOTER TABEL (SUMMARY) */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 font-medium flex justify-between items-center">
            Menampilkan {filteredPendaftar.length} dari total {pendaftar.length} pendaftar
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function HasilPendaftaranPage() {
  return (
    <Suspense fallback={<LoadingScreen text="Memuat Tabel Publik..." />}>
      <HasilPendaftaranContent />
    </Suspense>
  );
}