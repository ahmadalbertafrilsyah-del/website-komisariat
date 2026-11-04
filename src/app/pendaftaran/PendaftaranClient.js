"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import {
  Send,
  Phone,
  CheckCircle,
  Share2,
  ArrowLeft,
  Calendar,
  UploadCloud,
  Loader2,
  Info,
  FileText,
  XCircle,
  Sparkles,
  Search,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ================= FUNGSI HELPER FORMAT TEXT =================
const formatDescription = (text) => {
  if (!text) return "";
  let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  safeText = safeText
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold text-inherit">$1</strong>'
    )
    .replace(
      /\*(.*?)\*/g,
      '<strong class="font-bold text-inherit">$1</strong>'
    )
    .replace(/_(.*?)_/g, '<em class="italic">$1</em>');
  return safeText.replace(/\n/g, "<br />");
};

const stripFormatting = (text) => {
  if (!text) return "";
  return text.replace(/[*_]/g, "");
};

const getRemainingDaysLabel = (deadlineStr) => {
  if (!deadlineStr) return "Pendaftaran Dibuka";
  const diffMs = new Date(deadlineStr).getTime() - Date.now();
  if (diffMs <= 0) return "Ditutup";
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `Sisa ${days} Hari Lagi`;
  return `Sisa ${Math.max(1, hours)} Jam Lagi`;
};

function SafeFormThumbnail({ src, alt, kategori }) {
  const [imgError, setImgError] = useState(false);
  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={alt || "Program Pendaftaran"}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 768px) 100vw, 33vw"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 mb-2">
        <FileText size={22} />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
        {kategori || "Formulir Kaderisasi"}
      </span>
    </div>
  );
}

