"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { Send, User, BookOpen, MapPin, Phone, CheckCircle, Share2, ArrowLeft, Calendar, Users, UploadCloud, Loader2, Info, FileText } from "lucide-react";
import { motion } from "framer-motion";

// Komponen Pembungkus untuk menangani SearchParams (Wajib di Next.js)
export default function Pendaftaran() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <PendaftaranContent />
    </Suspense>
  );
}

function PendaftaranContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formIdParam = searchParams.get("form");

  const [loading, setLoading] = useState(true);
  const [activeForms, setActiveForms] = useState([]);
  
  // State untuk form yang sedang dibuka
  const [selectedForm, setSelectedForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});

  // State Input Data
  const [baseData, setBaseData] = useState({
    nama: "", nim: "", fakultas: "", jurusan: "", semester: "", wa: "", jenisKelamin: "", rayonAsal: "", berkasUrl: ""
  });
  const [customAnswers, setCustomAnswers] = useState({});

  useEffect(() => {
    fetchForms();
  }, [formIdParam]);

  async function fetchForms() {
    try {
      // Ambil semua formulir yang berstatus Buka
      const q = query(collection(db, "formulir_kaderisasi"), where("status", "==", "Buka"));
      const snap = await getDocs(q);
      const forms = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter Auto-Close berdasarkan Deadline
      const validForms = forms.filter(f => {
        if (!f.deadline) return true;
        return new Date(f.deadline) > new Date();
      });

      setActiveForms(validForms);

      // Jika ada parameter ID form di URL, langsung buka form tersebut
      if (formIdParam) {
        const found = validForms.find(f => f.id === formIdParam);
        if (found) setSelectedForm(found);
        else alert("Formulir tidak ditemukan atau sudah ditutup.");
      }
    } catch (error) {
      console.error("Gagal memuat formulir:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleShare = (id) => {
    const link = `${window.location.origin}/pendaftaran?form=${id}`;
    navigator.clipboard.writeText(link);
    alert("Link pendaftaran berhasil disalin! Silakan bagikan.");
  };

  const handleOpenForm = (form) => {
    router.push(`/pendaftaran?form=${form.id}`);
    setSelectedForm(form);
    setIsSuccess(false);
    setBaseData({ nama: "", nim: "", fakultas: "", jurusan: "", semester: "", wa: "", jenisKelamin: "", rayonAsal: "", berkasUrl: "" });
    setCustomAnswers({});
  };

  // ================= FUNGSI CLOUDINARY UPLOAD (Untuk Berkas & Custom Field) =================
  const handleFileUpload = async (e, fieldKey, isCustom = false) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFiles(prev => ({ ...prev, [fieldKey]: true }));
    const formUpload = new FormData();
    formUpload.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formUpload });
      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();
      
      if (isCustom) {
        setCustomAnswers(prev => ({ ...prev, [fieldKey]: data.url }));
      } else {
        setBaseData(prev => ({ ...prev, [fieldKey]: data.url }));
      }
    } catch (error) {
      alert("Gagal mengunggah file. Silakan coba lagi.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  // ================= FUNGSI SUBMIT DATA =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Cek apakah ada file custom wajib yang belum terupload
    if (selectedForm.customQuestions) {
      const requiredFiles = selectedForm.customQuestions.filter(q => q.type === 'file' && q.required);
      for (let q of requiredFiles) {
        if (!customAnswers[q.question]) return alert(`Harap unggah file untuk: ${q.question}`);
      }
    }

    setIsSubmitting(true);
    
    const payload = {
      formId: selectedForm.id,
      formJudul: selectedForm.judul,
      formKategori: selectedForm.kategori || "Umum",
      statusLulus: "Pending",
      createdAt: serverTimestamp(),
      ...baseData,
      answers: customAnswers // Semua jawaban custom dimasukkan ke object 'answers'
    };

    try {
      await addDoc(collection(db, "data_pendaftar"), payload);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="font-bold text-slate-500 animate-pulse text-sm tracking-widest">MEMUAT PORTAL PENDAFTARAN...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      <Navbar />

      {/* ================= HEADER UMUM ================= */}
      {!selectedForm && (
        <section className="pt-32 pb-16 px-5 bg-[#0f172a] text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Portal <span className="text-yellow-400">Pendaftaran</span></h1>
            <p className="text-slate-300 text-sm md:text-base font-light">Pilih program kaderisasi atau kepanitiaan yang sedang dibuka di bawah ini.</p>
          </div>
        </section>
      )}

      {/* ================= TAMPILAN 1: DAFTAR FORMULIR AKTIF ================= */}
      {!selectedForm && (
        <section className="py-12 px-5 max-w-6xl mx-auto min-h-[50vh]">
          {activeForms.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
               <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
               <h3 className="font-bold text-slate-700 text-xl">Belum Ada Pendaftaran Buka</h3>
               <p className="text-sm text-slate-500 mt-2">Silakan pantau terus informasi pendaftaran terbaru melalui Instagram kami.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeForms.map((form) => (
                <div key={form.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                   <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center shrink-0">
                      {form.thumbnailUrl ? (
                        <img src={form.thumbnailUrl} alt={form.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white/20"><FileText size={64}/></div>
                      )}
                      <span className="absolute top-3 left-3 bg-white/90 text-slate-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full backdrop-blur-sm">
                        {form.kategori || "Umum"}
                      </span>
                   </div>
                   <div className="p-6 flex flex-col flex-grow">
                      <h3 className="font-extrabold text-slate-900 text-lg md:text-xl leading-tight mb-2 group-hover:text-blue-600 transition-colors">{form.judul}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-grow">{form.deskripsi}</p>
                      
                      {form.deadline && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg w-max mb-4 border border-red-100">
                          <Calendar size={12} /> Ditutup: {new Date(form.deadline).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-auto border-t border-slate-100 pt-4">
                        <button onClick={() => handleShare(form.id)} className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl transition flex justify-center items-center gap-1.5 text-xs border border-slate-200">
                          <Share2 size={14}/> Share Link
                        </button>
                        <button onClick={() => handleOpenForm(form)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition flex justify-center items-center text-xs shadow-md">
                          Daftar Sekarang
                        </button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= TAMPILAN 2: HALAMAN PENGISIAN FORMULIR ================= */}
      {selectedForm && !isSuccess && (
        <div className="pt-24 pb-20 px-4 md:px-5">
          <div className="max-w-3xl mx-auto">
             
             {/* Tombol Kembali & Share */}
             <div className="flex justify-between items-center mb-6">
                <button onClick={() => {router.push('/pendaftaran'); setSelectedForm(null);}} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                  <ArrowLeft size={16}/> Kembali
                </button>
                <button onClick={() => handleShare(selectedForm.id)} className="flex items-center gap-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full border border-blue-200 transition">
                  <Share2 size={14}/> Bagikan
                </button>
             </div>

             {/* Header Form */}
             <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-6">
                {selectedForm.thumbnailUrl && (
                  <div className="w-full h-48 sm:h-64 md:h-80 relative bg-slate-100">
                    <img src={selectedForm.thumbnailUrl} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                  </div>
                )}
                <div className={`p-6 md:p-8 ${selectedForm.thumbnailUrl ? 'bg-slate-900 text-white -mt-2' : 'bg-blue-50 border-b border-blue-100'}`}>
                   <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block ${selectedForm.thumbnailUrl ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-600 text-white'}`}>{selectedForm.kategori}</span>
                   <h2 className="text-2xl md:text-4xl font-extrabold leading-tight mb-3">{selectedForm.judul}</h2>
                   <p className={`text-sm md:text-base leading-relaxed ${selectedForm.thumbnailUrl ? 'text-slate-300' : 'text-slate-600'}`}>{selectedForm.deskripsi}</p>
                   
                   {selectedForm.deadline && (
                     <div className="mt-5 flex items-center gap-2 text-xs font-bold bg-amber-500/20 text-amber-500 w-max px-3 py-1.5 rounded-lg border border-amber-500/30">
                       <Info size={14}/> Batas Pendaftaran: {new Date(selectedForm.deadline).toLocaleString('id-ID')}
                     </div>
                   )}
                </div>

                {/* AREA INPUT DATA */}
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                  
                  {/* DATA WAJIB SISTEM */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-5">
                    <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 text-sm flex items-center gap-2"><User size={16} className="text-blue-600"/> Data Identitas (Wajib)</h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Nama Lengkap Sesuai KTP/KTM</label>
                      <input type="text" required value={baseData.nama} onChange={e => setBaseData({...baseData, nama: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masukkan nama lengkap..." />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">NIM</label>
                        <input type="number" required value={baseData.nim} onChange={e => setBaseData({...baseData, nim: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="23010..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Semester Saat Ini</label>
                        <input type="number" required value={baseData.semester} onChange={e => setBaseData({...baseData, semester: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: 3" />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Fakultas</label>
                        <input type="text" required value={baseData.fakultas} onChange={e => setBaseData({...baseData, fakultas: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sains & Teknologi" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Jurusan / Program Studi</label>
                        <input type="text" required value={baseData.jurusan} onChange={e => setBaseData({...baseData, jurusan: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Teknik Informatika" />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">No. WhatsApp Aktif</label>
                        <input type="tel" required value={baseData.wa} onChange={e => setBaseData({...baseData, wa: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0812..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Jenis Kelamin</label>
                        <select required value={baseData.jenisKelamin} onChange={e => setBaseData({...baseData, jenisKelamin: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                          <option value="">Pilih...</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                    </div>

                    {/* Fitur Bawaan Boleh Diaktifkan Admin */}
                    {selectedForm.reqRayon && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Asal Rayon PMII (Opsional bagi Mapaba)</label>
                        <input type="text" value={baseData.rayonAsal} onChange={e => setBaseData({...baseData, rayonAsal: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Misal: Rayon Pencerahan Galileo" />
                      </div>
                    )}

                    {selectedForm.reqBerkas && (
                      <div className="space-y-1.5 bg-blue-50 p-4 rounded-xl border border-blue-100">
                         <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5"><UploadCloud size={14}/> Upload Berkas Persyaratan Utama (PDF/Gambar)</label>
                         <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                            <label className={`cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold transition border w-full sm:w-auto text-center shrink-0 ${uploadingFiles['berkasUtama'] ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                              {uploadingFiles['berkasUtama'] ? <Loader2 size={14} className="animate-spin inline mr-1" /> : <UploadCloud size={14} className="inline mr-1" />}
                              {uploadingFiles['berkasUtama'] ? "Mengunggah..." : "Pilih File"}
                              <input type="file" required className="hidden" onChange={(e) => handleFileUpload(e, 'berkasUrl', false)} disabled={uploadingFiles['berkasUtama']} />
                            </label>
                            <input type="text" readOnly value={baseData.berkasUrl} required className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-emerald-600 font-mono outline-none" placeholder="File wajib diunggah..." />
                         </div>
                      </div>
                    )}
                  </div>

                  {/* DATA KUSTOM DARI FORM BUILDER ADMIN */}
                  {selectedForm.customQuestions?.length > 0 && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-6 mt-6">
                      <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 text-sm flex items-center gap-2"><FileText size={16} className="text-amber-500"/> Pertanyaan Tambahan</h3>
                      
                      {selectedForm.customQuestions.map((q) => (
                        <div key={q.id} className="space-y-2">
                          <label className="text-[12px] font-bold text-slate-700 leading-snug flex items-start gap-1">
                            {q.question} {q.required && <span className="text-red-500">*</span>}
                          </label>

                          {q.type === 'text' && (
                            <input type="text" required={q.required} value={customAnswers[q.question] || ""} onChange={e => setCustomAnswers({...customAnswers, [q.question]: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jawaban singkat..." />
                          )}

                          {q.type === 'textarea' && (
                            <textarea rows="3" required={q.required} value={customAnswers[q.question] || ""} onChange={e => setCustomAnswers({...customAnswers, [q.question]: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Tuliskan jawaban Anda di sini..." />
                          )}

                          {q.type === 'select' && (
                            <select required={q.required} value={customAnswers[q.question] || ""} onChange={e => setCustomAnswers({...customAnswers, [q.question]: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                              <option value="">Pilih salah satu...</option>
                              {q.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                            </select>
                          )}

                          {q.type === 'radio' && (
                            <div className="space-y-2 mt-2">
                              {q.options?.map((opt, i) => (
                                <label key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition bg-white">
                                  <input type="radio" name={q.id} required={q.required} value={opt} checked={customAnswers[q.question] === opt} onChange={e => setCustomAnswers({...customAnswers, [q.question]: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                  <span className="text-sm font-medium text-slate-700">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {q.type === 'file' && (
                            <div className="flex flex-col sm:flex-row items-center gap-2 mt-1">
                               <label className={`cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold transition border w-full sm:w-auto text-center shrink-0 ${uploadingFiles[q.id] ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                                 {uploadingFiles[q.id] ? <Loader2 size={14} className="animate-spin inline mr-1" /> : <UploadCloud size={14} className="inline mr-1" />}
                                 {uploadingFiles[q.id] ? "Mengunggah..." : "Pilih File"}
                                 {/* File input tidak menggunakan browser 'required', kita validasi manual saat submit */}
                                 <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, q.question, true)} disabled={uploadingFiles[q.id]} />
                               </label>
                               <input type="text" readOnly value={customAnswers[q.question] || ""} className="w-full p-2.5 border border-slate-200 rounded-xl text-[10px] bg-slate-100 text-slate-500 font-mono outline-none" placeholder={q.required ? "Wajib diunggah..." : "Kosong..."} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tombol Kirim */}
                  <div className="pt-6 border-t border-slate-100">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70 shadow-xl shadow-slate-900/10">
                      {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Mengirim Data...</> : <>Kirim Formulir Pendaftaran <Send size={20} /></>}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4">Sistem Terintegrasi Database PMII Komisariat UIN Malang</p>
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* ================= TAMPILAN 3: SUCCESS STATE ================= */}
      {isSuccess && selectedForm && (
        <div className="min-h-[80vh] flex items-center justify-center p-5">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-slate-100 text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">Pendaftaran Berhasil!</h2>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-8 whitespace-pre-line">
                 {selectedForm.pesanSukses || "Terima kasih, data Anda telah berhasil masuk ke dalam database kami."}
              </p>
              
              <div className="space-y-3">
                 {selectedForm.linkGrupWA && (
                   <a href={selectedForm.linkGrupWA} target="_blank" rel="noopener noreferrer" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/30">
                     <Phone size={18} /> Bergabung ke Grup WhatsApp
                   </a>
                 )}
                 <button onClick={() => {setIsSuccess(false); setSelectedForm(null); router.push('/pendaftaran');}} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition flex justify-center items-center text-sm">
                   Kembali ke Beranda Formulir
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      <Footer />
    </main>
  );
}