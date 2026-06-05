"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { Send, Phone, CheckCircle, Share2, ArrowLeft, Calendar, UploadCloud, Loader2, Info, FileText } from "lucide-react";
import { motion } from "framer-motion";

// ================= FUNGSI HELPER FORMAT TEXT =================
const formatDescription = (text) => {
  if (!text) return "";
  let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  safeText = safeText
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-inherit">$1</strong>')
    .replace(/\*(.*?)\*/g, '<strong class="font-bold text-inherit">$1</strong>')
    .replace(/_(.*?)_/g, '<em class="italic">$1</em>');
  return safeText.replace(/\n/g, '<br />');
};

const stripFormatting = (text) => {
  if (!text) return "";
  return text.replace(/[*_]/g, '');
};

// ================= FUNGSI KOMPRESI GAMBAR (ANTI-GAGAL HP) =================
// Memeras foto 5MB-10MB dari HP menjadi ukuran kecil (Ratusan KB) sebelum diupload
const compressImage = (file) => {
  return new Promise((resolve) => {
    // Jika file BUKAN gambar (misal PDF), langsung lewati kompresi
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Lebar maksimal gambar
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Kompres ke format JPEG dengan Kualitas 80%
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback jika kompresi gagal
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => resolve(file); // Fallback error render
    };
    reader.onerror = () => resolve(file); // Fallback error baca
  });
};