// ================= FUNGSI KOMPRESI GAMBAR (ANTI-GAGAL HP) =================
const compressImage = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + ".jpg",
                {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }
              );
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.8
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function PendaftaranClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      }
    >
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

  // Filter & Search on Portal Index
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");

  const [selectedForm, setSelectedForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});

  const [customAnswers, setCustomAnswers] = useState({});

  // STATE CUSTOM NOTIFICATION MODAL
  const [notifModal, setNotifModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    async function fetchForms() {
      try {
        const q = query(
          collection(db, "formulir_kaderisasi"),
          where("status", "==", "Buka")
        );
        const snap = await getDocs(q);
        const forms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const validForms = forms.filter((f) => {
          if (!f.deadline) return true;
          return new Date(f.deadline) > new Date();
        });

        setActiveForms(validForms);

        if (formIdParam) {
          const found = validForms.find(
            (f) => f.id === formIdParam || f.slug === formIdParam
          );
          if (found) {
            setSelectedForm(found);
          } else {
            setNotifModal({
              isOpen: true,
              type: "error",
              title: "Formulir Tidak Ditemukan",
              message:
                "Formulir yang Anda tuju tidak ditemukan atau masa pendaftaran telah ditutup.",
            });
          }
        }
      } catch (error) {
        console.error("Gagal memuat formulir:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchForms();
  }, [formIdParam]);

  const kategoriList = useMemo(() => {
    return [
      "Semua",
      ...new Set(activeForms.map((f) => f.kategori || "Umum").filter(Boolean)),
    ];
  }, [activeForms]);

  const filteredForms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return activeForms.filter((f) => {
      const matchKat =
        selectedKategori === "Semua" ||
        (f.kategori || "Umum") === selectedKategori;
      const matchSearch =
        !q ||
        (f.judul || "").toLowerCase().includes(q) ||
        (f.deskripsi || "").toLowerCase().includes(q) ||
        (f.kategori || "").toLowerCase().includes(q);
      return matchKat && matchSearch;
    });
  }, [activeForms, selectedKategori, searchTerm]);

  // Form Completion Progress calculation
  const formProgress = useMemo(() => {
    if (!selectedForm || !Array.isArray(selectedForm.customQuestions)) {
      return { total: 0, answered: 0, percent: 0 };
    }
    const questions = selectedForm.customQuestions;
    const total = questions.length;
    if (total === 0) return { total: 0, answered: 0, percent: 0 };
    const answered = questions.filter((q) => {
      const val = customAnswers[q.question];
      return val !== undefined && String(val).trim() !== "";
    }).length;
    return {
      total,
      answered,
      percent: Math.round((answered / total) * 100),
    };
  }, [selectedForm, customAnswers]);

  const handleShare = async (form, e) => {
    if (e) e.stopPropagation();
    const identifier = form.slug || form.id;
    const link = `${window.location.origin}/pendaftaran?form=${identifier}`;

    const shareData = {
      title: `Pendaftaran: ${form.judul}`,
      text: `Mari bergabung dalam program kaderisasi/kepanitiaan: ${form.judul}. Klik tautan berikut untuk mendaftar:`,
      url: link,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // dibatalkan
      }
    } else {
      navigator.clipboard.writeText(
        `${shareData.title}\n\n${shareData.text}\n${shareData.url}`
      );
      setNotifModal({
        isOpen: true,
        type: "success",
        title: "Tautan Pendaftaran Disalin!",
        message:
          "Detail dan link pendaftaran berhasil disalin ke clipboard! Silakan bagikan ke grup WhatsApp.",
      });
    }
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

    setUploadingFiles((prev) => ({ ...prev, [questionId]: true }));

    try {
      const fileToUpload = await compressImage(originalFile);
      const formUpload = new FormData();
      formUpload.append("file", fileToUpload);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formUpload,
      });
      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();

      setCustomAnswers((prev) => ({ ...prev, [questionText]: data.url }));
    } catch (error) {
      console.error("Upload error:", error);
      setNotifModal({
        isOpen: true,
        type: "error",
        title: "Gagal Mengunggah Berkas",
        message:
          "Gagal mengunggah file. Pastikan koneksi internet stabil atau gunakan ukuran berkas yang lebih kecil.",
      });
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedForm.customQuestions) {
      const requiredFiles = selectedForm.customQuestions.filter(
        (q) => q.type === "file" && q.required
      );
      for (const q of requiredFiles) {
        if (!customAnswers[q.question]) {
          return setNotifModal({
            isOpen: true,
            type: "error",
            title: "Berkas Belum Lengkap",
            message: `Harap tunggu proses unggah file selesai, atau unggah file untuk pertanyaan wajib: ${q.question}`,
          });
        }
      }
    }

    setIsSubmitting(true);

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
      answers: cleanAnswers,
    };

    try {
      await addDoc(collection(db, "data_pendaftar"), payload);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setNotifModal({
        isOpen: true,
        type: "error",
        title: "Pendaftaran Gagal",
        message: "Terjadi kesalahan sistem pendaftaran: " + error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAnyFileUploading = Object.values(uploadingFiles).some(
    (isUploading) => isUploading === true
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-amber-400 animate-spin mb-3" />
        <p className="font-mono font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
          Memuat Portal Pendaftaran...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] font-sans text-slate-900 dark:text-slate-100 flex flex-col pb-16 xl:pb-0">
      <Navbar />

      {/* VIEW 1: PORTAL INDEX (DAFTAR FORMULIR AKTIF) */}
      {!selectedForm && (
        <>
          <section className="relative pt-28 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 bg-[#020617] text-white border-b border-slate-800/80 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600" />

            <div className="relative z-10 max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-950/80 border border-blue-800/70 text-amber-400 text-[11px] font-mono uppercase tracking-widest mb-4">
                    <Sparkles size={13} />
                    Sistem Rekrutmen & Kaderisasi
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
                    Portal Resmi{" "}
                    <span className="text-amber-400">Pendaftaran</span>
                  </h1>
                  <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                    Pilih program kaderisasi formal, sekolah non-formal, atau
                    rekrutmen kepanitiaan yang sedang dibuka oleh PK. PMII Sunan
                    Ampel Malang.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Program Buka
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
                      {activeForms.length}
                    </p>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Kategori
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                      {Math.max(0, kategoriList.length - 1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Search & Category Filter */}
          {activeForms.length > 0 && (
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-7 relative z-20 mb-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                  {kategoriList.map((kat) => (
                    <button
                      key={kat}
                      onClick={() => setSelectedKategori(kat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedKategori === kat
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {kat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72 shrink-0">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama program pendaftaran..."
                    className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Forms Grid */}
          <section className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow">
            {activeForms.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 sm:p-16 text-center shadow-sm max-w-xl mx-auto my-6">
                <FileText className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Belum Ada Pendaftaran yang Dibuka
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Silakan pantau informasi pembukaan kaderisasi atau kepanitiaan
                  terbaru melalui kanal resmi PK. PMII Sunan Ampel Malang.
                </p>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm max-w-xl mx-auto">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  Program Tidak Ditemukan
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedKategori("Semua");
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredForms.map((form) => {
                  const qCount = form.customQuestions?.length || 0;
                  return (
                    <div
                      key={form.id}
                      onClick={() => handleOpenForm(form)}
                      className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col group"
                    >
                      <div className="aspect-[16/10] bg-slate-900 relative overflow-hidden shrink-0">
                        <SafeFormThumbnail
                          src={form.thumbnailUrl}
                          alt={form.judul}
                          kategori={form.kategori}
                        />
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                          <span className="bg-slate-950/85 text-amber-400 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-md">
                            {form.kategori || "Umum"}
                          </span>
                          <span className="bg-emerald-600/95 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                            <Clock size={10} />{" "}
                            {getRemainingDaysLabel(form.deadline)}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-grow justify-between">
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-lg leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {form.judul}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                            {stripFormatting(form.deskripsi) ||
                              "Klik untuk membaca ketentuan lengkap dan mengisi formulir pendaftaran."}
                          </p>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 pb-3.5 mb-3.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="flex items-center gap-1">
                              <FileText size={12} className="text-blue-500" />{" "}
                              {qCount} Pertanyaan
                            </span>
                            {form.deadline && (
                              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                                <Calendar size={12} /> Tutup:{" "}
                                {new Date(form.deadline).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleShare(form, e)}
                              className="col-span-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl transition flex justify-center items-center gap-1.5 text-xs"
                            >
                              <Share2 size={13} /> Bagikan
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenForm(form);
                              }}
                              className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition flex justify-center items-center gap-1 text-xs shadow-sm"
                            >
                              Daftar Sekarang <ArrowUpRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* VIEW 2: FORM FILLING WORKSPACE */}
      {selectedForm && !isSuccess && (
        <div className="pt-24 md:pt-28 pb-20 px-4 sm:px-6 flex-grow">
          <div className="max-w-3xl mx-auto">
            {/* Top Action Bar */}
            <div className="flex justify-between items-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => {
                  router.push("/pendaftaran");
                  setSelectedForm(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <ArrowLeft size={15} /> Semua Program
              </button>
              <button
                type="button"
                onClick={(e) => handleShare(selectedForm, e)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-amber-400 bg-blue-50 dark:bg-slate-900 hover:bg-blue-100 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-slate-800 transition"
              >
                <Share2 size={14} /> Bagikan Formulir
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
              {/* Cover Banner */}
              {selectedForm.thumbnailUrl && (
                <div className="w-full aspect-[16/9] sm:aspect-[21/9] relative bg-slate-900">
                  <SafeFormThumbnail
                    src={selectedForm.thumbnailUrl}
                    alt={selectedForm.judul}
                    kategori={selectedForm.kategori}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                </div>
              )}

              {/* Form Header Info */}
              <div className="p-5 sm:p-8 bg-[#020617] text-white border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-amber-400 text-slate-950">
                    {selectedForm.kategori || "Umum"}
                  </span>
                  {selectedForm.deadline && (
                    <span className="text-[11px] font-mono text-amber-300 bg-white/10 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <Info size={12} /> Batas:{" "}
                      {new Date(selectedForm.deadline).toLocaleString("id-ID")}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-4">
                  {selectedForm.judul}
                </h2>

                {selectedForm.deskripsi && (
                  <div
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/90 border border-slate-800 p-4 rounded-xl"
                    dangerouslySetInnerHTML={{
                      __html: formatDescription(selectedForm.deskripsi),
                    }}
                  />
                )}
              </div>

              {/* Sticky Completion Progress Bar */}
              {formProgress.total > 0 && (
                <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 sm:px-8 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <CheckCircle2
                      size={15}
                      className={
                        formProgress.percent === 100
                          ? "text-emerald-500"
                          : "text-blue-500"
                      }
                    />
                    <span>
                      Terisi {formProgress.answered} dari {formProgress.total}{" "}
                      Pertanyaan
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 w-32 sm:w-44">
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
                        style={{ width: `${formProgress.percent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-500 w-9 text-right">
                      {formProgress.percent}%
                    </span>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <form
                onSubmit={handleSubmit}
                className="p-5 sm:p-8 space-y-5"
              >
                {selectedForm.customQuestions?.length > 0 ? (
                  <div className="space-y-4">
                    {selectedForm.customQuestions.map((q, qIdx) => {
                      const isAnswered =
                        customAnswers[q.question] !== undefined &&
                        String(customAnswers[q.question]).trim() !== "";

                      return (
                        <div
                          key={q.id || qIdx}
                          className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
                            isAnswered
                              ? "bg-slate-50/70 dark:bg-slate-800/40 border-blue-500/40 dark:border-blue-500/40"
                              : "bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/80 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug flex items-start gap-2">
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                                {String(qIdx + 1).padStart(2, "0")}
                              </span>
                              <span>
                                {q.question}{" "}
                                {q.required && (
                                  <span className="text-rose-500 font-black">
                                    *
                                  </span>
                                )}
                              </span>
                            </label>
                            {isAnswered && (
                              <CheckCircle2
                                size={16}
                                className="text-emerald-500 shrink-0 mt-0.5"
                              />
                            )}
                          </div>

                          {q.type === "text" && (
                            <input
                              type="text"
                              required={q.required}
                              value={customAnswers[q.question] || ""}
                              onChange={(e) =>
                                setCustomAnswers({
                                  ...customAnswers,
                                  [q.question]: e.target.value,
                                })
                              }
                              className="w-full p-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                              placeholder="Ketik jawaban Anda..."
                            />
                          )}

                          {q.type === "textarea" && (
                            <textarea
                              rows="3"
                              required={q.required}
                              value={customAnswers[q.question] || ""}
                              onChange={(e) =>
                                setCustomAnswers({
                                  ...customAnswers,
                                  [q.question]: e.target.value,
                                })
                              }
                              className="w-full p-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none resize-none transition-all text-slate-900 dark:text-white"
                              placeholder="Tuliskan jawaban lengkap di sini..."
                            />
                          )}

                          {q.type === "select" && (
                            <select
                              required={q.required}
                              value={customAnswers[q.question] || ""}
                              onChange={(e) =>
                                setCustomAnswers({
                                  ...customAnswers,
                                  [q.question]: e.target.value,
                                })
                              }
                              className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none cursor-pointer transition-all text-slate-900 dark:text-white"
                            >
                              <option value="">Pilih salah satu...</option>
                              {q.options?.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}

                          {q.type === "radio" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {q.options?.map((opt, i) => {
                                const checked =
                                  customAnswers[q.question] === opt;
                                return (
                                  <label
                                    key={i}
                                    className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                                      checked
                                        ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={q.id}
                                      required={q.required}
                                      value={opt}
                                      checked={checked}
                                      onChange={(e) =>
                                        setCustomAnswers({
                                          ...customAnswers,
                                          [q.question]: e.target.value,
                                        })
                                      }
                                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs sm:text-sm font-semibold">
                                      {opt}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {q.type === "file" && (
                            <div className="mt-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <label
                                  className={`cursor-pointer px-4 py-3 rounded-xl text-xs font-bold transition-all border text-center shrink-0 flex items-center justify-center gap-2 ${
                                    uploadingFiles[q.id]
                                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
                                      : "bg-blue-600 hover:bg-blue-500 text-white border-blue-600 shadow-sm"
                                  }`}
                                >
                                  {uploadingFiles[q.id] ? (
                                    <>
                                      <Loader2
                                        size={15}
                                        className="animate-spin"
                                      />
                                      <span>Mengompres & Mengunggah...</span>
                                    </>
                                  ) : (
                                    <>
                                      <UploadCloud size={15} />
                                      <span>
                                        {customAnswers[q.question]
                                          ? "Ganti Berkas"
                                          : "Pilih Gambar / PDF"}
                                      </span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleFileUpload(e, q.question, q.id)
                                    }
                                    disabled={uploadingFiles[q.id]}
                                  />
                                </label>

                                <div className="flex-1 min-w-0">
                                  {customAnswers[q.question] ? (
                                    <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 text-xs font-mono">
                                      <span className="truncate">
                                        ✓ Berkas berhasil diunggah
                                      </span>
                                      <a
                                        href={customAnswers[q.question]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline font-sans font-bold shrink-0"
                                      >
                                        Lihat
                                      </a>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400 italic px-1">
                                      {q.required
                                        ? "Wajib mengunggah berkas (otomatis dikompres agar hemat kuota HP)."
                                        : "Opsional — belum ada berkas dipilih."}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Belum ada pertanyaan yang dibuat untuk formulir ini.
                    </p>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !selectedForm.customQuestions ||
                      selectedForm.customQuestions.length === 0 ||
                      isAnyFileUploading
                    }
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Sedang
                        Mengirim Data...
                      </>
                    ) : isAnyFileUploading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Mohon
                        Tunggu Berkas Selesai Diunggah...
                      </>
                    ) : (
                      <>
                        Kirim Formulir Pendaftaran <Send size={17} />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] font-mono text-slate-400 mt-3 uppercase tracking-widest">
                    Sistem Pendaftaran Terintegrasi Database PK. PMII Sunan
                    Ampel Malang
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SUCCESS SCREEN */}
      {isSuccess && selectedForm && (
        <div className="min-h-[80vh] flex items-center justify-center p-5 flex-grow">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 p-7 sm:p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-center max-w-lg w-full mx-auto"
          >
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle size={34} />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Registrasi Tercatat
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 mb-3">
              Pendaftaran Berhasil!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-7 whitespace-pre-line">
              {selectedForm.pesanSukses ||
                "Terima kasih, berkas dan data pendaftaran Anda telah berhasil masuk ke dalam sistem database panitia."}
            </p>
            <div className="space-y-2.5">
              {selectedForm.linkGrupWA && (
                <a
                  href={selectedForm.linkGrupWA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl transition flex justify-center items-center gap-2 text-xs sm:text-sm shadow-md"
                >
                  <Phone size={16} /> Bergabung ke Grup WhatsApp Peserta
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setSelectedForm(null);
                  router.push("/pendaftaran");
                }}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-6 rounded-xl transition flex justify-center items-center text-xs sm:text-sm"
              >
                Kembali ke Portal Pendaftaran
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CUSTOM NOTIFICATION MODAL */}
      <AnimatePresence>
        {notifModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 sm:p-7 relative"
            >
              <div
                className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  notifModal.type === "success"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                }`}
              >
                {notifModal.type === "success" ? (
                  <CheckCircle size={28} />
                ) : (
                  <XCircle size={28} />
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                {notifModal.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed whitespace-pre-wrap">
                {notifModal.message}
              </p>
              <button
                type="button"
                onClick={() =>
                  setNotifModal({
                    isOpen: false,
                    type: "success",
                    title: "",
                    message: "",
                  })
                }
                className={`w-full py-3 font-bold rounded-xl text-white text-xs sm:text-sm transition-all ${
                  notifModal.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                OK, Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
