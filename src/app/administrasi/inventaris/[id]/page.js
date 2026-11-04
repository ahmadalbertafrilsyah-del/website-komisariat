// app/administrasi/inventaris/[id]/page.js
"use client";
import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Loader2, ArrowLeft, Camera, CalendarDays, Package, CheckCircle2,
  AlertTriangle, AlertOctagon, Info, FileText, Send, Clock, XCircle,
  UploadCloud, ChevronLeft, ChevronRight, Mail
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function DetailInventarisPage({ params }) {
  const unwrappedParams = use(params);
  const itemId = unwrappedParams.id;
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "foto");

  const [peminjamanList, setPeminjamanList] = useState([]);
  const [currentAvailableStock, setCurrentAvailableStock] = useState(0);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [formData, setFormData] = useState({
    namaOrganisasi: "",
    kegiatan: "",
    peminjam: "",
    emailPenyewa: "",
    jumlahPinjam: 1,
    waktuPinjam: "",
    jamPinjam: "",
    waktuSelesai: "",
    jamSelesai: ""
  });
  const [suratFile, setSuratFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "-";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        let foundItem = null;

        const urlParam = decodeURIComponent(itemId);

        if (docSnap.exists()) {
          const listInventaris = docSnap.data().listInventaris || [];
          foundItem = listInventaris.find(i => i.slug === urlParam || i.id === urlParam);
          setItem(foundItem);
        }

        if (foundItem) {
          const q = query(collection(db, "peminjaman_inventaris"), where("itemId", "==", foundItem.id));
          const querySnapshot = await getDocs(q);
          const riwayat = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          riwayat.sort((a, b) => new Date(b.waktuPinjam) - new Date(a.waktuPinjam));
          setPeminjamanList(riwayat);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let usedStockToday = 0;
          riwayat.forEach(p => {
            if (p.status === "Disetujui") {
              const start = new Date(p.waktuPinjam);
              start.setHours(0, 0, 0, 0);
              const end = new Date(p.waktuSelesai);
              end.setHours(23, 59, 59, 999);
              if (today >= start && today <= end) usedStockToday += Number(p.jumlahPinjam || 1);
            }
          });
          const baseStock = Number(foundItem.jumlah || 0);
          setCurrentAvailableStock(Math.max(0, baseStock - usedStockToday));
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    }
    if (itemId) fetchData();
  }, [itemId]);

  const month = calendarDate.getMonth();
  const year = calendarDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const getDayDetails = (day) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    let used = 0;

    peminjamanList.forEach(p => {
      if (p.status === "Disetujui") {
        const start = new Date(p.waktuPinjam);
        start.setHours(0, 0, 0, 0);
        const end = new Date(p.waktuSelesai);
        end.setHours(23, 59, 59, 999);
        if (d >= start && d <= end) used += Number(p.jumlahPinjam || 1);
      }
    });

    const total = Number(item?.jumlah || 0);
    const sisa = Math.max(0, total - used);

    let status = "Tersedia";
    if (used >= total) status = "Penuh";
    else if (used > 0) status = "Sebagian";

    return { status, sisa, total };
  };

  const checkAvailability = (startStr, endStr, reqJumlah) => {
    const startReq = new Date(startStr);
    const endReq = new Date(endStr);
    const baseStock = Number(item.jumlah || 0);

    for (let d = new Date(startReq); d <= endReq; d.setDate(d.getDate() + 1)) {
      let dailyUsed = 0;
      peminjamanList.forEach(p => {
        if (p.status === "Disetujui") {
          const pStart = new Date(p.waktuPinjam);
          const pEnd = new Date(p.waktuSelesai);
          if (d >= pStart && d <= pEnd) dailyUsed += Number(p.jumlahPinjam || 1);
        }
      });
      if (baseStock - dailyUsed < reqJumlah) return false;
    }
    return true;
  };

  const uploadSuratToCloudinary = async (file) => {
    if (!file) return null;
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    formDataObj.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formDataObj
      });
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      return null;
    }
  };

  const handleAjukanPeminjaman = async (e) => {
    e.preventDefault();
    if (Number(formData.jumlahPinjam) < 1) return alert("Jumlah pinjam minimal 1.");
    if (new Date(formData.waktuSelesai) < new Date(formData.waktuPinjam)) return alert("Tanggal Selesai tidak boleh mendahului Tanggal Mulai.");
    if (!checkAvailability(formData.waktuPinjam, formData.waktuSelesai, Number(formData.jumlahPinjam))) {
      return alert("PENGATURAN JADWAL DITOLAK!\n\nPada rentang tanggal tersebut, stok barang tidak mencukupi. Silakan cek kalender ketersediaan.");
    }
    if (!suratFile) return alert("Harap unggah Surat Permohonan!");

    setIsSubmitting(true);
    try {
      const suratUrl = await uploadSuratToCloudinary(suratFile);
      if (!suratUrl) throw new Error("Gagal mengunggah surat.");

      const payload = {
        itemId: item.id,
        namaBarang: item.namaBarang,
        ...formData,
        suratUrl,
        status: "Diproses",
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "peminjaman_inventaris"), payload);
      setPeminjamanList([{ id: docRef.id, ...payload, createdAt: new Date() }, ...peminjamanList]);

      alert("Pengajuan Berhasil! Anda akan menerima email notifikasi saat disetujui.");
      setFormData({
        namaOrganisasi: "",
        kegiatan: "",
        peminjam: "",
        emailPenyewa: "",
        jumlahPinjam: 1,
        waktuPinjam: "",
        jamPinjam: "",
        waktuSelesai: "",
        jamSelesai: ""
      });
      setSuratFile(null);
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getKondisiBadge = (kondisi) => {
    const statusVal = (kondisi || "Baik").trim().toLowerCase();
    if (statusVal === "rusak ringan")
      return (
        <span className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
          <AlertTriangle size={13} /> Rusak Ringan
        </span>
      );
    if (statusVal === "rusak berat")
      return (
        <span className="inline-flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 text-red-300 px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
          <AlertOctagon size={13} /> Rusak Berat
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
        <CheckCircle2 size={13} /> Kondisi Baik
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex justify-center items-center">
        <Loader2 size={36} className="text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center pt-24 text-center px-4">
          <Package size={48} className="text-slate-400 mb-3" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">Barang Tidak Ditemukan</h1>
          <Link href="/administrasi?tab=inventaris" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold mt-2">
            Kembali ke Inventaris
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* HEADER DARK BANNER */}
      <section className="pt-28 md:pt-32 pb-12 px-4 sm:px-6 bg-[#020617] text-white border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <Link
            href="/administrasi?tab=inventaris"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-[#facc15] mb-5 transition"
          >
            <ArrowLeft size={15} /> Kembali ke Inventaris Barang
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/30 text-[#facc15] px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest">
                  <Package size={13} /> Aset Inventaris PMII
                </span>
                {getKondisiBadge(item.kondisi)}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">{item.namaBarang}</h1>
              {item.deskripsi && (
                <p className="text-slate-300 mt-2.5 text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-wrap max-w-2xl">
                  {item.deskripsi}
                </p>
              )}
            </div>

            <div className="bg-slate-900/90 px-6 py-4 rounded-2xl border border-slate-800 shrink-0 w-full md:w-auto text-center">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Stok Tersedia Hari Ini</p>
              <div className="flex items-baseline justify-center gap-1.5 font-mono">
                <span className={`text-3xl sm:text-4xl font-black ${currentAvailableStock === 0 ? "text-red-400" : "text-[#facc15]"}`}>
                  {currentAvailableStock}
                </span>
                <span className="text-lg font-bold text-slate-400">/ {item.jumlah} Unit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-grow py-8 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        {/* TAB NAVIGATION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl flex gap-1.5 mb-6 overflow-x-auto shadow-sm">
          {[
            { id: "foto", label: "Galeri Foto Barang", icon: Camera },
            { id: "kalender", label: "Jadwal & Ketersediaan", icon: CalendarDays },
            { id: "pengajuan", label: "Formulir Peminjaman", icon: FileText }
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#020617] dark:bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon size={15} className={isActive ? "text-[#facc15]" : ""} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* KONTEN TAB 1: FOTO */}
        {activeTab === "foto" && (
          <div>
            {(!item.fotoGroup || item.fotoGroup.length === 0) ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center shadow-sm">
                <Camera size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">Dokumentasi Foto Belum Tersedia</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {item.fotoGroup.map((fotoUrl, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 shadow-sm">
                    <div className="relative w-full pt-[75%] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                      <Image
                        src={fotoUrl}
                        alt={`Foto ${item.namaBarang} ${idx + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KONTEN TAB 2: KALENDER KUSTOM */}
        {activeTab === "kalender" && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 flex items-start gap-3">
              <Info className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-0.5">Ketersediaan Jadwal Real-Time</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Kalender ini terhubung langsung dengan antrean peminjaman yang telah disetujui. Pastikan stok masih tersedia sebelum mengajukan tanggal peminjaman.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full p-4 sm:p-6">
              <div className="flex justify-between items-center mb-5">
                <button
                  onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <h3 className="font-mono font-black text-slate-900 dark:text-white text-sm sm:text-base uppercase tracking-widest">
                  {calendarDate.toLocaleString("id-ID", { month: "long", year: "numeric" })}
                </h3>
                <button
                  onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, i) => (
                  <div
                    key={i}
                    className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 uppercase py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-14 sm:h-20 bg-slate-50/40 dark:bg-slate-950/30 rounded-xl" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const { status, sisa } = getDayDetails(day);

                  let bgClass = "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300";
                  let badgeClass = "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300";
                  let text = "Utuh";

                  if (status === "Penuh") {
                    bgClass = "bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300";
                    badgeClass = "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300";
                    text = "Penuh";
                  } else if (status === "Sebagian") {
                    bgClass = "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300";
                    badgeClass = "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300";
                    text = `Sisa ${sisa}`;
                  }

                  return (
                    <div key={day} className={`h-14 sm:h-20 rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between ${bgClass}`}>
                      <span className="font-mono font-bold text-xs">{day}</span>
                      <span className={`text-[8px] sm:text-[10px] font-mono font-bold uppercase px-1 py-0.5 rounded block text-center truncate ${badgeClass}`}>
                        {text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* KONTEN TAB 3: PENGAJUAN PEMINJAMAN */}
        {activeTab === "pengajuan" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-7">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-5 border-b border-slate-100 dark:border-slate-800 pb-3.5 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" /> Formulir Peminjaman Inventaris
                </h3>

                <form onSubmit={handleAjukanPeminjaman} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                        Nama Organisasi / Lembaga <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.namaOrganisasi}
                        onChange={e => setFormData({ ...formData, namaOrganisasi: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                        placeholder="Contoh: PR PMII Rayon Kawah Chondrodimuko"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                        Nama Peminjam / Penanggung Jawab <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.peminjam}
                        onChange={e => setFormData({ ...formData, peminjam: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                        placeholder="Nama Lengkap PJ"
                      />
                    </div>

                    <div className="sm:col-span-2 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900 p-4 rounded-xl">
                      <label className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                        <Mail size={14} /> Email Aktif (Penerima Notifikasi ACC) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.emailPenyewa}
                        onChange={e => setFormData({ ...formData, emailPenyewa: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                        placeholder="contoh@gmail.com"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                        Keperluan Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.kegiatan}
                        onChange={e => setFormData({ ...formData, kegiatan: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                        placeholder="Contoh: MAPABA / PKD"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                        Jumlah Unit Dipinjam <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={item.jumlah}
                        value={formData.jumlahPinjam}
                        onChange={e => setFormData({ ...formData, jumlahPinjam: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                      <label className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 block uppercase">
                        WAKTU AMBIL BARANG <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.waktuPinjam}
                        onChange={e => setFormData({ ...formData, waktuPinjam: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm"
                      />
                      <input
                        type="time"
                        value={formData.jamPinjam}
                        onChange={e => setFormData({ ...formData, jamPinjam: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                      <label className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 block uppercase">
                        WAKTU PENGEMBALIAN <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.waktuSelesai}
                        onChange={e => setFormData({ ...formData, waktuSelesai: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm"
                      />
                      <input
                        type="time"
                        value={formData.jamSelesai}
                        onChange={e => setFormData({ ...formData, jamSelesai: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <UploadCloud size={15} /> Unggah Surat Peminjaman (PDF/Gambar) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        required
                        accept="image/*, application/pdf"
                        onChange={e => setSuratFile(e.target.files[0])}
                        className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 w-full file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all ${
                      isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" /> Mengirim Permohonan...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Kirim Pengajuan Peminjaman
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* STATUS KANAN (RIWAYAT) */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Clock size={17} className="text-blue-600" /> Antrean & Riwayat Peminjaman
                </h3>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {peminjamanList.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Belum ada riwayat peminjaman untuk barang ini.
                    </div>
                  ) : (
                    peminjamanList.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{p.namaOrganisasi}</span>
                          {p.status === "Disetujui" ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 shrink-0">
                              <CheckCircle2 size={10} /> Disetujui
                            </span>
                          ) : p.status === "Ditolak" ? (
                            <span className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 shrink-0">
                              <XCircle size={10} /> Ditolak
                            </span>
                          ) : (
                            <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 shrink-0">
                              <Clock size={10} /> Diproses
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 line-clamp-2">
                          {p.kegiatan} • PJ: {p.peminjam}
                        </p>
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold border-t border-slate-200/70 dark:border-slate-800 pt-2">
                          <span className="text-slate-500">
                            {formatDisplayDate(p.waktuPinjam)} – {formatDisplayDate(p.waktuSelesai)}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                            {p.jumlahPinjam} Unit
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
