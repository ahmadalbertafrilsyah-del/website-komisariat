"use client";
import React, { useState, useEffect, Suspense } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Users, Download, ExternalLink, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import * as XLSX from "xlsx";

// Sesuaikan path import komponen ini dengan struktur folder Anda!
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
        // 1. Cari Formulir Berdasarkan ID atau Slug (Sekali panggil untuk dapatkan ID murni)
        const qForm = query(collection(db, "formulir_kaderisasi"));
        const snapForm = await getDocs(qForm);
        const matchedForm = snapForm.docs.find(d => d.id === formIdentifier || d.data().slug === formIdentifier);

        if (!matchedForm) {
          setErrorMsg("Formulir tidak ditemukan atau sudah dihapus.");
          setLoading(false);
          return;
        }

        const formId = matchedForm.id;

        // 2. Listener Real-time untuk Konfigurasi Formulir
        unsubscribeForm = onSnapshot(doc(db, "formulir_kaderisasi", formId), (docSnap) => {
          if (docSnap.exists()) {
            setFormConfig({ id: docSnap.id, ...docSnap.data() });
          }
        });

        // 3. Listener Real-time untuk Data Pendaftar
        const qPendaftar = query(collection(db, "data_pendaftar"), where("formId", "==", formId));
        unsubscribePendaftar = onSnapshot(qPendaftar, (snapshot) => {
          let dataPend = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          // Urutkan data terbaru di atas
          dataPend.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
          setPendaftar(dataPend);
          
          // Matikan loading setelah data pertama kali berhasil ditarik
          setLoading(false); 
        });

      } catch (error) {
        setErrorMsg("Terjadi kesalahan sistem: " + error.message);
        setLoading(false);
      }
    }

    initRealTimeData();

    // Membersihkan listener saat pengunjung keluar dari halaman
    return () => {
      if (unsubscribeForm) unsubscribeForm();
      if (unsubscribePendaftar) unsubscribePendaftar();
    };
  }, [formIdentifier]);

  const handleExportExcel = () => {
    if (!pendaftar.length) return alert("Belum ada data untuk diekspor!");

    const formattedData = pendaftar.map((p, index) => {
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
      case "Lulus": return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 size={14}/> Lulus</span>;
      case "Ditolak": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><XCircle size={14}/> Ditolak</span>;
      default: return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={14}/> Pending</span>;
    }
  };

  if (loading) return <LoadingScreen text="Memuat Tabel Publik..." />;

  if (errorMsg) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex items-center justify-center bg-slate-50 pt-20">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
          <p className="text-slate-500 font-medium">{errorMsg}</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Memanggil Komponen Navbar Publik */}
      <Navbar />
      
      {/* Konten Utama - pt-28 untuk mengimbangi Navbar Fixed */}
      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* HEADER TABEL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
              Akses Publik Real-Time
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug max-w-2xl">{formConfig.judul}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Users size={14}/> {pendaftar.length} Pendaftar</p>
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><ClipboardList size={14}/> Kategori: {formConfig.kategori}</p>
              {formConfig.status === 'Tutup' && (
                <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                  <XCircle size={12}/> Pendaftaran Ditutup
                </p>
              )}
            </div>
          </div>
          <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm w-full md:w-auto shrink-0">
            <Download size={16} /> Unduh Excel
          </button>
        </div>

        {/* TABEL DATA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead className="bg-[#111827] text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5 text-center w-16">No</th>
                  <th className="py-4 px-5">Waktu Daftar</th>
                  <th className="py-4 px-5">Status Kelulusan</th>
                  {formConfig.customQuestions?.map(q => (
                    <th key={q.id} className="py-4 px-5 truncate max-w-[200px]">{q.question}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pendaftar.length === 0 ? (
                  <tr>
                    <td colSpan={3 + (formConfig.customQuestions?.length || 0)} className="py-16 text-center text-slate-500 font-medium">
                      Belum ada data pendaftar yang masuk.
                    </td>
                  </tr>
                ) : (
                  pendaftar.map((p, index) => {
                    const date = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : "-";
                    
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-5 text-center text-slate-500 font-medium">{index + 1}</td>
                        <td className="py-3 px-5 text-xs text-slate-500">{date}</td>
                        <td className="py-3 px-5">{getStatusBadge(p.statusLulus)}</td>
                        
                        {formConfig.customQuestions?.map(q => {
                          const jawaban = p.answers ? p.answers[q.question] : "-";
                          const isFile = q.type === 'file' || (typeof jawaban === 'string' && jawaban.startsWith('http'));
                          
                          return (
                            <td key={q.id} className="py-3 px-5">
                              {isFile && jawaban && jawaban !== "-" ? (
                                <a href={jawaban} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 underline underline-offset-2">
                                  <ExternalLink size={12}/> Lihat File
                                </a>
                              ) : (
                                <span className="text-slate-800 font-medium truncate max-w-[250px] block" title={jawaban}>{jawaban || "-"}</span>
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
        </div>
      </main>

      {/* Memanggil Komponen Footer Publik */}
      <Footer />
    </div>
  );
}

// Membungkus dengan Suspense sesuai aturan penggunaan useSearchParams di Next.js App Router
export default function HasilPendaftaranPage() {
  return (
    <Suspense fallback={<LoadingScreen text="Memuat Tabel Publik..." />}>
      <HasilPendaftaranContent />
    </Suspense>
  );
}