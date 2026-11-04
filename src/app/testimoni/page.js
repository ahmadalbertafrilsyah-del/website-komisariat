"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareQuote,
  ArrowLeft,
  Search,
  Plus,
  X,
  Send,
  Upload,
  Loader2,
  CheckCircle2,
  Filter,
} from "lucide-react";

export const DEFAULT_TESTIMONI_LIST = [
  {
    id: "testi-starter-1",
    nama: "Sahabat M. Rizky Pratama",
    statusPeran: "Alumni PMII",
    rayonAtauInstansi: "Alumni PK. PMII Sunan Ampel Malang",
    angkatan: "2019",
    fotoUrl: "",
    pesan:
      "PMII Sunan Ampel Malang bukan sekadar ruang berorganisasi, melainkan kawah candradimuka tempat kami belajar memadukan kedalaman dzikir, ketajaman fikir, dan keberpihakan nyata lewat amal sholeh.",
    status: "approved",
    createdAt: "2025-01-15T08:00:00.000Z",
  },
  {
    id: "testi-starter-2",
    nama: "Sahabati Nadia Zahra, S.Sos.",
    statusPeran: "Kader KOPRI",
    rayonAtauInstansi: "KOPRI PK. PMII Sunan Ampel Malang",
    angkatan: "2020",
    fotoUrl: "",
    pesan:
      "Lewat ruang kaderisasi SIG dan SKP di lingkungan Komisariat Sunan Ampel, saya menemukan kepercayaan diri untuk bersuara, menulis, dan mengawal isu-isu keadilan gender berlandaskan nilai Aswaja.",
    status: "approved",
    createdAt: "2025-02-01T10:30:00.000Z",
  },
  {
    id: "testi-starter-3",
    nama: "Ahmad Fauzan Al-Farisi",
    statusPeran: "Kader Aktif",
    rayonAtauInstansi: "PR. PMII Kawah Chondrodimuko",
    angkatan: "2023",
    fotoUrl: "",
    pesan:
      "Tradisi diskusi intelektual, bedah buku, dan pendampingan masyarakat di PMII membentuk cara pandang kritis yang tidak saya dapatkan di bangku perkuliahan formal semata.",
    status: "approved",
    createdAt: "2025-02-12T14:15:00.000Z",
  },
  {
    id: "testi-starter-4",
    nama: "Sahabat Bagus Setiawan, M.Pd.",
    statusPeran: "Alumni PMII",
    rayonAtauInstansi: "IKA PMII Sunan Ampel Malang",
    angkatan: "2017",
    fotoUrl: "",
    pesan:
      "Jejaring persahabatan dan etos kerja organisasi yang ditempa di Komisariat Sunan Ampel menjadi bekal paling berharga ketika terjun mengabdi di tengah masyarakat dan dunia profesional.",
    status: "approved",
    createdAt: "2025-02-18T09:00:00.000Z",
  },
  {
    id: "testi-starter-5",
    nama: "Sahabati Siti Nurhaliza",
    statusPeran: "Pengurus Rayon / Komisariat",
    rayonAtauInstansi: "PK. PMII Sunan Ampel Malang",
    angkatan: "2022",
    fotoUrl: "",
    pesan:
      "Di PMII kami diajarkan bahwa ilmu pengetahuan harus memiliki daya ubah sosial. Setiap kajian dan gerakan selalu bermuara pada kemaslahatan umat dan bangsa.",
    status: "approved",
    createdAt: "2025-02-22T16:40:00.000Z",
  },
  {
    id: "testi-starter-6",
    nama: "M. Ilham Maulana",
    statusPeran: "Kader Aktif",
    rayonAtauInstansi: "PR. PMII Sunan Bonang",
    angkatan: "2024",
    fotoUrl: "",
    pesan:
      "Sejak mengikuti MAPABA, saya merasakan kekeluargaan yang hangat sekaligus bimbingan intelektual yang terarah dari para senior dan pengurus rayon maupun komisariat.",
    status: "approved",
    createdAt: "2025-03-01T11:20:00.000Z",
  },
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PK";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function TestimoniPublicPage() {
  const [allTestimoni, setAllTestimoni] = useState(DEFAULT_TESTIMONI_LIST);
  const [loading, setLoading] = useState(true);

  // Filter & Pencarian
  const [selectedRole, setSelectedRole] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // State Form Kirim Testimoni
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    statusPeran: "Kader Aktif",
    rayonAtauInstansi: "",
    angkatan: "",
    fotoUrl: "",
    pesan: "",
  });

  useEffect(() => {
    async function fetchTestimoni() {
      try {
        const docRef = doc(db, "website_config", "database_testimoni");
        const docSnap = await getDoc(docRef);
        if (
          docSnap.exists() &&
          Array.isArray(docSnap.data().listTestimoni) &&
          docSnap.data().listTestimoni.length > 0
        ) {
          setAllTestimoni(docSnap.data().listTestimoni);
        }
      } catch (err) {
        console.error("Gagal memuat testimoni:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTestimoni();
  }, []);

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, fotoUrl: data.url }));
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.pesan.trim()) return;

    setSubmitting(true);
    try {
      const docRef = doc(db, "website_config", "database_testimoni");
      const docSnap = await getDoc(docRef);
      const existingList =
        docSnap.exists() && Array.isArray(docSnap.data().listTestimoni)
          ? docSnap.data().listTestimoni
          : allTestimoni;

      const newEntry = {
        id: `testi-${Date.now()}`,
        nama: formData.nama.trim(),
        statusPeran: formData.statusPeran || "Kader Aktif",
        rayonAtauInstansi: formData.rayonAtauInstansi.trim(),
        angkatan: formData.angkatan.trim(),
        fotoUrl: formData.fotoUrl.trim(),
        pesan: formData.pesan.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const updated = [newEntry, ...existingList];
      await setDoc(docRef, { listTestimoni: updated }, { merge: true });
      setAllTestimoni(updated);
      setFormData({
        nama: "",
        statusPeran: "Kader Aktif",
        rayonAtauInstansi: "",
        angkatan: "",
        fotoUrl: "",
        pesan: "",
      });
      setSubmitSuccess(true);
    } catch (err) {
      console.error("Gagal mengirim testimoni:", err);
      alert("Gagal mengirim kata-kata. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const approvedList = useMemo(() => {
    return allTestimoni.filter(
      (item) => item.status === "approved" || !item.status
    );
  }, [allTestimoni]);

  const roleCategories = useMemo(() => {
    const roles = new Set(
      approvedList.map((item) => item.statusPeran || "Kader PMII")
    );
    return ["Semua", ...Array.from(roles)];
  }, [approvedList]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return approvedList.filter((item) => {
      const matchRole =
        selectedRole === "Semua" ||
        (item.statusPeran || "Kader PMII") === selectedRole;
      const matchQuery =
        !q ||
        (item.nama || "").toLowerCase().includes(q) ||
        (item.pesan || "").toLowerCase().includes(q) ||
        (item.rayonAtauInstansi || "").toLowerCase().includes(q) ||
        (item.angkatan || "").toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [approvedList, selectedRole, searchQuery]);

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070d19] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      {/* ================= HERO HEADER ================= */}
      <section className="relative pt-24 md:pt-28 pb-10 md:pb-14 bg-[#070e1c] text-white border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-300 hover:text-yellow-400 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>KEMBALI KE BERANDA</span>
            </Link>
            <span className="text-[11px] font-mono text-yellow-400 uppercase tracking-widest">
              SUARA KADER, ALUMNI & TOKOH
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                <MessageSquareQuote className="w-3.5 h-3.5" />
                <span>Refleksi Pergerakan</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Apa Kata Mereka{" "}
                <span className="text-yellow-400">Tentang PMII?</span>
              </h1>
              <p className="text-xs sm:text-base text-slate-300/90 mt-2.5 leading-relaxed">
                Kumpulan kesan, pesan, dan refleksi perjalanan berproses di PK.
                PMII Sunan Ampel Malang dari lintas angkatan dan rayon.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
                Total Tayang:{" "}
                <strong className="text-yellow-400">
                  {approvedList.length}
                </strong>{" "}
                Suara
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm((prev) => !prev);
                  setSubmitSuccess(false);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-yellow-400/10"
              >
                {showForm ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>Tutup Form Isian</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tulis Kata-Kata Anda</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= KONTEN UTAMA ================= */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 space-y-6">
        {/* Notifikasi Sukses Kirim */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start sm:items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Kata-Kata Anda Berhasil Dikirim!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300/90 mt-0.5">
                    Kiriman Anda telah masuk ke sistem dan menunggu persetujuan
                    (ACC) Admin sebelum ditampilkan secara publik.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline self-end sm:self-center"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Isian */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form
                onSubmit={handleSubmit}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-yellow-400 block">
                      Formulir Kontribusi Suara
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Bagikan Kesan & Pandangan Anda Tentang PMII
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                    Moderasi Admin (ACC)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) =>
                        setFormData({ ...formData, nama: e.target.value })
                      }
                      placeholder="Nama lengkap Anda..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status / Peran *
                    </label>
                    <select
                      value={formData.statusPeran}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statusPeran: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="Kader Aktif">Kader Aktif</option>
                      <option value="Alumni PMII">Alumni PMII</option>
                      <option value="Pengurus Rayon / Komisariat">
                        Pengurus Rayon / Komisariat
                      </option>
                      <option value="Kader KOPRI">Kader KOPRI</option>
                      <option value="Tokoh / Mabincab / Dosen">
                        Tokoh / Mabincab / Dosen
                      </option>
                      <option value="Mahasiswa / Umum">Mahasiswa / Umum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Asal Rayon / Instansi
                    </label>
                    <input
                      type="text"
                      value={formData.rayonAtauInstansi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rayonAtauInstansi: e.target.value,
                        })
                      }
                      placeholder="Contoh: PR. PMII Kawah Chondrodimuko"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tahun Angkatan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.angkatan}
                      onChange={(e) =>
                        setFormData({ ...formData, angkatan: e.target.value })
                      }
                      placeholder="Contoh: 2022"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kata-Kata / Kesan & Pesan Tentang PMII *
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={450}
                    value={formData.pesan}
                    onChange={(e) =>
                      setFormData({ ...formData, pesan: e.target.value })
                    }
                    placeholder="Tuliskan kesan, refleksi, atau pesan Anda tentang PMII..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                      {uploadingFoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" />
                      )}
                      <span>
                        {uploadingFoto
                          ? "Mengunggah Foto..."
                          : formData.fotoUrl
                          ? "Ganti Foto Profil"
                          : "Upload Foto (Opsional)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadFoto}
                        className="hidden"
                      />
                    </label>
                    {formData.fotoUrl && (
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Foto terlampir
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || uploadingFoto}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>
                      {submitting ? "Mengirim..." : "Kirim Kata-Kata"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bar Filter & Pencarian */}
        <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, rayon/instansi, angkatan, atau isi kutipan..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-yellow-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0 hidden sm:inline" />
            {roleCategories.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedRole === role
                    ? "bg-blue-600 dark:bg-yellow-400 text-white dark:text-slate-950"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Semua Kartu Kutipan */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600 dark:text-yellow-400" />
            <span className="text-xs font-mono uppercase tracking-widest">
              Memuat Suara Pergerakan...
            </span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white dark:bg-[#0d1526] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 text-sm">
            Tidak ditemukan kutipan yang sesuai dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {filteredList.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
                className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1526] hover:border-blue-500/50 dark:hover:border-yellow-400/50 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-blue-600/10 dark:bg-yellow-400/10 text-blue-700 dark:text-yellow-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider truncate">
                      {item.statusPeran || "Kader PMII"}
                    </span>
                    <MessageSquareQuote className="w-4 h-4 text-slate-300 dark:text-slate-700 shrink-0" />
                  </div>

                  <p className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed italic">
                    &ldquo;{item.pesan}&rdquo;
                  </p>
                </div>

                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/90 flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-yellow-400 font-black text-[11px] sm:text-xs flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                    {item.fotoUrl ? (
                      <img
                        src={item.fotoUrl}
                        alt={item.nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(item.nama)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.nama}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.rayonAtauInstansi || "PK. PMII Sunan Ampel"}
                      {item.angkatan ? ` • ${item.angkatan}` : ""}
                    </p>
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

