// app/administrasi/inventaris/[id]/page.js
"use client";
import React, { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft, Camera, CalendarDays, Package, CheckCircle2, AlertTriangle, AlertOctagon, Info, FileText, Send, Clock, XCircle, UploadCloud, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function DetailInventarisPage({ params }) {
  const unwrappedParams = use(params);
  const itemId = unwrappedParams.id;
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "foto");

  // State Peminjaman & Kalender
  const [peminjamanList, setPeminjamanList] = useState([]);
  const [currentAvailableStock, setCurrentAvailableStock] = useState(0);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // 🔥 FORM DIPERBARUI DENGAN EMAIL & JAM 🔥
  const [formData, setFormData] = useState({
    namaOrganisasi: "", kegiatan: "", peminjam: "", emailPenyewa: "", 
    jumlahPinjam: 1, waktuPinjam: "", jamPinjam: "", waktuSelesai: "", jamSelesai: ""
  });
  const [suratFile, setSuratFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "-";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, "website_config", "database_administrasi");
        const docSnap = await getDoc(docRef);
        let foundItem = null;
        
        // Membaca URL saat ini dan menerjemahkannya
        const urlParam = decodeURIComponent(itemId); 

        if (docSnap.exists()) {
          const listInventaris = docSnap.data().listInventaris || [];
          // Cari barang berdasarkan Slug ATAU ID (agar kompatibel dengan data lama)
          foundItem = listInventaris.find(i => i.slug === urlParam || i.id === urlParam);
          setItem(foundItem);
        }

        if (foundItem) {
          const q = query(collection(db, "peminjaman_inventaris"), where("itemId", "==", foundItem.id));
          const querySnapshot = await getDocs(q);
          const riwayat = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          riwayat.sort((a, b) => new Date(b.waktuPinjam) - new Date(a.waktuPinjam));
          setPeminjamanList(riwayat);

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let usedStockToday = 0;
          riwayat.forEach(p => {
            if (p.status === "Disetujui") {
              const start = new Date(p.waktuPinjam); start.setHours(0, 0, 0, 0);
              const end = new Date(p.waktuSelesai); end.setHours(23, 59, 59, 999);
              if (today >= start && today <= end) usedStockToday += Number(p.jumlahPinjam || 1);
            }
          });
          const baseStock = Number(foundItem.jumlah || 0);
          setCurrentAvailableStock(Math.max(0, baseStock - usedStockToday));
        }
      } catch (error) { console.error("Gagal mengambil data:", error); } 
      finally { setLoading(false); }
    }
    if (itemId) fetchData();
  }, [itemId]);

  // LOGIKA KALENDER
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
        const start = new Date(p.waktuPinjam); start.setHours(0, 0, 0, 0);
        const end = new Date(p.waktuSelesai); end.setHours(23, 59, 59, 999);
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
    const startReq = new Date(startStr); const endReq = new Date(endStr);
    const baseStock = Number(item.jumlah || 0);

    for (let d = new Date(startReq); d <= endReq; d.setDate(d.getDate() + 1)) {
      let dailyUsed = 0;
      peminjamanList.forEach(p => {
        if (p.status === "Disetujui") {
          const pStart = new Date(p.waktuPinjam); const pEnd = new Date(p.waktuSelesai);
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
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: "POST", body: formDataObj });
      const data = await res.json();
      return data.secure_url; 
    } catch (err) { return null; }
  };

  const handleAjukanPeminjaman = async (e) => {
    e.preventDefault();
    if (Number(formData.jumlahPinjam) < 1) return alert("Jumlah pinjam minimal 1.");
    if (new Date(formData.waktuSelesai) < new Date(formData.waktuPinjam)) return alert("Tanggal Selesai tidak boleh mendahului Tanggal Mulai.");
    if (!checkAvailability(formData.waktuPinjam, formData.waktuSelesai, Number(formData.jumlahPinjam))) {
      return alert(`⚠️ PENGATURAN JADWAL DITOLAK!\n\nPada rentang tanggal tersebut, stok barang tidak mencukupi. Silakan cek kalender.`);
    }
    if (!suratFile) return alert("Harap unggah Surat Permohonan!");

    setIsSubmitting(true);
    try {
      const suratUrl = await uploadSuratToCloudinary(suratFile);
      if (!suratUrl) throw new Error("Gagal mengunggah surat.");

      const payload = {
        itemId: item.id, namaBarang: item.namaBarang,
        ...formData, suratUrl, status: "Diproses", createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "peminjaman_inventaris"), payload);
      setPeminjamanList([{ id: docRef.id, ...payload, createdAt: new Date() }, ...peminjamanList]);
      
      alert("Pengajuan Berhasil! Anda akan menerima email notifikasi saat disetujui.");
      setFormData({ namaOrganisasi: "", kegiatan: "", peminjam: "", emailPenyewa: "", jumlahPinjam: 1, waktuPinjam: "", jamPinjam: "", waktuSelesai: "", jamSelesai: "" });
      setSuratFile(null);
    } catch (error) { alert("Terjadi kesalahan: " + error.message); } 
    finally { setIsSubmitting(false); }
  };

  const getKondisiBadge = (kondisi) => {
    const statusVal = (kondisi || "Baik").trim().toLowerCase();
    if (statusVal === "rusak ringan") return <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"><AlertTriangle size={14}/> Rusak Ringan</span>;
    if (statusVal === "rusak berat") return <span className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"><AlertOctagon size={14}/> Rusak Berat</span>;
    return <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"><CheckCircle2 size={14}/> Baik</span>;
  };

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center"><Loader2 size={40} className="text-blue-600 animate-spin" /></div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl font-bold">Barang Tidak Ditemukan</h1></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow pt-28 pb-16 px-4 max-w-5xl mx-auto w-full">
        <Link href="/administrasi" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 mb-6">
          <ArrowLeft size={16} /> Kembali
        </Link>

        {/* HEADER BARANG */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                 <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-widest">
                   <Package size={14}/> Inventaris PMII
                 </span>
                 {getKondisiBadge(item.kondisi)}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{item.namaBarang}</h1>
              {/* Tambahan whitespace-pre-wrap agar enter terbaca */}
              <p className="text-slate-600 mt-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap max-w-2xl">{item.deskripsi}</p>
           </div>
           <div className="text-center bg-blue-50 px-6 py-4 rounded-xl border border-blue-100 shrink-0 w-full md:w-auto">
              <p className="text-xs font-bold text-blue-600 uppercase mb-1">Stok Hari Ini</p>
              <div className="flex items-baseline justify-center gap-2">
                 <span className={`text-4xl font-black ${currentAvailableStock === 0 ? 'text-red-500' : 'text-slate-800'}`}>
                   {currentAvailableStock}
                 </span>
                 <span className="text-xl font-bold text-slate-400">/ {item.jumlah}</span>
               </div>
           </div>
        </div>

        {/* TAB NAVIGATION DENGAN UKURAN TEXT LEBIH KECIL DI HP */}
        <div className="flex gap-4 border-b border-slate-200 mb-6 overflow-x-auto hide-scrollbar">
          {["foto", "kalender", "pengajuan"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 font-bold text-xs md:text-sm capitalize whitespace-nowrap transition-colors ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
              {tab === "foto" ? "Galeri Foto" : tab === "kalender" ? "Jadwal Kalender" : "Pengajuan"}
            </button>
          ))}
        </div>

        {/* KONTEN TAB */}
        {activeTab === "foto" && (
          <div className="animate-in fade-in duration-300">
            {(!item.fotoGroup || item.fotoGroup.length === 0) ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                <Camera size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="font-bold text-slate-700 text-lg">Foto Belum Tersedia</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {item.fotoGroup.map((fotoUrl, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative w-full pt-[75%] bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                       <img src={fotoUrl} alt={`Foto ${item.namaBarang} ${idx + 1}`} className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB KALENDER KUSTOM */}
        {activeTab === "kalender" && (
          <div className="animate-in fade-in duration-300">
             <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-sm">
               <Info className="text-purple-600 shrink-0 mt-0.5" size={18} />
               <div>
                 <h4 className="text-sm font-bold text-purple-900 mb-1">Informasi Jadwal Real-time</h4>
                 <p className="text-xs text-purple-700 leading-relaxed">
                   Kalender ini terhubung langsung dengan database. Warna blok menunjukkan ketersediaan stok barang pada hari tersebut.
                 </p>
               </div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full p-4 md:p-6">
               <div className="flex justify-between items-center mb-6 px-2">
                 <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm">
                   <ChevronLeft size={20} className="text-slate-600"/>
                 </button>
                 <h3 className="font-black text-slate-800 text-base md:text-lg uppercase tracking-widest">
                   {calendarDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                 </h3>
                 <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm">
                   <ChevronRight size={20} className="text-slate-600"/>
                 </button>
               </div>

               <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-3">
                 {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, i) => (
                   <div key={i} className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 py-2 rounded-md border border-slate-100">{d}</div>
                 ))}
               </div>

               <div className="grid grid-cols-7 gap-1 sm:gap-2">
                 {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-16 md:h-24 bg-slate-50/30 rounded-xl border border-transparent"></div>
                 ))}
                 {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const { status, sisa } = getDayDetails(day);
                    
                    let bgClass = "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100";
                    let badgeClass = "bg-emerald-100 text-emerald-700";
                    let text = "Tersedia";

                    if (status === "Penuh") {
                      bgClass = "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"; badgeClass = "bg-red-200 text-red-800"; text = "Penuh";
                    } else if (status === "Sebagian") {
                      bgClass = "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"; badgeClass = "bg-amber-200 text-amber-800"; text = `Sisa: ${sisa}`;
                    }

                    return (
                       <div key={day} className={`h-16 md:h-24 rounded-lg md:rounded-xl border p-1 md:p-2 flex flex-col justify-between transition-colors shadow-sm ${bgClass}`}>
                          <span className="font-bold text-xs md:text-sm pl-1 pt-1">{day}</span>
                          <span className={`text-[8px] md:text-[10px] font-black uppercase px-1 py-0.5 rounded block text-center truncate ${badgeClass}`}>{text}</span>
                       </div>
                    )
                 })}
               </div>

               <div className="mt-8 flex flex-wrap gap-4 md:gap-6 justify-center text-xs font-semibold text-slate-600 border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200"></div> Stok Utuh</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-50 border border-amber-200"></div> Dipinjam Sebagian</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-50 border border-red-200"></div> Habis Dibooking</div>
               </div>
             </div>
          </div>
        )}

        {/* 🔥 TAB 3: PENGAJUAN PEMINJAMAN (DENGAN INPUT EMAIL & JAM) 🔥 */}
        {activeTab === "pengajuan" && (
          <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                  <FileText className="text-emerald-600"/> Formulir Pengajuan
                </h3>
                
                <form onSubmit={handleAjukanPeminjaman} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Organisasi & PJ */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Organisasi / Lembaga <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.namaOrganisasi} onChange={e => setFormData({...formData, namaOrganisasi: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Contoh: KOPRI PMII" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Peminjam / Penanggung Jawab <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.peminjam} onChange={e => setFormData({...formData, peminjam: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Nama Lengkap PJ" />
                    </div>
                    
                    {/* Email untuk Notif */}
                    <div className="sm:col-span-2 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                      <label className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1.5"><Mail size={14}/> Email Aktif (Untuk Konfirmasi ACC) <span className="text-red-500">*</span></label>
                      <input type="email" required value={formData.emailPenyewa} onChange={e => setFormData({...formData, emailPenyewa: e.target.value})} className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="contoh@gmail.com" />
                      <p className="text-[10px] text-blue-600 mt-1.5">Harap masukkan email yang aktif. Surat balasan ACC akan dikirimkan ke email ini sebagai syarat pengambilan barang.</p>
                    </div>

                    {/* Detail Kegiatan */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Keperluan Kegiatan <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.kegiatan} onChange={e => setFormData({...formData, kegiatan: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Contoh: Pelatihan Kader Dasar" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Jumlah Pinjam Barang Ini <span className="text-red-500">*</span></label>
                      <input type="number" required min="1" max={item.jumlah} value={formData.jumlahPinjam} onChange={e => setFormData({...formData, jumlahPinjam: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    {/* Waktu & Jam Mulai */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <label className="text-xs font-bold text-slate-700 block text-center border-b border-slate-200 pb-2">AMBIL BARANG <span className="text-red-500">*</span></label>
                      <input type="date" required value={formData.waktuPinjam} onChange={e => setFormData({...formData, waktuPinjam: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                      <input type="time" value={formData.jamPinjam} onChange={e => setFormData({...formData, jamPinjam: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" title="Jam Rencana Ambil" />
                    </div>
                    {/* Waktu & Jam Selesai */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <label className="text-xs font-bold text-slate-700 block text-center border-b border-slate-200 pb-2">KEMBALIKAN BARANG <span className="text-red-500">*</span></label>
                      <input type="date" required value={formData.waktuSelesai} onChange={e => setFormData({...formData, waktuSelesai: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                      <input type="time" value={formData.jamSelesai} onChange={e => setFormData({...formData, jamSelesai: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" title="Jam Rencana Kembali" />
                    </div>

                    <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                      <label className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-1.5"><UploadCloud size={14}/> Upload Surat Peminjaman (PDF/Foto) <span className="text-red-500">*</span></label>
                      <input type="file" required accept="image/*, application/pdf" onChange={e => setSuratFile(e.target.files[0])} className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all mt-4 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'}`}>
                    {isSubmitting ? <><Loader2 size={18} className="animate-spin"/> Mengunggah Data...</> : <><Send size={18}/> Ajukan Peminjaman</>}
                  </button>
                </form>
              </div>
            </div>

            {/* STATUS KANAN (RIWAYAT) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Clock className="text-blue-500"/> Status Antrean & Riwayat
                </h3>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {peminjamanList.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">Belum ada riwayat peminjaman untuk barang ini.</div>
                  ) : (
                    peminjamanList.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1 pr-2">{p.namaOrganisasi}</span>
                          {p.status === "Disetujui" ? (
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1 shrink-0"><CheckCircle2 size={10}/> Disetujui</span>
                          ) : p.status === "Ditolak" ? (
                            <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1 shrink-0"><XCircle size={10}/> Ditolak</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1 shrink-0"><Clock size={10}/> Diproses</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mb-3 leading-relaxed line-clamp-2">{p.kegiatan} - PJ: {p.peminjam}</p>
                        <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-200 pt-2.5">
                           <span className="text-slate-500">{formatDisplayDate(p.waktuPinjam)} s/d {formatDisplayDate(p.waktuSelesai)}</span>
                           <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{p.jumlahPinjam} Unit</span>
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