export default function PendaftaranClient() {
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
  
  const [selectedForm, setSelectedForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});

  const [customAnswers, setCustomAnswers] = useState({});

  useEffect(() => {
    fetchForms();
  }, [formIdParam]);

  async function fetchForms() {
    try {
      const q = query(collection(db, "formulir_kaderisasi"), where("status", "==", "Buka"));
      const snap = await getDocs(q);
      const forms = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const validForms = forms.filter(f => {
        if (!f.deadline) return true;
        return new Date(f.deadline) > new Date();
      });

      setActiveForms(validForms);

      if (formIdParam) {
        const found = validForms.find(f => f.id === formIdParam || f.slug === formIdParam);
        if (found) setSelectedForm(found);
        else alert("Formulir tidak ditemukan atau pendaftaran sudah ditutup.");
      }
    } catch (error) {
      console.error("Gagal memuat formulir:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleShare = (form) => {
    const identifier = form.slug || form.id;
    const link = `${window.location.origin}/pendaftaran?form=${identifier}`;
    navigator.clipboard.writeText(link);
    alert("Link pendaftaran berhasil disalin! Silakan bagikan via WhatsApp.");
  };

  const handleOpenForm = (form) => {
    const identifier = form.slug || form.id;
    router.push(`/pendaftaran?form=${identifier}`);
    setSelectedForm(form);
    setIsSuccess(false);
    setCustomAnswers({});
  };

  const handleFileUpload = async (e, questionText, questionId) => {
    const originalFile = e.target.files[0];
    if (!originalFile) return;

    setUploadingFiles(prev => ({ ...prev, [questionId]: true }));
    
    try {
      // 1. Eksekusi Kompresi Gambar sebelum Upload!
      const fileToUpload = await compressImage(originalFile);

      // 2. Upload File yang sudah ringan ke API
      const formUpload = new FormData();
      formUpload.append("file", fileToUpload);

      const res = await fetch("/api/upload", { method: "POST", body: formUpload });
      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();
      
      setCustomAnswers(prev => ({ ...prev, [questionText]: data.url }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Gagal mengunggah file. Pastikan sinyal stabil atau coba file lain.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi file wajib terisi
    if (selectedForm.customQuestions) {
      const requiredFiles = selectedForm.customQuestions.filter(q => q.type === 'file' && q.required);
      for (let q of requiredFiles) {
        if (!customAnswers[q.question]) return alert(`Harap tunggu proses unggah file selesai, atau unggah file untuk pertanyaan: ${q.question}`);
      }
    }

    setIsSubmitting(true);
    
    // PERBAIKAN FATAL FIREBASE: Bersihkan data "undefined" agar database tidak error
    const cleanAnswers = {};
    for (const key in customAnswers) {
      if (customAnswers[key] !== undefined) {
        cleanAnswers[key] = customAnswers[key];
      }
    }

    const payload = {
      formId: selectedForm.id,
      formJudul: selectedForm.judul,
      formKategori: selectedForm.kategori || "Umum",
      statusLulus: "Pending",
      createdAt: serverTimestamp(),
      answers: cleanAnswers 
    };

    try {
      await addDoc(collection(db, "data_pendaftar"), payload);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert("Terjadi kesalahan sistem pendaftaran: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cek apakah ada file yang masih diproses loading upload
  const isAnyFileUploading = Object.values(uploadingFiles).some(isUploading => isUploading === true);

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

      {!selectedForm && (
        <section className="pt-32 pb-16 px-5 bg-[#0f172a] text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Portal <span className="text-yellow-400">Pendaftaran</span></h1>
            <p className="text-slate-300 text-sm md:text-base font-light">Pilih program kaderisasi atau kepanitiaan yang sedang dibuka di bawah ini.</p>
          </div>
        </section>
      )}

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
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-grow whitespace-pre-line">
                        {stripFormatting(form.deskripsi)}
                      </p>
                      
                      {form.deadline && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg w-max mb-4 border border-red-100">
                          <Calendar size={12} /> Ditutup: {new Date(form.deadline).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-auto border-t border-slate-100 pt-4">
                        <button onClick={() => handleShare(form)} className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl transition flex justify-center items-center gap-1.5 text-xs border border-slate-200">
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

      {selectedForm && !isSuccess && (
        <div className="pt-24 pb-20 px-4 md:px-5">
          <div className="max-w-3xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                <button onClick={() => {router.push('/pendaftaran'); setSelectedForm(null);}} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                  <ArrowLeft size={16}/> Kembali
                </button>
                <button onClick={() => handleShare(selectedForm)} className="flex items-center gap-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full border border-blue-200 transition">
                  <Share2 size={14}/> Bagikan
                </button>
             </div>

             <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-6">
                {selectedForm.thumbnailUrl && (
                  <div className="w-full h-48 sm:h-64 md:h-80 relative bg-slate-100">
                    <img src={selectedForm.thumbnailUrl} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                  </div>
                )}
                <div className={`p-6 md:p-8 ${selectedForm.thumbnailUrl ? 'bg-slate-900 text-white -mt-2' : 'bg-blue-50 border-b border-blue-100'}`}>
                   <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block ${selectedForm.thumbnailUrl ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-600 text-white'}`}>{selectedForm.kategori}</span>
                   <h2 className="text-2xl md:text-4xl font-extrabold leading-tight mb-4">{selectedForm.judul}</h2>
                   
                   <div 
                     className={`text-sm md:text-base leading-relaxed ${selectedForm.thumbnailUrl ? 'text-slate-300' : 'text-slate-600'}`}
                     dangerouslySetInnerHTML={{ __html: formatDescription(selectedForm.deskripsi) }}
                   />
                   
                   {selectedForm.deadline && (
                     <div className="mt-6 flex items-center gap-2 text-xs font-bold bg-amber-500/20 text-amber-500 w-max px-3 py-1.5 rounded-lg border border-amber-500/30">
                       <Info size={14}/> Batas Pendaftaran: {new Date(selectedForm.deadline).toLocaleString('id-ID')}
                     </div>
                   )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                  {selectedForm.customQuestions?.length > 0 ? (
                    <div className="space-y-6">
                      {selectedForm.customQuestions.map((q) => (
                        <div key={q.id} className="space-y-2">
                          <label className="text-sm font-bold text-slate-800 leading-snug flex items-start gap-1">
                            {q.question} {q.required && <span className="text-red-500">*</span>}
                          </label>
                          {q.type === 'text' && (
                            <input type="text" required={q.required} value={customAnswers[q.question] || ""} onChange={e => setCustomAnswers({...customAnswers, [q.question]: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ketik jawaban Anda..." />
                          )}
                          {q.type === 'textarea' && (
                            <textarea rows="3" required={q.required} value={customAnswers[q.question] || ""} onChange={e => setCustomAnswers({...customAnswers, [q.question]: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all" placeholder="Tuliskan jawaban lengkap di sini..." />
                          )}
                          {q.type === 'select' && (
                            <select required={q.required} value={customAnswers[q.question] || ""} onChange={e => setCustomAnswers({...customAnswers, [q.question]: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all">
                              <option value="">Pilih salah satu...</option>
                              {q.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                            </select>
                          )}
                          {q.type === 'radio' && (
                            <div className="space-y-2 mt-2">
                              {q.options?.map((opt, i) => (
                                <label key={i} className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all bg-white">
                                  <input type="radio" name={q.id} required={q.required} value={opt} checked={customAnswers[q.question] === opt} onChange={e => setCustomAnswers({...customAnswers, [q.question]: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                  <span className="text-sm font-medium text-slate-700">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {q.type === 'file' && (
                            <div className="flex flex-col sm:flex-row items-center gap-3 mt-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <label className={`cursor-pointer px-5 py-3 rounded-xl text-xs font-bold transition-all border w-full sm:w-auto text-center shrink-0 ${uploadingFiles[q.id] ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-sm'}`}>
                                 {uploadingFiles[q.id] ? <Loader2 size={16} className="animate-spin inline mr-2" /> : <UploadCloud size={16} className="inline mr-2" />}
                                 {uploadingFiles[q.id] ? "Mengunggah File..." : "Pilih File Gambar/PDF"}
                                 <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, q.question, q.id)} disabled={uploadingFiles[q.id]} />
                               </label>
                               <input type="text" readOnly value={customAnswers[q.question] || ""} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white text-emerald-600 font-mono outline-none" placeholder={q.required ? "File wajib diunggah..." : "Belum ada file dipilih..."} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-slate-500">Belum ada pertanyaan yang dibuat untuk formulir ini.</p>
                    </div>
                  )}

                  <div className="pt-8 mt-8 border-t border-slate-100">
                    <button 
                      type="submit" 
                      // Mencegah submit jika file sedang di-upload atau jika Firebase akan menganggap formnya kosong
                      disabled={isSubmitting || !selectedForm.customQuestions || selectedForm.customQuestions.length === 0 || isAnyFileUploading} 
                      className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10"
                    >
                      {isSubmitting ? (
                        <><Loader2 size={20} className="animate-spin" /> Sedang Mengirim Data...</>
                      ) : isAnyFileUploading ? (
                        <><Loader2 size={20} className="animate-spin" /> Mohon Tunggu Upload Selesai...</>
                      ) : (
                        <>Kirim Formulir Pendaftaran <Send size={20} /></>
                      )}
                    </button>
                    <p className="text-center text-[10px] font-semibold text-slate-400 mt-4 uppercase tracking-widest">Sistem Terintegrasi Database PMII</p>
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}

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